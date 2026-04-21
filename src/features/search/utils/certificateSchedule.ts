import { CertificateSchedule } from "@/features/search/api/certificates";

export type CertScheduleType = "written" | "practical";
export type ScheduleTab = "upcoming" | "past";
export type CalendarSelectionState = {
  apply: boolean;
  exam: boolean;
  result: boolean;
};

export type ApplyRange = {
  start?: string;
  end?: string;
  label: string;
};

export type MergedCertificateSchedule = {
  id: string;
  sourceSchedules: CertificateSchedule[];
  certificateName: string;
  examYear: number;
  round: number;
  writtenExamDate?: string;
  writtenResultDate?: string;
  practicalExamDate?: string;
  practicalResultDate?: string;
  writtenApplyRanges: ApplyRange[];
  practicalApplyRanges: ApplyRange[];
};

export function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return "일정 미정";
  if (start && end) return `${start} ~ ${end}`;
  return start || end || "일정 미정";
}

export function buildEventTitle(name: string, scheduleType: CertScheduleType, suffix: string) {
  return `${name} ${scheduleType === "written" ? "필기" : "실기"} ${suffix}`;
}

function makeMergeKey(item: CertificateSchedule) {
  return [
    item.examYear,
    item.round,
    item.certificateName.trim(),
    item.writtenExamDate || "",
    item.writtenResultDate || "",
    item.practicalExamDate || "",
    item.practicalResultDate || "",
  ].join("|");
}

function mergeApplyRanges(ranges: ApplyRange[]) {
  const map = new Map<string, ApplyRange>();

  ranges.forEach((range) => {
    const key = `${range.start || ""}|${range.end || ""}|${range.label}`;
    if (!map.has(key)) {
      map.set(key, range);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    `${a.start || ""}|${a.end || ""}`.localeCompare(`${b.start || ""}|${b.end || ""}`),
  );
}

export function getLatestMergedScheduleDate(item: MergedCertificateSchedule) {
  const candidates = [
    ...item.writtenApplyRanges.flatMap((range) => [range.start, range.end]),
    ...item.practicalApplyRanges.flatMap((range) => [range.start, range.end]),
    item.writtenExamDate,
    item.writtenResultDate,
    item.practicalExamDate,
    item.practicalResultDate,
  ].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) return "";
  return candidates.reduce((latest, current) => (current > latest ? current : latest));
}

export function isPastMergedSchedule(item: MergedCertificateSchedule) {
  const latestDate = getLatestMergedScheduleDate(item);
  if (!latestDate) return false;
  const today = new Date().toLocaleDateString("en-CA");
  return latestDate < today;
}

export function mergeSchedules(schedules: CertificateSchedule[]): MergedCertificateSchedule[] {
  const grouped = new Map<string, MergedCertificateSchedule>();

  schedules.forEach((item) => {
    const key = makeMergeKey(item);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        id: key,
        sourceSchedules: [item],
        certificateName: item.certificateName,
        examYear: item.examYear,
        round: item.round,
        writtenExamDate: item.writtenExamDate,
        writtenResultDate: item.writtenResultDate,
        practicalExamDate: item.practicalExamDate,
        practicalResultDate: item.practicalResultDate,
        writtenApplyRanges: mergeApplyRanges([{ start: item.writtenApplyStart, end: item.writtenApplyEnd, label: "정기접수" }]),
        practicalApplyRanges: mergeApplyRanges([{ start: item.practicalApplyStart, end: item.practicalApplyEnd, label: "정기접수" }]),
      });
      return;
    }

    existing.sourceSchedules.push(item);
    existing.writtenApplyRanges = mergeApplyRanges([
      ...existing.writtenApplyRanges,
      {
        start: item.writtenApplyStart,
        end: item.writtenApplyEnd,
        label: existing.writtenApplyRanges.length === 0 ? "정기접수" : "추가접수",
      },
    ]);
    existing.practicalApplyRanges = mergeApplyRanges([
      ...existing.practicalApplyRanges,
      {
        start: item.practicalApplyStart,
        end: item.practicalApplyEnd,
        label: existing.practicalApplyRanges.length === 0 ? "정기접수" : "추가접수",
      },
    ]);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const aWrittenStart = a.writtenApplyRanges[0]?.start || "9999-12-31";
    const bWrittenStart = b.writtenApplyRanges[0]?.start || "9999-12-31";

    const dateOrder = aWrittenStart.localeCompare(bWrittenStart);
    if (dateOrder !== 0) return dateOrder;

    if (a.examYear !== b.examYear) return a.examYear - b.examYear;
    if (a.round !== b.round) return a.round - b.round;
    return a.certificateName.localeCompare(b.certificateName);
  });
}
