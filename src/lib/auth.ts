"use client";

import { API_BASE_URL } from "@/lib/config";
import type { UserProfile } from "@/lib/AppContext";

const AUTH_STORAGE_KEY = "hp_auth_user";
const AUTH_EXPIRED_EVENT = "hp-auth-expired";

let refreshPromise: Promise<boolean> | null = null;

type AuthSession = {
  user: UserProfile;
};

function isNumericId(value: unknown): boolean {
  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  return /^\d+$/.test(str.trim());
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    // Reject legacy sessions where user.id was stored as email (boards API requires numeric userId).
    if (!session?.user || !isNumericId(session.user.id)) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuthSession(user: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function notifyAuthExpired() {
  if (typeof window === "undefined") return;
  clearAuthSession();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export function subscribeAuthExpired(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(AUTH_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
}

export async function logoutSession() {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        notifyAuthExpired();
        return false;
      }

      return true;
    } catch {
      notifyAuthExpired();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function shouldSkipRefresh(url: string) {
  return ["/api/auth/login", "/api/auth/signup", "/api/auth/logout", "/api/auth/refresh"].some((path) => url.includes(path));
}

export async function fetchWithAuth(input: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
  });

  if (response.status !== 401 || !retry || shouldSkipRefresh(input)) {
    if (response.status === 401 && shouldSkipRefresh(input)) notifyAuthExpired();
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) return response;

  return fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
  });
}
