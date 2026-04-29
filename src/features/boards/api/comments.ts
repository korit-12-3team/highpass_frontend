import type { PostComment } from "@/entities/common/types";
import { mapApiRecordToComment, unwrapData, type CommentApiRecord } from "@/features/boards/api/mappers";
import { http } from "@/services/api/http";

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
  userId?: number;
}): Promise<PostComment> {
  const response = await http.post("/api/comments", {
    content: input.content,
    targetType: input.targetType,
    targetId: input.targetId,
  });
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
  _userId: number,
  input: {
    content: string;
    targetType: "FREE" | "STUDY";
    targetId: number;
    userId?: number;
  },
): Promise<PostComment> {
  const response = await http.patch(
    `/api/comments/${encodeURIComponent(String(commentId))}`,
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

export async function deleteComment(commentId: number, _userId: number) {
  await http.delete(`/api/comments/${encodeURIComponent(String(commentId))}`);
}
