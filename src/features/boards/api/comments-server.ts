import type { PostComment } from "@/entities/common/types";
import { mapApiRecordToComment, unwrapData, type CommentApiRecord } from "@/features/boards/api/mappers";
import { API_BASE_URL } from "@/services/config/config";

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
