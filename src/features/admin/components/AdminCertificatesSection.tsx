"use client";

import { useMemo, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import ConfirmModal from "@/shared/components/common/ConfirmModal";
import { type CertificateSchedule } from "@/features/search/api/certificates";
import {
  formatDateRange,
  getLatestMergedScheduleDate,
  isPastMergedSchedule,
  mergeSchedules,
  type MergedCertificateSchedule,
  type ScheduleSourceTab,
  type ScheduleTab,
} from "@/features/search/utils/certificateSchedule";

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

function formatSyncedAt(value: string | null): string {
  if (!value) return "기록 없음";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "기록 없음";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminCertificatesSection({
  schedules,
  syncing,
  syncMessage,
  onSync,
}: {
  schedules: CertificateSchedule[];
  totalSchedules: number;
  qnetCount: number;
  dataIndustryCount: number;
  lastSyncedAt: string | null;
  syncing: boolean;
  syncMessage: string;
  onSync: () => void;
}) {
  const [activeSourceTab, setActiveSourceTab] = useState<ScheduleSourceTab>("qnet");
  const [activeTab, setActiveTab] = useState<ScheduleTab>("upcoming");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

  const mergedSchedules = useMemo(() => mergeSchedules(schedules), [schedules]);

  const sourceCounts = useMemo(
    () => ({
      qnet: mergedSchedules.filter((item) => item.sourceType === "qnet").length,
      dataIndustry: mergedSchedules.filter((item) => item.sourceType === "data-industry").length,
      qnetRaw: schedules.filter((s) => s.sourceType === "qnet").length,
      dataIndustryRaw: schedules.filter((s) => s.sourceType === "data-industry").length,
    }),
    [mergedSchedules, schedules],
  );

  const mergedDuplicates = useMemo(() => {
    if (activeSourceTab === "qnet") return sourceCounts.qnetRaw - sourceCounts.qnet;
    return sourceCounts.dataIndustryRaw - sourceCounts.dataIndustry;
  }, [activeSourceTab, sourceCounts]);

  const sourceFilteredSchedules = useMemo(
    () => mergedSchedules.filter((item) => item.sourceType === activeSourceTab),
    [activeSourceTab, mergedSchedules],
  );

  const upcomingSchedules = useMemo(
    () => sourceFilteredSchedules.filter((item) => !isPastMergedSchedule(item)),
    [sourceFilteredSchedules],
  );

  const pastSchedules = useMemo(
    () =>
      sourceFilteredSchedules
        .filter((item) => isPastMergedSchedule(item))
        .sort((a, b) =>
          getLatestMergedScheduleDate(b).localeCompare(getLatestMergedScheduleDate(a)),
        ),
    [sourceFilteredSchedules],
  );

  const visibleSchedules = activeTab === "past" ? pastSchedules : upcomingSchedules;

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setSyncConfirmOpen(true)}
          disabled={syncing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-hp-200 bg-white px-4 py-2.5 text-sm font-black text-hp-700 transition hover:bg-hp-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
          {syncing ? "갱신 중..." : "자격증 일정 갱신"}
        </button>

        {syncing ? (
          <span className="text-sm font-semibold text-amber-700">자격증 일정 API를 불러오는 중입니다.</span>
        ) : syncMessage ? (
          <span className="text-sm font-semibold text-emerald-700">{syncMessage}</span>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={syncConfirmOpen}
        title="자격증 일정을 갱신하시겠습니까?"
        description="외부 자격증 일정 데이터를 다시 가져와 현재 저장된 일정 정보를 갱신합니다."
        confirmLabel="갱신"
        onConfirm={() => {
          setSyncConfirmOpen(false);
          onSync();
        }}
        onClose={() => setSyncConfirmOpen(false)}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="border-slate-100">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveSourceTab("qnet")}
              className={`relative px-6 py-3 text-sm font-bold transition ${
                activeSourceTab === "qnet"
                  ? "text-hp-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-hp-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Q-Net
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeSourceTab === "qnet" ? "bg-hp-100 text-hp-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {sourceCounts.qnet}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSourceTab("data-industry")}
              className={`relative px-6 py-3 text-sm font-bold transition ${
                activeSourceTab === "data-industry"
                  ? "text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              데이터 자격검정
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeSourceTab === "data-industry"
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {sourceCounts.dataIndustry}
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "upcoming"
                  ? "bg-hp-600 text-white"
                  : "border border-hp-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              예정 일정
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {upcomingSchedules.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "past"
                  ? "bg-slate-900 text-white"
                  : "border border-hp-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              지난 일정
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === "past" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {pastSchedules.length}
              </span>
            </button>
          </div>
        </div>

        {mergedDuplicates > 0 && (
          <p className="mb-3 text-xs font-semibold text-slate-400">
            DB {activeSourceTab === "qnet" ? sourceCounts.qnetRaw : sourceCounts.dataIndustryRaw}건 중{" "}
            <span className="text-amber-500">{mergedDuplicates}건이 추가접수로 병합</span>되어 {activeSourceTab === "qnet" ? sourceCounts.qnet : sourceCounts.dataIndustry}건 표시
          </p>
        )}

        {schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
            자격증 일정 데이터가 없습니다. 갱신 버튼을 눌러 데이터를 가져오세요.
          </div>
        ) : visibleSchedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
            {activeTab === "past" ? "지난 일정이 없습니다." : "예정된 일정이 없습니다."}
          </div>
        ) : activeSourceTab === "qnet" ? (
          <AdminQnetScheduleTable items={visibleSchedules} />
        ) : (
          <AdminDataIndustryScheduleTable items={visibleSchedules} />
        )}
        </div>
      </section>
    </>
  );
}

function AdminQnetScheduleTable({ items }: { items: MergedCertificateSchedule[] }) {
  return (
    <div className="overflow-x-hidden rounded-xl border border-slate-200">
      <table className="w-full table-fixed text-xs">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[8%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead>
          <tr className="h-11 bg-hp-600 text-white">
            <th className="h-11 px-4 py-0 text-left font-semibold">종목명</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">회차</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">필기 접수</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">필기 시험일</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">필기 발표</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">실기 접수</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">실기 시험일</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">실기 발표</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const { writtenActive, practicalActive, anyActive } = getApplyStatus(item);
            return (
              <tr
                key={item.id}
                className={`h-14 border-t transition ${
                  anyActive
                    ? "border-emerald-100 bg-emerald-50/50"
                    : `border-slate-100 ${index % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`
                }`}
              >
                <td className="h-14 px-4 py-0">
                  <span className="block truncate font-semibold text-slate-800">{item.certificateName}</span>
                  <div className="mt-1 flex h-4 items-center gap-1 overflow-hidden">
                    {anyActive && (
                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {writtenActive && practicalActive
                          ? "필기·실기 접수중"
                          : writtenActive
                            ? "필기 접수중"
                            : "실기 접수중"}
                      </span>
                    )}
                    {item.sourceSchedules.length > 1 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        +추가접수
                      </span>
                    )}
                  </div>
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-600">
                  {item.round > 0 ? `${item.round}회` : "정기"}
                </td>
                <td
                  className={`h-14 whitespace-nowrap px-3 py-0 text-center font-semibold ${writtenActive ? "text-emerald-600" : "text-slate-700"}`}
                >
                  {item.writtenApplyRanges.length > 0 ? (
                    formatDateRange(item.writtenApplyRanges[0]?.start, item.writtenApplyRanges[0]?.end)
                  ) : (
                    <span className="font-normal text-slate-300">—</span>
                  )}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.writtenExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.writtenResultDate || <span className="text-slate-300">—</span>}
                </td>
                <td
                  className={`h-14 whitespace-nowrap px-3 py-0 text-center font-semibold ${practicalActive ? "text-emerald-600" : "text-slate-700"}`}
                >
                  {item.practicalApplyRanges.length > 0 ? (
                    formatDateRange(
                      item.practicalApplyRanges[0]?.start,
                      item.practicalApplyRanges[0]?.end,
                    )
                  ) : (
                    <span className="font-normal text-slate-300">—</span>
                  )}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.practicalExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.practicalResultDate || <span className="text-slate-300">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdminDataIndustryScheduleTable({ items }: { items: MergedCertificateSchedule[] }) {
  return (
    <div className="overflow-x-hidden rounded-xl border border-slate-200">
      <table className="w-full table-fixed text-xs">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[8%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="h-11 bg-slate-800 text-white">
            <th className="h-11 px-4 py-0 text-left font-semibold">종목명</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">회차</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">구분</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">접수기간</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">시험일</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">시험시간</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">합격발표</th>
            <th className="h-11 whitespace-nowrap px-3 py-0 text-center font-semibold">장소</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const { writtenActive, anyActive } = getApplyStatus(item);
            return (
              <tr
                key={item.id}
                className={`h-14 border-t transition ${
                  anyActive
                    ? "border-emerald-100 bg-emerald-50/50"
                    : `border-slate-100 ${index % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`
                }`}
              >
                <td className="h-14 px-4 py-0">
                  <span className="block truncate font-semibold text-slate-800">{item.certificateName}</span>
                  <div className="mt-1 flex h-4 items-center gap-1 overflow-hidden">
                    {anyActive && (
                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        접수중
                      </span>
                    )}
                  </div>
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-600">
                  {item.round > 0 ? `${item.round}회` : "—"}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center">
                  {item.examCategory ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {item.examCategory}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td
                  className={`h-14 whitespace-nowrap px-3 py-0 text-center font-semibold ${writtenActive ? "text-emerald-600" : "text-slate-700"}`}
                >
                  {item.writtenApplyRanges.length > 0 ? (
                    formatDateRange(item.writtenApplyRanges[0]?.start, item.writtenApplyRanges[0]?.end)
                  ) : (
                    <span className="font-normal text-slate-300">—</span>
                  )}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.writtenExamDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.examStartTime || <span className="text-slate-300">—</span>}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.writtenResultDate || <span className="text-slate-300">—</span>}
                </td>
                <td className="h-14 whitespace-nowrap px-3 py-0 text-center text-slate-700">
                  {item.examPlace || <span className="text-slate-300">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
