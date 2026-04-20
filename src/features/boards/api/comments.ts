import type { PostComment } from "@/entities/common/types";
import { http } from "@/services/api/http";

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

export async function listComments(targetType: "FREE" | "STUDY", targetId: string): Promise<PostComment[]> {
  const response = await http.get(`/api/comments/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`);
  const payload = unwrapData(response.data);
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapApiRecordToComment(item as CommentApiRecord));
}

export async function createComment(input: {
  content: string;
  targetType: "FREE" | "STUDY";
  targetId: number;
  userId: number;
}): Promise<PostComment> {
  const response = await http.post("/api/comments", input);
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") {
    return {
      id: Date.now(),
      author: "",
      text: input.content,
      createdAt: new Date().toISOString(),
    };
  }
  return mapApiRecordToComment(payload as CommentApiRecord);
}

export async function updateComment(
  commentId: number,
  userId: number,
  input: {
    content: string;
    targetType: "FREE" | "STUDY";
    targetId: number;
    userId: number;
  },
): Promise<PostComment> {
  const response = await http.patch(
    `/api/comments/${encodeURIComponent(String(commentId))}/${encodeURIComponent(String(userId))}`,
    input,
  );
  const payload = unwrapData(response.data);
  if (!payload || typeof payload !== "object") {
    return {
      id: commentId,
      author: "",
      text: input.content,
      createdAt: new Date().toISOString(),
    };
  }
  return mapApiRecordToComment(payload as CommentApiRecord);
}

export async function deleteComment(commentId: number, userId: number) {
  await http.delete(`/api/comments/${encodeURIComponent(String(commentId))}/${encodeURIComponent(String(userId))}`);
}
