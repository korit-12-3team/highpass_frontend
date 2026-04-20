"use client";

import { API_BASE_URL } from "@/services/config/config";
import type { UserProfile } from "@/entities/common/types";
const AUTH_EXPIRED_EVENT = "hp-auth-expired";

let refreshPromise: Promise<boolean> | null = null;

function isNumericId(value: unknown): boolean {
  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  return /^\d+$/.test(str.trim());
}

function mapCurrentUserPayload(payload: Record<string, unknown>): UserProfile | null {
  const id = payload.userId ?? payload.id ?? "";
  const nickname = typeof payload.nickname === "string" ? payload.nickname : "";
  if (!isNumericId(id) || !nickname) return null;

  const location =
    typeof payload.location === "string"
      ? payload.location
      : [payload.siDo, payload.gunGu].filter((value) => typeof value === "string" && value).join(" ");

  return {
    id: String(id),
    email: typeof payload.email === "string" ? payload.email : undefined,
    nickname,
    name: typeof payload.name === "string" && payload.name ? payload.name : nickname,
    ageRange: typeof payload.ageRange === "string" ? payload.ageRange : "",
    gender: typeof payload.gender === "string" ? payload.gender : "",
    location,
    profileImage:
      typeof payload.profileImage === "string"
        ? payload.profileImage
        : typeof payload.profileImageUrl === "string"
          ? payload.profileImageUrl
          : null,
    loginType: typeof payload.loginType === "string" ? payload.loginType : "local",
  };
}

export async function fetchCurrentUserProfile(): Promise<UserProfile | null> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/users/me`, {
    method: "GET",
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("현재 사용자 정보를 불러오지 못했습니다.");
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return mapCurrentUserPayload(payload);
}

export function notifyAuthExpired() {
  if (typeof window === "undefined") return;
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
