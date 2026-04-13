"use client";

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

type CertificateApiRecord = {
  id?: unknown;
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

function mapRecord(record: CertificateApiRecord): CertificateSchedule {
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

export async function listCertificateSchedules(): Promise<CertificateSchedule[]> {
  const response = await http.get("/api/certificates/schedules");
  const payload = unwrapData(response.data);
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => mapRecord(item as CertificateApiRecord));
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
