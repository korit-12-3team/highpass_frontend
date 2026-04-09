"use client";

import { API_BASE_URL } from "@/lib/config";

export type UserCertificateRecord = {
  id?: number | string;
  certificateScheduleId?: number | string;
  certificateName?: string;
  year?: number;
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

type UserCertificateApiRecord = {
  id?: unknown;
  certificateScheduleId?: unknown;
  certificateName?: unknown;
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

function mapRecord(record: UserCertificateApiRecord): UserCertificateRecord {
  return {
    id: record.id == null ? undefined : safeString(record.id),
    certificateScheduleId: record.certificateScheduleId == null ? undefined : safeString(record.certificateScheduleId),
    certificateName: safeString(record.certificateName, ""),
    year: safeNumber(record.year),
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

export async function saveUserCertificate(userId: string, certificateScheduleId: string): Promise<UserCertificateRecord> {
  const parsedScheduleId = Number(certificateScheduleId);
  const response = await fetch(`${API_BASE_URL}/api/user-certificates/${userId}`, {
    method: "POST",
    credentials: "include",
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
    throw new Error("서버가 JSON 대신 HTML을 반환했습니다. 인증 또는 보안 설정을 확인하세요.");
  }

  return mapRecord(JSON.parse(text) as UserCertificateApiRecord);
}
