"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { toUserMessage } from "@/shared/errors";
import { useApp } from "@/shared/context/AppContext";
import { listCertificateSchedules, type CertificateSchedule } from "@/features/search/api/certificates";
import { CertificateScheduleModal } from "@/features/search/components/CertificateScheduleModal";
import {
  formatDateRange,
  getLatestMergedScheduleDate,
  isPastMergedSchedule,
  mergeSchedules,
  type CalendarSelectionState,
  type CertScheduleType,
  type MergedCertificateSchedule,
  type ScheduleSourceTab,
  type ScheduleTab,
} from "@/features/search/utils/certificateSchedule";

const QNET_CATEGORY_TABS = [
  { key: "all", label: "전체" },
  { key: "기사,산업기사", label: "기사·산업기사" },
  { key: "기능사", label: "기능사" },
];

const DATA_CATEGORY_TABS = [
  { key: "all", label: "전체" },
  { key: "빅데이터분석기사", label: "빅데이터분석기사" },
  { key: "데이터분석", label: "데이터분석 (ADP·ADSP)" },
  { key: "SQL", label: "SQL (SQLP·SQLD)" },
  { key: "데이터아키텍처", label: "데이터아키텍처 (DAP·DASP)" },
];

function getApplyStatus(item: MergedCertificateSchedule) {
  const today = new Date().toLocaleDateString("en-CA");
  const writtenActive = item.writtenApplyRanges.some(
    (r) => r.start && r.end && today >= r.start && today <= r.end,
  );
  const practicalActive = item.practicalApplyRanges.some(
    (r) => r.start && r.end && today >= r.start && today <= r.end,
  );
  return { writtenActive, practicalActive, anyActive: writtenActive || practicalActive };
}

function filterByCategory(
  items: MergedCertificateSchedule[],
  sourceTab: ScheduleSourceTab,
  categoryKey: string,
): MergedCertificateSchedule[] {
  if (categoryKey === "all") return items;
  if (sourceTab === "qnet") {
    if (categoryKey === "기능사") return items.filter((i) => i.certificateName.includes("기능사"));
    if (categoryKey === "기사,산업기사") return items.filter((i) => i.certificateName.includes("기사") && !i.certificateName.includes("기능사"));
  }
  if (sourceTab === "data-industry") {
    if (categoryKey === "빅데이터분석기사") return items.filter((i) => i.certificateName.includes("빅데이터"));
    if (categoryKey === "데이터분석") return items.filter((i) => /ADP|ADSP/.test(i.certificateName) || i.certificateName.includes("데이터분석전문가") || i.certificateName.includes("데이터분석준전문가"));
    if (categoryKey === "SQL") return items.filter((i) => i.certificateName.toUpperCase().includes("SQL"));
    if (categoryKey === "데이터아키텍처") return items.filter((i) => /DAP|DASP/.test(i.certificateName) || i.certificateName.includes("아키텍처"));
  }
  return items;
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
  const [calendarSelection, setCalendarSelection] = useState<CalendarSelectionState>({
    apply: true,
    exam: true,
    result: true,
  });
  const [activeTab, setActiveTab] = useState<ScheduleTab>(requestedTab === "past" ? "past" : "upcoming");
  const [activeSourceTab, setActiveSourceTab] = useState<ScheduleSourceTab>("qnet");
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");

  const loadSchedules = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await listCertificateSchedules();
      setSchedules(data);
    } catch (error) {
      toast.error(toUserMessage(error, "자격증 일정을 불러오지 못했습니다."));
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
  console.log(certModalOpen)
  const isPractical = 
    certModalOpen.sourceType === "data-industry" && 
    certModalOpen.examType === "실기";

  setCertScheduleType(isPractical ? "practical" : "written");
  setCalendarSelection({ apply: true, exam: true, result: true });
  }, [certModalOpen]);

  const mergedSchedules = useMemo(() => mergeSchedules(schedules), [schedules]);

  const sourceCounts = useMemo(
    () => ({
      qnet: mergedSchedules.filter((item) => item.sourceType === "qnet").length,
      dataIndustry: mergedSchedules.filter((item) => item.sourceType === "data-industry").length,
    }),
    [mergedSchedules],
  );

  const sourceFilteredSchedules = useMemo(
    () => mergedSchedules.filter((item) => item.sourceType === activeSourceTab),
    [activeSourceTab, mergedSchedules],
  );

  const categoryFilteredSchedules = useMemo(
    () => filterByCategory(sourceFilteredSchedules, activeSourceTab, activeCategoryTab),
    [activeCategoryTab, activeSourceTab, sourceFilteredSchedules],
  );

  useEffect(() => {
    setActiveCategoryTab("all");
  }, [activeSourceTab]);

  const upcomingSchedules = useMemo(
    () => categoryFilteredSchedules.filter((item) => !isPastMergedSchedule(item)),
    [categoryFilteredSchedules],
  );

  const pastSchedules = useMemo(
    () =>
      categoryFilteredSchedules
        .filter((item) => isPastMergedSchedule(item))
        .sort((a, b) => getLatestMergedScheduleDate(b).localeCompare(getLatestMergedScheduleDate(a))),
    [categoryFilteredSchedules],
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

  const selectedCalendarItemCount =
    (calendarSelection.apply ? selectedApplyRanges.filter((range) => range.start || range.end).length : 0) +
    (calendarSelection.exam && selectedScheduleDate ? 1 : 0) +
    (calendarSelection.result && selectedResultDate ? 1 : 0);

  const toggleCalendarSelection = (key: keyof CalendarSelectionState) => {
    setCalendarSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentSourceEmptyMessage =
    activeSourceTab === "qnet"
      ? "현재 선택한 기간에 Q-Net 일정이 없습니다."
      : "현재 선택한 기간에 데이터 자격검정 일정이 없습니다.";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 rounded-2xl border border-hp-100 bg-white p-4 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">자격증 정보</h2>
          <p className="mt-2 text-sm text-slate-500">Q-Net 일정과 데이터 자격검정 일정을 구분해서 조회하고 캘린더에 추가할 수 있습니다.</p>
        </div>

        <div className="mb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveSourceTab("qnet")}
                className={`relative px-6 py-4 text-base font-bold transition ${
                  activeSourceTab === "qnet"
                    ? "text-hp-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-hp-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Q-Net
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeSourceTab === "qnet" ? "bg-hp-100 text-hp-700" : "bg-slate-100 text-slate-500"}`}>
                  {sourceCounts.qnet}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSourceTab("data-industry")}
                className={`relative px-6 py-4 text-base font-bold transition ${
                  activeSourceTab === "data-industry"
                    ? "text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                데이터 자격검정
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeSourceTab === "data-industry" ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-500"}`}>
                  {sourceCounts.dataIndustry}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-hp-100 bg-hp-50 px-3 py-2.5 mb-1">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="자격증 검색"
                className="w-80 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(activeSourceTab === "qnet" ? QNET_CATEGORY_TABS : DATA_CATEGORY_TABS).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategoryTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeCategoryTab === tab.key
                    ? activeSourceTab === "qnet"
                      ? "bg-hp-600 text-white"
                      : "bg-slate-800 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
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
        </div>

        <div>
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
                  : currentSourceEmptyMessage}
            </div>
          )}

          {!loading && !loadError && filteredSchedules.length > 0 && (
            activeSourceTab === "qnet" ? (
              <QnetScheduleTable
                items={filteredSchedules}
                onOpen={(item) => {
                  setCertModalOpen(item);
                }}
              />
            ) : (
              <DataIndustryScheduleTable
                items={filteredSchedules}
                onOpen={(item) => {
                  setCertModalOpen(item);
                }}
              />
            )
          )}
        </div>
      </div>

      {certModalOpen && (
        <CertificateScheduleModal
          schedule={certModalOpen}
          currentUserId={currentUser?.id}
          scheduleType={certScheduleType}
          calendarSelection={calendarSelection}
          calendarSaving={calendarSaving}
          selectedScheduleDate={selectedScheduleDate}
          selectedResultDate={selectedResultDate}
          selectedApplyRanges={selectedApplyRanges}
          selectedCalendarItemCount={selectedCalendarItemCount}
          onChangeScheduleType={setCertScheduleType}
          onToggleSelection={toggleCalendarSelection}
          onClose={() => setCertModalOpen(null)}
          onSetSaving={setCalendarSaving}
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

function QnetScheduleTable({
  items,
  onOpen,
}: {
  items: MergedCertificateSchedule[];
  onOpen: (item: MergedCertificateSchedule) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="bg-hp-600 text-white">
            <th className="px-4 py-3 text-left font-semibold">종목명</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">회차</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">필기 접수</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">필기 시험일</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">필기 발표</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">실기 접수</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">실기 시험일</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">실기 발표</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const { writtenActive, practicalActive, anyActive } = getApplyStatus(item);
            return (
              <tr
                key={item.id}
                className={`border-t transition ${
                  anyActive
                    ? "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50"
                    : `border-slate-100 hover:bg-hp-50 ${index % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-semibold text-slate-800">{item.certificateName}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {anyActive && (
                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {writtenActive && practicalActive ? "필기·실기 접수중" : writtenActive ? "필기 접수중" : "실기 접수중"}
                      </span>
                    )}
                    {item.sourceSchedules.length > 1 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">+추가접수</span>
                    )}
                    {isPastMergedSchedule(item) && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">지난</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-600">
                  {item.round > 0 ? `${item.round}회` : "정기"}
                </td>
                <td className={`whitespace-nowrap px-3 py-3 text-center font-semibold ${writtenActive ? "text-emerald-600" : "text-slate-700"}`}>
                  {item.writtenApplyRanges.length > 0
                    ? formatDateRange(item.writtenApplyRanges[0]?.start, item.writtenApplyRanges[0]?.end)
                    : <span className="font-normal text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.writtenExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.writtenResultDate || <span className="text-slate-300">—</span>}
                </td>
                <td className={`whitespace-nowrap px-3 py-3 text-center font-semibold ${practicalActive ? "text-emerald-600" : "text-slate-700"}`}>
                  {item.practicalApplyRanges.length > 0
                    ? formatDateRange(item.practicalApplyRanges[0]?.start, item.practicalApplyRanges[0]?.end)
                    : <span className="font-normal text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.practicalExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.practicalResultDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => onOpen(item)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-hp-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-hp-700"
                  >
                    <CalendarIcon size={13} />
                    추가
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DataIndustryScheduleTable({
  items,
  onOpen,
}: {
  items: MergedCertificateSchedule[];
  onOpen: (item: MergedCertificateSchedule) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-4 py-3 text-left font-semibold">종목명</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">회차</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">구분</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">접수기간</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">시험일</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">시험시간</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">합격발표</th>
            <th className="whitespace-nowrap px-3 py-3 text-center font-semibold">장소</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const { writtenActive, anyActive } = getApplyStatus(item);
            return (
              <tr
                key={item.id}
                className={`border-t transition ${
                  anyActive
                    ? "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50"
                    : `border-slate-100 hover:bg-slate-50 ${index % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-semibold text-slate-800">{item.certificateName}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {anyActive && (
                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">접수중</span>
                    )}
                    {isPastMergedSchedule(item) && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">지난</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-600">
                  {item.round > 0 ? `${item.round}회` : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center">
                  {item.examCategory
                    ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{item.examCategory}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className={`whitespace-nowrap px-3 py-3 text-center font-semibold ${writtenActive ? "text-emerald-600" : "text-slate-700"}`}>
                  {(item.writtenApplyRanges.length > 0 ? item.writtenApplyRanges : item.practicalApplyRanges).length > 0
                    ? formatDateRange(
                        (item.writtenApplyRanges.length > 0 ? item.writtenApplyRanges : item.practicalApplyRanges)[0]?.start,
                        (item.writtenApplyRanges.length > 0 ? item.writtenApplyRanges : item.practicalApplyRanges)[0]?.end,
                      )
                    : <span className="font-normal text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.writtenExamDate || item.practicalExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.examStartTime || item.practicalExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.writtenResultDate|| item.practicalExamDate  || <span className="text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center text-slate-700">
                  {item.examPlace || item.practicalExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => onOpen(item)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                  >
                    <CalendarIcon size={13} />
                    추가
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
