import type { BoardPost, PostComment } from "@/entities/common/types";
import { API_BASE_URL } from "@/services/config/config";

type BoardApiRecord = {
  id?: string | number;
  freeBoardId?: string | number;
  boardId?: string | number;
  type?: unknown;
  title?: unknown;
  content?: unknown;
  author?: unknown;
  nickname?: unknown;
  authorId?: unknown;
  userId?: unknown;
  createdAt?: unknown;
  views?: unknown;
  viewCount?: unknown;
  likes?: unknown;
  likeCount?: unknown;
  scraps?: unknown;
  comments?: unknown;
  cert?: unknown;
  location?: unknown;
  lat?: unknown;
  lng?: unknown;
  likedByUser?: unknown;
};

function toBoardType(value: unknown): "study" | "free" {
  if (value === "study" || value === "free") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "study" || lowered === "free") return lowered as "study" | "free";
  }
  return "free";
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function safeNumber(value: unknown, fallback = 0) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeComments(value: unknown): PostComment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const anyItem = item as Record<string, unknown>;
      return {
        id: safeNumber(anyItem.id, Date.now()),
        author: safeString(anyItem.nickname ?? anyItem.author, "Unknown"),
        text: safeString(anyItem.content ?? anyItem.text, ""),
        createdAt: typeof anyItem.createdAt === "string" ? anyItem.createdAt : undefined,
      } satisfies PostComment;
    })
    .filter(Boolean) as PostComment[];
}

function mapApiRecordToBoardPost(record: BoardApiRecord): BoardPost {
  const id = record.freeBoardId ?? record.boardId ?? record.id ?? Date.now();
  return {
    id: safeString(id),
    type: toBoardType(record.type),
    title: safeString(record.title),
    content: safeString(record.content),
    author: safeString(record.nickname ?? record.author, "Unknown"),
    authorId: safeString(record.userId ?? record.authorId),
    createdAt: safeString(record.createdAt, new Date().toISOString().slice(0, 10)),
    views: safeNumber(record.viewCount ?? record.views),
    likes: safeNumber(record.likeCount ?? record.likes),
    scraps: safeNumber(record.scraps),
    comments: safeComments(record.comments),
    cert: record.cert == null ? null : safeString(record.cert),
    location: typeof record.location === "string" ? record.location : undefined,
    lat: typeof record.lat === "number" ? record.lat : undefined,
    lng: typeof record.lng === "number" ? record.lng : undefined,
    likedByUser: typeof record.likedByUser === "boolean" ? record.likedByUser : undefined,
  };
}

function unwrapData(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  if (!("data" in payload)) return payload;
  return (payload as { data: unknown }).data;
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

export async function listBoardsServer(userId?: string): Promise<BoardPost[]> {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  const payload = unwrapData(await fetchJson("/api/boards", params));
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapApiRecordToBoardPost(item as BoardApiRecord));
}

export async function getBoardServer(freeBoardId: string, userId?: string): Promise<BoardPost | null> {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  const payload = unwrapData(await fetchJson(`/api/boards/${encodeURIComponent(freeBoardId)}`, params));
  if (!payload || typeof payload !== "object") return null;
  return mapApiRecordToBoardPost(payload as BoardApiRecord);
}
