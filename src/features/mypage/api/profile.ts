import { http } from "@/services/api/http";
import type { UserProfile } from "@/entities/common/types";

export const AGE_RANGE_OPTIONS = ["10대", "20대", "30대", "40대", "50대+"];
export const GENDER_OPTIONS = ["남성", "여성"];

export type UserApiRecord = {
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
  socialProvider?: unknown;
};

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

export function unwrapData(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  if (!("data" in payload)) return payload;
  return (payload as { data?: unknown }).data;
}

function buildLocation(siDo?: unknown, gunGu?: unknown, location?: unknown) {
  return safeString(location, "") || `${safeString(siDo, "")} ${safeString(gunGu, "")}`.trim();
}

export function createUserProfile(input: Partial<UserProfile> & Pick<UserProfile, "id" | "nickname">): UserProfile {
  const nickname = safeString(input.nickname, "사용자");

  return {
    id: safeString(input.id),
    email: typeof input.email === "string" ? input.email : undefined,
    nickname,
    name: safeString(input.name, nickname),
    ageRange: safeString(input.ageRange),
    gender: safeString(input.gender),
    location: safeString(input.location),
    profileImage:
      typeof input.profileImage === "string" || input.profileImage === null ? input.profileImage : null,
    loginType: safeString(input.loginType, "local"),
    socialProvider: safeString(input.socialProvider),
  };
}

export function mapApiRecordToUserProfile(record: UserApiRecord): UserProfile {
  const profileImage =
    typeof record.profileImage === "string"
      ? record.profileImage
      : typeof record.profileImageUrl === "string"
        ? record.profileImageUrl
        : null;

  return createUserProfile({
    id: safeString(record.userId ?? record.id ?? ""),
    email: typeof record.email === "string" ? record.email : undefined,
    nickname: safeString(record.nickname),
    name: safeString(record.name),
    ageRange: safeString(record.ageRange),
    gender: safeString(record.gender),
    location: buildLocation(record.siDo, record.gunGu, record.location),
    profileImage,
    loginType: safeString(record.loginType, "local"),
    socialProvider: safeString(record.socialProvider),
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const response = await http.get(`/api/users/${encodeURIComponent(userId)}`);
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") return null;
  return mapApiRecordToUserProfile(payload as UserApiRecord);
}

export async function updateUserProfile(
  userId: string,
  input: {
    currentPassword?: string;
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

export async function verifyUserPassword(
  userId: string,
  input: {
    currentPassword: string;
  },
): Promise<void> {
  await http.post(`/api/users/${encodeURIComponent(userId)}/password/verify`, input);
}
