import { API_BASE_URL } from "@/services/config/config";
import { fetchWithAuth } from "@/services/auth/auth";
import { NotificationResponse } from "@/entities/common/types";

export async function listNotifications(_userId?: string): Promise<NotificationResponse[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications`);
  if (!response.ok) throw new Error("알림 목록을 불러오지 못했습니다.");
  return response.json();
}

export async function getUnreadCount(_userId?: string): Promise<number> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/unread-count`);
  if (!response.ok) throw new Error("읽지 않은 알림 수를 불러오지 못했습니다.");
  return response.json();
}

export async function markAsRead(notificationId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("알림 읽음 처리에 실패했습니다.");
}

export async function deleteNotification(notificationId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("알림 삭제에 실패했습니다.");
}

export async function deleteAllNotifications(_userId?: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/all`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("전체 알림 삭제에 실패했습니다.");
}
