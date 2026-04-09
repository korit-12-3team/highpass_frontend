"use client";

import type { BoardPost, PostComment } from "@/lib/AppContext";
import { http } from "@/lib/http";

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
  const createdAt = safeString(record.createdAt, new Date().toISOString().slice(0, 10));

  return {
    id: safeString(id),
    type: toBoardType(record.type),
    title: safeString(record.title),
    content: safeString(record.content),
    author: safeString(record.nickname ?? record.author, "Unknown"),
    authorId: safeString(record.userId ?? record.authorId),
    createdAt,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (payload as any).data as unknown;
}

export async function listBoards(userId?: string): Promise<BoardPost[]> {
  const response = await http.get("/api/boards", {
    params: userId ? { userId } : undefined,
  });
  const payload = unwrapData(response.data);
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapApiRecordToBoardPost(item as BoardApiRecord));
}

export async function getBoard(freeBoardId: string, userId?: string): Promise<BoardPost | null> {
  const response = await http.get(`/api/boards/${encodeURIComponent(freeBoardId)}`, {
    params: userId ? { userId } : undefined,
  });
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") return null;
  return mapApiRecordToBoardPost(payload as BoardApiRecord);
}

export async function createBoard(input: {
  userId: string;
  author: string;
  type: "study" | "free";
  title: string;
  content: string;
  cert?: string | null;
  location?: string;
  lat?: number;
  lng?: number;
}): Promise<BoardPost> {
  const userIdPath = encodeURIComponent(input.userId);

  // Backend expects at least { title, content } and uses userId from the path.
  const payload: Record<string, unknown> = {
    title: input.title,
    content: input.content,
  };

  if (input.type === "study") {
    payload.cert = input.cert ?? null;
    payload.location = input.location;
    payload.lat = input.lat;
    payload.lng = input.lng;
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("createBoard payload", { url: `/api/boards/${userIdPath}`, payload });
  }

  let responseData: unknown;
  try {
    const response = await http.post(`/api/boards/${userIdPath}`, payload);
    responseData = response.data;
  } catch (e) {
    // axios error shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e as any;
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message =
      status != null
        ? `Request failed (HTTP ${status}): ${typeof data === "string" ? data : JSON.stringify(data)}`
        : err?.message || "Request failed.";
    throw new Error(message);
  }

  const payloadJson = unwrapData(responseData);
  if (!payloadJson || typeof payloadJson !== "object") {
    return {
      id: String(Date.now()),
      type: input.type,
      title: input.title,
      content: input.content,
      author: input.author,
      authorId: input.userId,
      createdAt: new Date().toISOString().slice(0, 10),
      views: 0,
      likes: 0,
      scraps: 0,
      comments: [],
      cert: input.cert ?? null,
      location: input.location,
      lat: input.lat,
      lng: input.lng,
      likedByUser: false,
    };
  }

  return mapApiRecordToBoardPost(payloadJson as BoardApiRecord);
}

export async function patchBoard(freeBoardId: string, patch: { title?: string; content?: string }) {
  const response = await http.patch(`/api/boards/${encodeURIComponent(freeBoardId)}`, patch);
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") return null;
  return mapApiRecordToBoardPost(payload as BoardApiRecord);
}

export async function deleteBoard(freeBoardId: string) {
  await http.delete(`/api/boards/${encodeURIComponent(freeBoardId)}`);
}
