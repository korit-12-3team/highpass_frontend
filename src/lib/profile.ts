"use client";

import type { UserProfile } from "@/lib/AppContext";
import { http } from "@/lib/http";

type UserApiRecord = {
  id?: string | number;
  userId?: string | number;
  email?: unknown;
  nickname?: unknown;
  name?: unknown;
  ageRange?: unknown;
  gender?: unknown;
  location?: unknown;
  siDo?: unknown;
  gunGu?: unknown;
  profileImage?: unknown;
  profileImageUrl?: unknown;
  loginType?: unknown;
};

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function unwrapData(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  if (!("data" in payload)) return payload;
  return (payload as { data?: unknown }).data;
}

export function mapApiRecordToUserProfile(record: UserApiRecord): UserProfile {
  const id = record.userId ?? record.id ?? "";
  const nickname = safeString(record.nickname, "");
  const name = safeString(record.name, nickname || "사용자");
  const email = typeof record.email === "string" ? record.email : undefined;
  const ageRange = safeString(record.ageRange, "미등록");
  const gender = safeString(record.gender, "미등록");

  const location =
    safeString(record.location, "") ||
    `${safeString(record.siDo, "")} ${safeString(record.gunGu, "")}`.trim() ||
    "미등록";

  const profileImage =
    typeof record.profileImage === "string"
      ? record.profileImage
      : typeof record.profileImageUrl === "string"
        ? record.profileImageUrl
        : null;

  return {
    id: safeString(id),
    email,
    nickname: nickname || "사용자",
    name,
    ageRange,
    gender,
    location,
    profileImage,
    loginType: safeString(record.loginType, "local"),
  };
}

export async function updateUserProfile(
  userId: string,
  input: {
    currentPassword: string;
    nickname: string;
    ageRange: string;
    gender: string;
    siDo: string;
    gunGu: string;
  },
): Promise<UserProfile> {
  const response = await http.patch(`/api/users/${encodeURIComponent(userId)}`, input);
  const payload = unwrapData(response.data);

  if (!payload || typeof payload !== "object") {
    throw new Error("프로필 수정 응답이 비어 있습니다.");
  }

  return mapApiRecordToUserProfile(payload as UserApiRecord);
}

export async function updateUserPassword(
  userId: string,
  input: {
    currentPassword: string;
    newPassword: string;
  },
): Promise<void> {
  await http.patch(`/api/users/${encodeURIComponent(userId)}/password`, input);
}
