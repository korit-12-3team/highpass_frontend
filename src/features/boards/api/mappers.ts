import type { BoardPost, PostComment } from "@/entities/common/types";
import { safeNumber, safeString, unwrapData } from "@/shared/utils/api-mappers";

export type BoardApiRecord = {
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

export type StudyApiRecord = {
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
  chatRoomId?: unknown;
};

export type CommentApiRecord = {
  id?: unknown;
  content?: unknown;
  nickname?: unknown;
  userId?: unknown;
  createdAt?: unknown;
};

function toBoardType(value: unknown): "study" | "free" {
  if (value === "study" || value === "free") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "study" || lowered === "free") return lowered as "study" | "free";
  }
  return "free";
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

export function mapApiRecordToBoardPost(record: BoardApiRecord): BoardPost {
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

export function mapStudyRecordToBoardPost(record: StudyApiRecord): BoardPost {
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
    chatRoomId: typeof record.chatRoomId === "number" ? record.chatRoomId : undefined,
  };
}

export function mapApiRecordToComment(record: CommentApiRecord): PostComment {
  return {
    id: safeNumber(record.id, Date.now()),
    author: safeString(record.nickname, "Unknown"),
    authorId: safeString(record.userId),
    text: safeString(record.content),
    createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
  };
}

export { unwrapData };
