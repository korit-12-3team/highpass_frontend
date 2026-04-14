import { fetchWithAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { http } from "@/lib/http";

export type CertificateSchedule = {
  id: string;
  certificateName: string;
  examYear: number;
  round: number;
  writtenApplyStart?: string;
  writtenApplyEnd?: string;
  writtenExamDate?: string;
  writtenResultDate?: string;
  practicalApplyStart?: string;
  practicalApplyEnd?: string;
  practicalExamDate?: string;
  practicalResultDate?: string;
};

export type CertificateSyncResult = {
  fetchedCount: number;
  createdCount: number;
  updatedCount: number;
  totalCount: number;
  message: string;
};

export type UserCertificateRecord = {
  id?: number | string;
  certificateScheduleId?: number | string;
  certificateName?: string;
  examYear?: number;
  round?: number;
  writtenApplyStart?: string;
  writtenApplyEnd?: string;
  writtenExamDate?: string;
  writtenResultDate?: string;
  practicalApplyStart?: string;
  practicalApplyEnd?: string;
  practicalExamDate?: string;
  practicalResultDate?: string;
};

type CertificateApiRecord = {
  id?: unknown;
  certificateScheduleId?: unknown;
  certificateName?: unknown;
  examYear?: unknown;
  year?: unknown;
  round?: unknown;
  writtenApplyStart?: unknown;
  writtenApplyEnd?: unknown;
  writtenExamDate?: unknown;
  writtenResultDate?: unknown;
  practicalApplyStart?: unknown;
  practicalApplyEnd?: unknown;
  practicalExamDate?: unknown;
  practicalResultDate?: unknown;
};

function unwrapData(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  if (!("data" in payload)) return payload;
  return (payload as { data: unknown }).data;
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalDate(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function mapCertificateSchedule(record: CertificateApiRecord): CertificateSchedule {
  return {
    id: safeString(record.id, String(Date.now())),
    certificateName: safeString(record.certificateName, "자격증"),
    examYear: safeNumber(record.examYear ?? record.year),
    round: safeNumber(record.round),
    writtenApplyStart: optionalDate(record.writtenApplyStart),
    writtenApplyEnd: optionalDate(record.writtenApplyEnd),
    writtenExamDate: optionalDate(record.writtenExamDate),
    writtenResultDate: optionalDate(record.writtenResultDate),
    practicalApplyStart: optionalDate(record.practicalApplyStart),
    practicalApplyEnd: optionalDate(record.practicalApplyEnd),
    practicalExamDate: optionalDate(record.practicalExamDate),
    practicalResultDate: optionalDate(record.practicalResultDate),
  };
}

function mapUserCertificate(record: CertificateApiRecord): UserCertificateRecord {
  return {
    id: record.id == null ? undefined : safeString(record.id),
    certificateScheduleId: record.certificateScheduleId == null ? undefined : safeString(record.certificateScheduleId),
    certificateName: safeString(record.certificateName),
    examYear: safeNumber(record.examYear ?? record.year),
    round: safeNumber(record.round),
    writtenApplyStart: optionalDate(record.writtenApplyStart),
    writtenApplyEnd: optionalDate(record.writtenApplyEnd),
    writtenExamDate: optionalDate(record.writtenExamDate),
    writtenResultDate: optionalDate(record.writtenResultDate),
    practicalApplyStart: optionalDate(record.practicalApplyStart),
    practicalApplyEnd: optionalDate(record.practicalApplyEnd),
    practicalExamDate: optionalDate(record.practicalExamDate),
    practicalResultDate: optionalDate(record.practicalResultDate),
  };
}

export async function listCertificateSchedules(): Promise<CertificateSchedule[]> {
  const response = await http.get("/api/certificates/schedules");
  const payload = unwrapData(response.data);
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapCertificateSchedule(item as CertificateApiRecord));
}

export async function syncCertificateSchedules(): Promise<CertificateSyncResult> {
  const response = await http.post("/api/certificates/admin/sync");
  const payload = unwrapData(response.data) as Partial<CertificateSyncResult> | undefined;

  return {
    fetchedCount: safeNumber(payload?.fetchedCount),
    createdCount: safeNumber(payload?.createdCount),
    updatedCount: safeNumber(payload?.updatedCount),
    totalCount: safeNumber(payload?.totalCount),
    message: safeString(payload?.message, "자격증 일정 동기화가 완료되었습니다."),
  };
}

export async function saveUserCertificate(userId: string, certificateScheduleId: string): Promise<UserCertificateRecord> {
  const parsedScheduleId = Number(certificateScheduleId);
  const response = await fetchWithAuth(`${API_BASE_URL}/api/user-certificates/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      certificateScheduleId: Number.isFinite(parsedScheduleId) ? parsedScheduleId : certificateScheduleId,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || "자격증을 저장하지 못했습니다.");
  }
  if (!text.trim()) {
    throw new Error("자격증 저장 응답이 비어 있습니다.");
  }
  if (text.trim().startsWith("<")) {
    throw new Error("서버가 JSON 대신 HTML을 반환했습니다. 인증 또는 보안 설정을 확인해 주세요.");
  }

  return mapUserCertificate(JSON.parse(text) as CertificateApiRecord);
}
