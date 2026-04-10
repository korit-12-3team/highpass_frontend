"use client";

import type { UserProfile } from "@/lib/AppContext";
import { http } from "@/lib/http";
import { mapApiRecordToUserProfile } from "@/lib/profile";

function unwrapData(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  if (!("data" in payload)) return payload;
  return (payload as { data?: unknown }).data;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const response = await http.get(`/api/users/${encodeURIComponent(userId)}`);
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") return null;
  return mapApiRecordToUserProfile(payload as Parameters<typeof mapApiRecordToUserProfile>[0]);
}
