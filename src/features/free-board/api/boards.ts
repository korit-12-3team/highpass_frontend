import type { BoardPost } from "@/entities/common/types";
import { mapApiRecordToBoardPost, unwrapData, type BoardApiRecord } from "@/shared/boards/api/mappers";
import { http } from "@/services/api/http";
import { ApiError } from "@/shared/errors";

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
  tags?: string[];
}): Promise<BoardPost> {
  // Backend derives the author from the authenticated session.
  const payload: Record<string, unknown> = {
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
  };

  if (input.type === "study") {
    payload.cert = input.cert ?? null;
    payload.location = input.location;
    payload.lat = input.lat;
    payload.lng = input.lng;
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("createBoard payload", { url: "/api/boards", payload });
  }

  const response = await http.post("/api/boards", payload);

  const payloadJson = unwrapData(response.data);
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

export async function updateBoard(
  freeBoardId: string | number,
  input: {
    title: string;
    content: string;
    tags: string[];
  },
): Promise<BoardPost> {
  const payload = {
    title: input.title,
    content: input.content,
    tags: input.tags,
  };

  const response = await http.patch(`/api/boards/${encodeURIComponent(String(freeBoardId))}`, payload);
  const responsePayload = unwrapData(response.data);
  if (!responsePayload || typeof responsePayload !== "object") {
    throw new ApiError("게시글 수정 응답이 비어 있습니다.");
  }

  return mapApiRecordToBoardPost(responsePayload);
}
