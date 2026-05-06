import { http } from "@/services/api/http";
import { safeString, unwrapData } from "@/shared/utils/api-mappers";

export type MyReport = {
  id: string;
  targetType: "user" | "post" | "comment" | "chat" | "inquiry";
  targetLabel: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
  adminResponse?: string;
  respondedAt?: string;
};

function mapMyReport(raw: Record<string, unknown>): MyReport {
  return {
    id: safeString(raw.id),
    targetType: safeString(raw.targetType) as MyReport["targetType"],
    targetLabel: safeString(raw.targetLabel),
    reason: safeString(raw.reason),
    status: safeString(raw.status) as MyReport["status"],
    createdAt: safeString(raw.createdAt),
    adminResponse: raw.adminResponse ? safeString(raw.adminResponse) : undefined,
    respondedAt: raw.respondedAt ? safeString(raw.respondedAt) : undefined,
  };
}

export async function listMyReports(): Promise<MyReport[]> {
  const response = await http.get("/api/reports/me");
  const payload = unwrapData(response.data);
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapMyReport(item as Record<string, unknown>));
}
