import { cookies } from "next/headers";
import { API_BASE_URL } from "@/services/config/config";
import type { UserProfile } from "@/entities/common/types";
import { mapApiRecordToUserProfile, unwrapData, type UserApiRecord } from "@/features/mypage/api/profile";

export async function getUserProfileServer(userId: string): Promise<UserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = unwrapData(await response.json());
  if (!payload || typeof payload !== "object") return null;
  return mapApiRecordToUserProfile(payload as UserApiRecord);
}

export async function getCurrentUserProfileServer(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  if (response.status === 401 || !response.ok) return null;

  const payload = unwrapData(await response.json());
  if (!payload || typeof payload !== "object") return null;
  return mapApiRecordToUserProfile(payload as UserApiRecord);
}
