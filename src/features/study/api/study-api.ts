import type { BoardPost } from "@/entities/common/types";
import { mapStudyRecordToBoardPost, unwrapData, type StudyApiRecord } from "@/features/boards/api/mappers";
import { http } from "@/services/api/http";

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
  createChatRoom?:boolean;
}): Promise<BoardPost> {
  const payload = {
    title: input.title,
    content: input.content,
    cert: input.cert ?? null,
    locationName: input.locationName ?? input.address ?? "",
    address: input.address ?? input.locationName ?? "",
    latitude: input.latitude ?? 0,
    longitude: input.longitude ?? 0,
    placeId: input.placeId ?? "LOCAL_PLACE",
    createChatRoom: input.createChatRoom ?? false,
  };

  const response = await http.post("/api/study", payload);
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
