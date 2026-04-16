"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, CheckCircle2, ClipboardPenLine, RefreshCw, Search, X } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { createCalendarEvent } from "@/lib/calendar";
import { listCertificateSchedules, saveUserCertificate, syncCertificateSchedules, type CertificateSchedule } from "@/lib/certificates";

type CertScheduleType = "written" | "practical";
type ScheduleTab = "upcoming" | "past";

type ApplyRange = {
  start?: string;
  end?: string;
  label: string;
};

type MergedCertificateSchedule = {
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

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return "일정 미정";
  if (start && end) return `${start} ~ ${end}`;
  return start || end || "일정 미정";
}

function buildEventTitle(name: string, scheduleType: CertScheduleType, suffix: string) {
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

function getLatestMergedScheduleDate(item: MergedCertificateSchedule) {
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

function isPastMergedSchedule(item: MergedCertificateSchedule) {
  const latestDate = getLatestMergedScheduleDate(item);
  if (!latestDate) return false;
  const today = new Date().toLocaleDateString("en-CA");
  return latestDate < today;
}

function mergeSchedules(schedules: CertificateSchedule[]): MergedCertificateSchedule[] {
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

export default function SearchPageClient() {
  const { currentUser, setEvents } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedKeyword = searchParams.get("q") ?? "";
  const requestedTab = searchParams.get("tab");

  const [schedules, setSchedules] = useState<CertificateSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState(requestedKeyword);
  const [certModalOpen, setCertModalOpen] = useState<MergedCertificateSchedule | null>(null);
  const [certScheduleType, setCertScheduleType] = useState<CertScheduleType>("written");
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [syncingSchedules, setSyncingSchedules] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [activeTab, setActiveTab] = useState<ScheduleTab>(requestedTab === "past" ? "past" : "upcoming");

  const loadSchedules = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await listCertificateSchedules();
      setSchedules(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "자격증 일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, []);

  useEffect(() => {
    setSearchKeyword(requestedKeyword);
  }, [requestedKeyword]);

  useEffect(() => {
    setActiveTab(requestedTab === "past" ? "past" : "upcoming");
  }, [requestedTab]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (activeTab === "past") {
      params.set("tab", "past");
    } else {
      params.delete("tab");
    }

    if (searchKeyword.trim()) {
      params.set("q", searchKeyword.trim());
    } else {
      params.delete("q");
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [activeTab, pathname, router, searchKeyword, searchParams]);

  useEffect(() => {
    if (!certModalOpen) return;
    setCertScheduleType(certModalOpen.writtenExamDate ? "written" : "practical");
  }, [certModalOpen]);

  const mergedSchedules = useMemo(() => mergeSchedules(schedules), [schedules]);

  const upcomingSchedules = useMemo(
    () => mergedSchedules.filter((item) => !isPastMergedSchedule(item)),
    [mergedSchedules],
  );
  const pastSchedules = useMemo(
    () =>
      mergedSchedules
        .filter((item) => isPastMergedSchedule(item))
        .sort((a, b) => getLatestMergedScheduleDate(b).localeCompare(getLatestMergedScheduleDate(a))),
    [mergedSchedules],
  );

  useEffect(() => {
    if (requestedTab) return;
    if (loading) return;
    if (activeTab !== "upcoming") return;
    if (upcomingSchedules.length === 0 && pastSchedules.length > 0) {
      setActiveTab("past");
    }
  }, [activeTab, loading, pastSchedules.length, requestedTab, upcomingSchedules.length]);

  const visibleSchedules = activeTab === "past" ? pastSchedules : upcomingSchedules;

  const filteredSchedules = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return visibleSchedules;
    return visibleSchedules.filter((item) => item.certificateName.toLowerCase().includes(keyword));
  }, [searchKeyword, visibleSchedules]);

  const selectedScheduleDate =
    certScheduleType === "written" ? certModalOpen?.writtenExamDate : certModalOpen?.practicalExamDate;

  const selectedApplyRanges =
    certScheduleType === "written" ? certModalOpen?.writtenApplyRanges ?? [] : certModalOpen?.practicalApplyRanges ?? [];

  const selectedScheduleLabel =
    certScheduleType === "written"
      ? `필기 ${certModalOpen?.writtenExamDate || "없음"}`
      : `실기 ${certModalOpen?.practicalExamDate || "없음"}`;

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in duration-500">
      <div className="mb-6 rounded-2xl border border-hp-100 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">자격증 정보</h2>
          <p className="mt-2 text-sm text-slate-500">저장된 자격증 시험 일정을 조회하고 캘린더에 추가할 수 있습니다.</p>
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === "upcoming"
                  ? "bg-hp-600 text-white"
                  : "border border-hp-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              예정 일정
              <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {upcomingSchedules.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === "past"
                  ? "bg-slate-900 text-white"
                  : "border border-hp-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              지난 일정
              <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "past" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {pastSchedules.length}
              </span>
            </button>
          </div>

          <div className="flex w-full gap-2 md:w-auto md:min-w-[420px]">
            <div className="flex w-full items-center gap-2 rounded-xl border border-hp-100 bg-hp-50 px-3 py-2.5">
              <Search size={16} className="text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="자격증 검색"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (syncingSchedules) return;

                try {
                  setSyncingSchedules(true);
                  setSyncMessage("");
                  setLoadError("");

                  const result = await syncCertificateSchedules();
                  await loadSchedules();
                  setSyncMessage(
                    `${result.message} fetched ${result.fetchedCount}, created ${result.createdCount}, updated ${result.updatedCount}`,
                  );
                } catch (error) {
                  setLoadError(error instanceof Error ? error.message : "자격증 일정 갱신에 실패했습니다.");
                } finally {
                  setSyncingSchedules(false);
                }
              }}
              disabled={syncingSchedules}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-hp-200 bg-white px-4 py-2.5 text-sm font-bold text-hp-700 transition hover:bg-hp-50 disabled:opacity-60"
            >
              <RefreshCw size={16} className={syncingSchedules ? "animate-spin" : ""} />
              {syncingSchedules ? "갱신 중" : "자격증 갱신"}
            </button>
          </div>
        </div>

        {syncMessage && <p className="mb-5 text-xs text-emerald-600">{syncMessage}</p>}

        <div className="space-y-4">
          {loading && (
            <div className="rounded-xl border border-dashed border-hp-200 p-8 text-center text-slate-500">
              자격증 일정을 불러오는 중입니다.
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">{loadError}</div>
          )}

          {!loading && !loadError && filteredSchedules.length === 0 && (
            <div className="rounded-xl border border-dashed border-hp-200 p-8 text-center text-slate-500">
              {activeTab === "past"
                ? "지난 일정이 없습니다."
                : pastSchedules.length > 0
                  ? "예정된 일정은 없고 지난 일정만 있습니다. '지난 일정' 탭에서 확인해 주세요."
                  : "현재 예정된 자격증 일정이 없습니다."}
            </div>
          )}

          {filteredSchedules.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-md">
              <div className="flex flex-col gap-3 border-b border-hp-100 bg-hp-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-hp-100 px-2 py-1 text-xs font-bold text-hp-700">
                      {item.round > 0 ? `${item.round}회차` : "정기 일정"}
                    </span>
                    {item.sourceSchedules.length > 1 && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                        추가접수 포함
                      </span>
                    )}
                    {isPastMergedSchedule(item) && (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                        지난 일정
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-lg font-bold">{item.certificateName}</h3>
                </div>

                <button
                  onClick={() => {
                    setCalendarError("");
                    setCertModalOpen(item);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-hp-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-hp-700"
                >
                  <CalendarIcon size={16} />
                  일정 추가
                </button>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ClipboardPenLine size={16} className="text-hp-600" />
                    필기 일정
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">접수</p>
                      <div className="space-y-1">
                        {item.writtenApplyRanges.length > 0 ? (
                          item.writtenApplyRanges.map((range, index) => (
                            <div key={`written-${item.id}-${index}`} className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {range.label}
                              </span>
                              <p className="font-semibold">{formatDateRange(range.start, range.end)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="font-semibold text-slate-400">일정 없음</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">시험일</p>
                      <p className="font-semibold">{item.writtenExamDate || "없음"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">합격 발표</p>
                      <p className="font-semibold">{item.writtenResultDate || "없음"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    실기 일정
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">접수</p>
                      <div className="space-y-1">
                        {item.practicalApplyRanges.length > 0 ? (
                          item.practicalApplyRanges.map((range, index) => (
                            <div key={`practical-${item.id}-${index}`} className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {range.label}
                              </span>
                              <p className="font-semibold">{formatDateRange(range.start, range.end)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="font-semibold text-slate-400">일정 없음</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">시험일</p>
                      <p className="font-semibold">{item.practicalExamDate || "없음"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">합격 발표</p>
                      <p className="font-semibold">{item.practicalResultDate || "없음"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h3 className="font-bold">
                일정 추가
              </h3>
              <button
                onClick={() => {
                  setCertModalOpen(null);
                  setCalendarError("");
                }}
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 p-4">
              {calendarError && <p className="text-sm text-red-500">{calendarError}</p>}

              <label className="block text-sm font-bold text-hp-700">일정 제목</label>
              <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                {certModalOpen.certificateName}
              </div>

              <label className="block text-sm font-bold text-hp-700">캘린더에 추가할 일정</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!certModalOpen.writtenExamDate}
                  onClick={() => setCertScheduleType("written")}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                    certScheduleType === "written"
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  필기
                </button>
                <button
                  type="button"
                  disabled={!certModalOpen.practicalExamDate}
                  onClick={() => setCertScheduleType("practical")}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                    certScheduleType === "practical"
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  실기
                </button>
              </div>

              <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">
                {selectedScheduleLabel}
              </div>

              <div className="space-y-1 text-xs text-slate-500">
                <p>접수 일정</p>
                {selectedApplyRanges.length > 0 ? (
                  selectedApplyRanges.map((range, index) => (
                    <div key={`modal-apply-${index}`} className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {range.label}
                      </span>
                      <p className="text-sm font-semibold text-slate-700">{formatDateRange(range.start, range.end)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-slate-400">일정 없음</p>
                )}
              </div>

              <button
                disabled={calendarSaving}
                className="mt-4 w-full rounded-lg bg-hp-600 p-3 font-bold text-white disabled:opacity-60"
                onClick={async () => {
                  if (!currentUser || !selectedScheduleDate || calendarSaving) return;

                  try {
                    setCalendarSaving(true);
                    setCalendarError("");

                    const primaryScheduleId = certModalOpen.sourceSchedules[0]?.id;
                    if (primaryScheduleId) {
                      await saveUserCertificate(currentUser.id, primaryScheduleId);
                    }

                    const eventsToCreate = [
                      createCalendarEvent({
                        userId: currentUser.id,
                        title: buildEventTitle(certModalOpen.certificateName, certScheduleType, "시험"),
                        startDate: selectedScheduleDate,
                        endDate: selectedScheduleDate,
                        color: certScheduleType === "written" ? "bg-violet-500" : "bg-indigo-500",
                        isAllDay: true,
                        kind: "certificate",
                      }),
                    ];

                    selectedApplyRanges.forEach((range) => {
                      const normalizedStart = range.start || range.end;
                      const normalizedEnd = range.end || range.start;
                      const applySuffix = range.label === "추가접수" ? "추가접수" : "접수";

                      if (!normalizedStart) return;

                      eventsToCreate.unshift(
                        createCalendarEvent({
                          userId: currentUser.id,
                          title: buildEventTitle(certModalOpen.certificateName, certScheduleType, applySuffix),
                          startDate: normalizedStart,
                          endDate: normalizedEnd || normalizedStart,
                          color: certScheduleType === "written" ? "bg-violet-300" : "bg-indigo-300",
                          isAllDay: true,
                          kind: "certificate",
                        }),
                      );
                    });

                    const createdEvents = await Promise.all(eventsToCreate);
                    setEvents((prev) => [...prev, ...createdEvents]);
                    setCertModalOpen(null);
                    router.push("/calendar");
                  } catch (error) {
                    setCalendarError(error instanceof Error ? error.message : "캘린더에 추가하지 못했습니다.");
                  } finally {
                    setCalendarSaving(false);
                  }
                }}
              >
                {calendarSaving ? "저장 중..." : "캘린더에 추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
