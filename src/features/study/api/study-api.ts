import type { BoardPost } from "@/entities/common/types";
import { http } from "@/services/api/http";

type StudyApiRecord = {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  userId?: unknown;
  nickname?: unknown;
  locationName?: unknown;
  cert?: unknown;
  address?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  viewCount?: unknown;
  likeCount?: unknown;
  likedByUser?: unknown;
  createdAt?: unknown;
};

function unwrapData(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  if (!("data" in payload)) return payload;
  return (payload as { data: unknown }).data;
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function safeNumber(value: unknown, fallback = 0) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function mapStudyRecordToBoardPost(record: StudyApiRecord): BoardPost {
  return {
    id: safeString(record.id, String(Date.now())),
    type: "study",
    title: safeString(record.title),
    content: safeString(record.content),
    author: safeString(record.nickname, "Unknown"),
    authorId: safeString(record.userId),
    createdAt: safeString(record.createdAt, new Date().toISOString()),
    views: safeNumber(record.viewCount),
    likes: safeNumber(record.likeCount),
    scraps: 0,
    comments: [],
    cert: safeString(record.cert) || null,
    location: safeString(record.locationName ?? record.address),
    lat: typeof record.latitude === "number" ? record.latitude : undefined,
    lng: typeof record.longitude === "number" ? record.longitude : undefined,
    likedByUser: typeof record.likedByUser === "boolean" ? record.likedByUser : undefined,
  };
}

export async function listStudies(userId?: string): Promise<BoardPost[]> {
  const response = await http.get("/api/study", {
    params: userId ? { userId } : undefined,
  });
  const payload = unwrapData(response.data);
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapStudyRecordToBoardPost(item as StudyApiRecord));
}

export async function getStudy(studyId: string, userId?: string): Promise<BoardPost | null> {
  const response = await http.get(`/api/study/${encodeURIComponent(studyId)}`, {
    params: userId ? { userId } : undefined,
  });
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") return null;
  return mapStudyRecordToBoardPost(payload as StudyApiRecord);
}

export async function createStudy(input: {
  userId: string;
  author: string;
  title: string;
  content: string;
  cert?: string | null;
  locationName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}): Promise<BoardPost> {
  const userIdPath = encodeURIComponent(input.userId);
  const payload = {
    title: input.title,
    content: input.content,
    cert: input.cert ?? null,
    locationName: input.locationName ?? input.address ?? "",
    address: input.address ?? input.locationName ?? "",
    latitude: input.latitude ?? 0,
    longitude: input.longitude ?? 0,
    placeId: input.placeId ?? "LOCAL_PLACE",
  };

  const response = await http.post(`/api/study/${userIdPath}`, payload);
  const responsePayload = unwrapData(response.data);

  if (!responsePayload || typeof responsePayload !== "object") {
    return {
      id: String(Date.now()),
      type: "study",
      title: input.title,
      content: input.content,
      author: input.author,
      authorId: input.userId,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      scraps: 0,
      comments: [],
      cert: input.cert ?? null,
      location: input.locationName ?? input.address,
      lat: input.latitude,
      lng: input.longitude,
      likedByUser: false,
    };
  }

  return mapStudyRecordToBoardPost(responsePayload as StudyApiRecord);
}

export async function updateStudy(
  studyId: string,
  input: {
    title: string;
    content: string;
    cert?: string | null;
    locationName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  },
): Promise<BoardPost> {
  const payload = {
    title: input.title,
    content: input.content,
    cert: input.cert ?? null,
    locationName: input.locationName ?? input.address ?? "",
    address: input.address ?? input.locationName ?? "",
    latitude: input.latitude ?? 0,
    longitude: input.longitude ?? 0,
    placeId: input.placeId ?? "LOCAL_PLACE",
  };

  const response = await http.patch(`/api/study/${encodeURIComponent(studyId)}`, payload);
  const responsePayload = unwrapData(response.data);
  if (!responsePayload || typeof responsePayload !== "object") {
    throw new Error("스터디 게시글 수정 응답이 비어 있습니다.");
  }

  return mapStudyRecordToBoardPost(responsePayload as StudyApiRecord);
}

export async function deleteStudy(studyId: string): Promise<void> {
  await http.delete(`/api/study/${encodeURIComponent(studyId)}`);
}
