"use client";

import { http } from "@/lib/http";

function getStorageKey(userId: string) {
  return `hp_board_likes_${userId}`;
}

function toPostKey(targetType: "FREE" | "STUDY", targetId: string | number) {
  return `${targetType}:${targetId}`;
}

export function loadLikedPostMap(userId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(getStorageKey(userId));
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function isPostLiked(userId: string, targetType: "FREE" | "STUDY", targetId: string | number) {
  return !!loadLikedPostMap(userId)[toPostKey(targetType, targetId)];
}

export function saveLikedPost(userId: string, targetType: "FREE" | "STUDY", targetId: string | number, liked: boolean) {
  if (typeof window === "undefined") return;
  const nextMap = loadLikedPostMap(userId);
  const key = toPostKey(targetType, targetId);

  if (liked) nextMap[key] = true;
  else delete nextMap[key];

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextMap));
}

export async function toggleBoardLike(targetType: "FREE" | "STUDY", targetId: number, userId: number) {
  await http.post(`/api/likes/${encodeURIComponent(targetType)}/${encodeURIComponent(String(targetId))}/${encodeURIComponent(String(userId))}`);
}
