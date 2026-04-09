"use client";

import { API_BASE_URL } from "@/lib/config";
import type { UserProfile } from "@/lib/AppContext";

const AUTH_STORAGE_KEY = "hp_auth_user";

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

export async function logoutSession() {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}
