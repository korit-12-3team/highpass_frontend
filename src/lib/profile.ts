"use client";

import type { UserProfile } from "@/lib/AppContext";
import { http } from "@/lib/http";

type UserApiRecord = {
  id?: string | number;
  userId?: string | number;
  email?: unknown;
  nickname?: unknown;
  name?: unknown;
  ageGroup?: unknown;
  ageRange?: unknown;
  gender?: unknown;
  location?: unknown;
  siDo?: unknown;
  sido?: unknown;
  gunGu?: unknown;
  sigungu?: unknown;
  profileImage?: unknown;
  profileImageUrl?: unknown;
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
  const ageGroup = safeString(record.ageGroup ?? record.ageRange, "미등록");
  const gender = safeString(record.gender, "미등록");

  const location =
    safeString(record.location, "") ||
    `${safeString(record.siDo ?? record.sido, "")} ${safeString(record.gunGu ?? record.sigungu, "")}`.trim() ||
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
    ageGroup,
    gender,
    location,
    profileImage,
    loginType: "local",
  };
}

export async function updateUserProfile(
  userId: string,
  input: {
    nickname: string;
    ageRange: string;
    gender: string;
    siDo: string;
    gunGu: string;
  },
): Promise<UserProfile> {
  const response = await http.put(`/api/users/${encodeURIComponent(userId)}`, input);
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") {
    throw new Error("프로필 수정 응답이 비어 있습니다.");
  }
  return mapApiRecordToUserProfile(payload as UserApiRecord);
}
