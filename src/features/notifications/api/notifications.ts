import { API_BASE_URL } from "@/services/config/config";
import { NotificationResponse } from "@/entities/common/types";

// 내 알림 목록 조회
export async function listNotifications(userId: string): Promise<NotificationResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}`);
  if (!response.ok) throw new Error("알림 목록을 불러오지 못했습니다.");
  return response.json();
}

// 안읽은 알림 개수 조회
export async function getUnreadCount(userId: string): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count/${userId}`);
  if (!response.ok) throw new Error("알림 개수를 불러오지 못했습니다.");
  return response.json();
}

// 알림 읽음 처리
export async function markAsRead(notificationId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("알림 읽음 처리에 실패했습니다.");
}

// 개별 알림 삭제
export async function deleteNotification(notificationId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("알림 삭제에 실패했습니다.");
}

// 전체 알림 삭제
export async function deleteAllNotifications(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/all/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("전체 알림 삭제에 실패했습니다.");
}
