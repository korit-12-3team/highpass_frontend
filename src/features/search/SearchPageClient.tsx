"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, CheckCircle2, ClipboardPenLine, Search, X } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { createCalendarEvent } from "@/lib/calendar";
import { listCertificateSchedules, type CertificateSchedule } from "@/lib/certificates";
import { saveUserCertificate } from "@/lib/user-certificates";

type CertScheduleType = "written" | "practical";

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return "일정 미정";
  if (start && end) return `${start} ~ ${end}`;
  return start || end || "일정 미정";
}

function buildEventTitle(name: string, scheduleType: CertScheduleType, suffix: string) {
  return `${name} ${scheduleType === "written" ? "필기" : "실기"} ${suffix}`;
}

export default function SearchPageClient() {
  const { currentUser, setEvents } = useApp();
  const router = useRouter();

  const [schedules, setSchedules] = useState<CertificateSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [certModalOpen, setCertModalOpen] = useState<CertificateSchedule | null>(null);
  const [certScheduleType, setCertScheduleType] = useState<CertScheduleType>("written");
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarError, setCalendarError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const data = await listCertificateSchedules();
        if (cancelled) return;
        setSchedules(data);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "자격증 일정을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!certModalOpen) return;
    setCertScheduleType(certModalOpen.writtenExamDate ? "written" : "practical");
  }, [certModalOpen]);

  const selectedScheduleDate =
    certScheduleType === "written" ? certModalOpen?.writtenExamDate : certModalOpen?.practicalExamDate;

  const selectedApplyRange =
    certScheduleType === "written"
      ? formatDateRange(certModalOpen?.writtenApplyStart, certModalOpen?.writtenApplyEnd)
      : formatDateRange(certModalOpen?.practicalApplyStart, certModalOpen?.practicalApplyEnd);

  const selectedScheduleLabel =
    certScheduleType === "written"
      ? `필기 ${certModalOpen?.writtenExamDate || "미정"}`
      : `실기 ${certModalOpen?.practicalExamDate || "미정"}`;

  const filteredSchedules = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return schedules;
    return schedules.filter((item) => item.certificateName.toLowerCase().includes(keyword));
  }, [schedules, searchKeyword]);

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in duration-500">
      <div className="mb-6 rounded-2xl border border-hp-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">자격증 정보</h2>
            <p className="mt-2 text-sm text-slate-500">저장된 자격증 시험 일정을 조회하고 캘린더에 추가할 수 있습니다.</p>
          </div>

          <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-hp-100 bg-hp-50 px-3 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="자격증명 검색"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

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
              현재 저장된 자격증 일정이 없습니다.
            </div>
          )}

          {filteredSchedules.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-md">
              <div className="flex flex-col gap-3 border-b border-hp-100 bg-hp-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{item.year}년</span>
                    <span className="rounded-full bg-hp-100 px-2 py-1 text-xs font-bold text-hp-700">
                      {item.round > 0 ? `${item.round}회차` : "정기 일정"}
                    </span>
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
                  캘린더 추가
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
                      <p className="font-semibold">{formatDateRange(item.writtenApplyStart, item.writtenApplyEnd)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">시험</p>
                      <p className="font-semibold">{item.writtenExamDate || "미정"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">합격 발표</p>
                      <p className="font-semibold">{item.writtenResultDate || "미정"}</p>
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
                      <p className="font-semibold">{formatDateRange(item.practicalApplyStart, item.practicalApplyEnd)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">시험</p>
                      <p className="font-semibold">{item.practicalExamDate || "미정"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">합격 발표</p>
                      <p className="font-semibold">{item.practicalResultDate || "미정"}</p>
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
                <span className="block text-xs font-normal text-slate-400">
                  {certModalOpen.year}년 {certModalOpen.round > 0 ? `${certModalOpen.round}회차` : "정기 일정"}
                </span>
                캘린더에 추가
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

              <label className="block text-sm font-bold text-hp-700">자격증명</label>
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

              <p className="text-xs text-slate-400">접수 {selectedApplyRange}</p>

              <button
                disabled={calendarSaving}
                className="mt-4 w-full rounded-lg bg-hp-600 p-3 font-bold text-white disabled:opacity-60"
                onClick={async () => {
                  if (!currentUser || !selectedScheduleDate || calendarSaving) return;

                  const applyStart =
                    certScheduleType === "written" ? certModalOpen.writtenApplyStart : certModalOpen.practicalApplyStart;
                  const applyEnd =
                    certScheduleType === "written" ? certModalOpen.writtenApplyEnd : certModalOpen.practicalApplyEnd;
                  const normalizedApplyStart = applyStart || applyEnd;
                  const normalizedApplyEnd = applyEnd || applyStart;

                  try {
                    setCalendarSaving(true);
                    setCalendarError("");

                    await saveUserCertificate(currentUser.id, certModalOpen.id);

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

                    if (normalizedApplyStart) {
                      eventsToCreate.unshift(
                        createCalendarEvent({
                          userId: currentUser.id,
                          title: buildEventTitle(certModalOpen.certificateName, certScheduleType, "접수"),
                          startDate: normalizedApplyStart,
                          endDate: normalizedApplyEnd || normalizedApplyStart,
                          color: certScheduleType === "written" ? "bg-violet-300" : "bg-indigo-300",
                          isAllDay: true,
                          kind: "certificate",
                        }),
                      );
                    }

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
