import type { BoardPost } from "@/entities/common/types";
import { mapStudyRecordToBoardPost, unwrapData, type StudyApiRecord } from "@/features/boards/api/mappers";
import { API_BASE_URL } from "@/services/config/config";

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
