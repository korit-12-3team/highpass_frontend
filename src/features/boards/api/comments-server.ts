import type { PostComment } from "@/entities/common/types";
import { API_BASE_URL } from "@/services/config/config";

type CommentApiRecord = {
  id?: unknown;
  content?: unknown;
  nickname?: unknown;
  createdAt?: unknown;
};

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function safeNumber(value: unknown, fallback = 0) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function unwrapData(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  if (!("data" in payload)) return payload;
  return (payload as { data: unknown }).data;
}

function mapApiRecordToComment(record: CommentApiRecord): PostComment {
  return {
    id: safeNumber(record.id, Date.now()),
    author: safeString(record.nickname, "Unknown"),
    text: safeString(record.content),
    createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
  };
}

export async function listCommentsServer(targetType: "FREE" | "STUDY", targetId: string): Promise<PostComment[]> {
  const response = await fetch(`${API_BASE_URL}/api/comments/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch comments for ${targetType}:${targetId} (${response.status})`);
  }
  const payload = unwrapData(await response.json());
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapApiRecordToComment(item as CommentApiRecord));
}
