import type { BoardPost } from "@/entities/common/types";
import { API_BASE_URL } from "@/services/config/config";

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

async function fetchJson(path: string, searchParams?: URLSearchParams) {
  const query = searchParams && searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}${path}${query}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path} (${response.status})`);
  }
  return response.json();
}

export async function listStudiesServer(userId?: string): Promise<BoardPost[]> {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  const payload = unwrapData(await fetchJson("/api/study", params));
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapStudyRecordToBoardPost(item as StudyApiRecord));
}

export async function getStudyServer(studyId: string, userId?: string): Promise<BoardPost | null> {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  const payload = unwrapData(await fetchJson(`/api/study/${encodeURIComponent(studyId)}`, params));
  if (!payload || typeof payload !== "object") return null;
  return mapStudyRecordToBoardPost(payload as StudyApiRecord);
}
