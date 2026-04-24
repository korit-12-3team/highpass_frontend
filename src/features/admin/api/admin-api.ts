import { http } from "@/services/api/http";
import type { AdminPost, AdminReport, AdminSection, AdminUser, PostStatus, ReportStatus, UserStatus } from "@/features/admin/types";

function readArray<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const objectPayload = payload as Record<string, unknown>;
  if (Array.isArray(objectPayload[key])) return objectPayload[key] as T[];
  if (Array.isArray(objectPayload.data)) return objectPayload.data as T[];
  return [];
}

export async function loadAdminSection<T>(section: AdminSection): Promise<T[]> {
  const paths: Record<AdminSection, { path: string; key: string }> = {
    users: { path: "/api/admin/users", key: "users" },
    posts: { path: "/api/admin/posts", key: "posts" },
    reports: { path: "/api/admin/reports", key: "reports" },
  };

  const config = paths[section];
  const response = await http.get(config.path);
  return readArray<T>(response.data, config.key);
}

export async function updateAdminUserStatus(userId: string, status: UserStatus): Promise<AdminUser> {
  const response = await http.patch(`/api/admin/users/${encodeURIComponent(userId)}/status`, { status });
  return response.data as AdminUser;
}

export async function updateAdminPostStatus(postId: string, status: PostStatus): Promise<AdminPost> {
  const response = await http.patch(`/api/admin/posts/${encodeURIComponent(postId)}/status`, { status });
  return response.data as AdminPost;
}

export async function updateAdminReportStatus(reportId: string, status: ReportStatus): Promise<AdminReport> {
  const response = await http.patch(`/api/admin/reports/${encodeURIComponent(reportId)}/status`, { status });
  return response.data as AdminReport;
}
