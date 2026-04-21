"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, CheckCircle2, ClipboardPenLine, RefreshCw, Search } from "lucide-react";
import { useApp } from "@/shared/context/AppContext";
import { listCertificateSchedules, syncCertificateSchedules, type CertificateSchedule } from "@/features/search/api/certificates";
import { CertificateScheduleModal } from "@/features/search/components/CertificateScheduleModal";
import {
  formatDateRange,
  getLatestMergedScheduleDate,
  isPastMergedSchedule,
  mergeSchedules,
  type CalendarSelectionState,
  type CertScheduleType,
  type MergedCertificateSchedule,
  type ScheduleTab,
} from "@/features/search/utils/certificateSchedule";

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
  const [calendarSelection, setCalendarSelection] = useState<CalendarSelectionState>({
    apply: true,
    exam: true,
    result: true,
  });
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
    setCalendarSelection({ apply: true, exam: true, result: true });
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

  const selectedResultDate =
    certScheduleType === "written" ? certModalOpen?.writtenResultDate : certModalOpen?.practicalResultDate;

  const selectedApplyRanges =
    certScheduleType === "written" ? certModalOpen?.writtenApplyRanges ?? [] : certModalOpen?.practicalApplyRanges ?? [];

  const selectedScheduleLabel =
    certScheduleType === "written"
      ? `필기 ${certModalOpen?.writtenExamDate || "없음"}`
      : `실기 ${certModalOpen?.practicalExamDate || "없음"}`;

  const selectedCalendarItemCount =
    (calendarSelection.apply ? selectedApplyRanges.filter((range) => range.start || range.end).length : 0) +
    (calendarSelection.exam && selectedScheduleDate ? 1 : 0) +
    (calendarSelection.result && selectedResultDate ? 1 : 0);

  const toggleCalendarSelection = (key: keyof CalendarSelectionState) => {
    setCalendarSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
              {syncingSchedules ? "갱신 중..." : "자격증 갱신"}
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
        <CertificateScheduleModal
          schedule={certModalOpen}
          currentUserId={currentUser?.id}
          scheduleType={certScheduleType}
          calendarSelection={calendarSelection}
          calendarSaving={calendarSaving}
          calendarError={calendarError}
          selectedScheduleDate={selectedScheduleDate}
          selectedResultDate={selectedResultDate}
          selectedApplyRanges={selectedApplyRanges}
          selectedCalendarItemCount={selectedCalendarItemCount}
          onChangeScheduleType={setCertScheduleType}
          onToggleSelection={toggleCalendarSelection}
          onClose={() => {
            setCertModalOpen(null);
            setCalendarError("");
          }}
          onSetSaving={setCalendarSaving}
          onSetError={setCalendarError}
          onEventsCreated={(createdEvents) => setEvents((prev) => [...prev, ...createdEvents])}
          onAdded={() => {
            setCertModalOpen(null);
            router.push("/calendar");
          }}
        />
      )}
    </div>
  );
}
