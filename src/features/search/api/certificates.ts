import { fetchWithAuth } from "@/services/auth/auth";
import { API_BASE_URL } from "@/services/config/config";
import { http } from "@/services/api/http";
import { optionalDate, optionalString, safeNumber, safeString, unwrapData } from "@/shared/utils/api-mappers";

export type CertificateSchedule = {
  id: string;
  certificateName: string;
  examYear: number;
  round: number;
  sourceType?: "qnet" | "data-industry";
  examCategory?: string;
  examStartTime?: string;
  examPlace?: string;
  examType?: string;
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
  examName?: unknown;
  examYear?: unknown;
  year?: unknown;
  round?: unknown;
  examRound?: unknown;
  examCategory?: unknown;
  examStartTime?: unknown;
  examPlace?: unknown;
  examType?: unknown;
  applyStartDate?: unknown;
  applyEndDate?: unknown;
  examDate?: unknown;
  resultAnnouncementDate?: unknown;
  writtenApplyStart?: unknown;
  writtenApplyEnd?: unknown;
  writtenExamDate?: unknown;
  writtenResultDate?: unknown;
  practicalApplyStart?: unknown;
  practicalApplyEnd?: unknown;
  practicalExamDate?: unknown;
  practicalResultDate?: unknown;
};

function mapQnetSchedule(record: CertificateApiRecord): CertificateSchedule {
  return {
    id: safeString(record.id, String(Date.now())),
    certificateName: safeString(record.certificateName, "자격증"),
    examYear: safeNumber(record.examYear ?? record.year),
    round: safeNumber(record.round),
    sourceType: "qnet",
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

function mapDataIndustrySchedule(record: CertificateApiRecord): CertificateSchedule {
  const id = safeString(record.id, String(Date.now()));

  return {
    id: `data-industry-${id}`,
    certificateName: safeString(record.examName ?? record.certificateName, "데이터 자격검정"),
    examYear: safeNumber(record.examYear ?? record.year),
    round: safeNumber(record.examRound ?? record.round),
    sourceType: "data-industry",
    examCategory: optionalString(record.examCategory),
    examStartTime: optionalString(record.examStartTime),
    examPlace: optionalString(record.examPlace),
    examType: optionalString(record.examType),
    writtenApplyStart: optionalDate(record.applyStartDate),
    writtenApplyEnd: optionalDate(record.applyEndDate),
    writtenExamDate: optionalDate(record.examDate),
    writtenResultDate: optionalDate(record.resultAnnouncementDate),
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
  const [qnetResponse, dataIndustryResponse] = await Promise.all([
    http.get("/api/certificates/schedules"),
    http.get("/api/certificates/data-industry-schedules"),
  ]);

  if (typeof qnetResponse.data === "string" && qnetResponse.data.trim().startsWith("<")) {
    throw new Error("자격증 일정 API가 JSON 대신 HTML을 반환했습니다. 백엔드 인증 또는 보안 설정을 확인해 주세요.");
  }

  if (typeof dataIndustryResponse.data === "string" && dataIndustryResponse.data.trim().startsWith("<")) {
    throw new Error("데이터 자격검정 일정 API가 JSON 대신 HTML을 반환했습니다.");
  }

  const qnetPayload = unwrapData(qnetResponse.data);
  const dataIndustryPayload = unwrapData(dataIndustryResponse.data);

  if (!Array.isArray(qnetPayload)) {
    throw new Error("자격증 일정 API 응답 형식이 올바르지 않습니다.");
  }

  if (!Array.isArray(dataIndustryPayload)) {
    throw new Error("데이터 자격검정 일정 API 응답 형식이 올바르지 않습니다.");
  }

  return [
    ...qnetPayload.map((item) => mapQnetSchedule(item as CertificateApiRecord)),
    ...dataIndustryPayload.map((item) => mapDataIndustrySchedule(item as CertificateApiRecord)),
  ];
}

export async function syncCertificateSchedules(): Promise<CertificateSyncResult> {
  const response = await http.post("/api/certificates/admin/sync");
  if (typeof response.data === "string" && response.data.trim().startsWith("<")) {
    throw new Error("자격증 동기화 API가 JSON 대신 HTML을 반환했습니다. 백엔드 인증 또는 보안 설정을 확인해 주세요.");
  }
  const payload = unwrapData(response.data) as Partial<CertificateSyncResult> | undefined;

  return {
    fetchedCount: safeNumber(payload?.fetchedCount),
    createdCount: safeNumber(payload?.createdCount),
    updatedCount: safeNumber(payload?.updatedCount),
    totalCount: safeNumber(payload?.totalCount),
    message: safeString(payload?.message, "자격증 일정 동기화가 완료되었습니다."),
  };
}

export async function saveUserCertificate(_userId: string, certificateScheduleId: string): Promise<UserCertificateRecord> {
  const parsedScheduleId = Number(certificateScheduleId);
  const response = await fetchWithAuth(`${API_BASE_URL}/api/user-certificates`, {
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
