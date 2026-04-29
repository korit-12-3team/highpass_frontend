import { toast } from "sonner";
import { X } from "lucide-react";
import { createCalendarEvent } from "@/features/calendar/api/calendar";
import { EventType } from "@/shared/context/AppContext";
import { saveUserCertificate } from "@/features/search/api/certificates";
import {
  buildEventTitle,
  formatDateRange,
  type CalendarSelectionState,
  type CertScheduleType,
  type MergedCertificateSchedule,
} from "@/features/search/utils/certificateSchedule";

type CertificateScheduleModalProps = {
  schedule: MergedCertificateSchedule;
  currentUserId?: string;
  scheduleType: CertScheduleType;
  calendarSelection: CalendarSelectionState;
  calendarSaving: boolean;
  calendarError: string;
  selectedScheduleDate?: string;
  selectedResultDate?: string;
  selectedApplyRanges: MergedCertificateSchedule["writtenApplyRanges"];
  selectedCalendarItemCount: number;
  onChangeScheduleType: (type: CertScheduleType) => void;
  onToggleSelection: (key: keyof CalendarSelectionState) => void;
  onClose: () => void;
  onSetSaving: (saving: boolean) => void;
  onSetError: (message: string) => void;
  onEventsCreated: (events: EventType[]) => void;
  onAdded: () => void;
};

export function CertificateScheduleModal({
  schedule,
  currentUserId,
  scheduleType,
  calendarSelection,
  calendarSaving,
  calendarError,
  selectedScheduleDate,
  selectedResultDate,
  selectedApplyRanges,
  selectedCalendarItemCount,
  onChangeScheduleType,
  onToggleSelection,
  onClose,
  onSetSaving,
  onSetError,
  onEventsCreated,
  onAdded,
}: CertificateScheduleModalProps) {
  const handleAddToCalendar = async () => {
    if (!currentUserId || calendarSaving) return;

    if (selectedCalendarItemCount === 0) {
      toast.warning("캘린더에 추가할 일정을 선택해 주세요.");
      return;
    }

    try {
      onSetSaving(true);
      onSetError("");

      const primarySchedule = schedule.sourceSchedules.find((item) => item.sourceType !== "data-industry");
      const primaryScheduleId = primarySchedule?.id;
      if (primaryScheduleId) {
        await saveUserCertificate(currentUserId, primaryScheduleId);
      }

      const eventsToCreate: ReturnType<typeof createCalendarEvent>[] = [];

      if (calendarSelection.exam && selectedScheduleDate) {
        eventsToCreate.push(
          createCalendarEvent({
            userId: currentUserId,
            title: buildEventTitle(schedule.certificateName, scheduleType, "시험"),
            startDate: selectedScheduleDate,
            endDate: selectedScheduleDate,
            color: scheduleType === "written" ? "bg-violet-500" : "bg-indigo-500",
            isAllDay: true,
            kind: "certificate",
          }),
        );
      }

      if (calendarSelection.result && selectedResultDate) {
        eventsToCreate.push(
          createCalendarEvent({
            userId: currentUserId,
            title: buildEventTitle(schedule.certificateName, scheduleType, "합격 발표"),
            startDate: selectedResultDate,
            endDate: selectedResultDate,
            color: "bg-amber-500",
            isAllDay: true,
            kind: "certificate",
          }),
        );
      }

      if (calendarSelection.apply) {
        selectedApplyRanges.forEach((range) => {
          const normalizedStart = range.start || range.end;
          const normalizedEnd = range.end || range.start;
          const applySuffix = range.label === "추가접수" ? "추가접수" : "접수";

          if (!normalizedStart) return;

          eventsToCreate.unshift(
            createCalendarEvent({
              userId: currentUserId,
              title: buildEventTitle(schedule.certificateName, scheduleType, applySuffix),
              startDate: normalizedStart,
              endDate: normalizedEnd || normalizedStart,
              color: scheduleType === "written" ? "bg-violet-300" : "bg-indigo-300",
              isAllDay: true,
              kind: "certificate",
            }),
          );
        });
      }

      const createdEvents = await Promise.all(eventsToCreate);
      onEventsCreated(createdEvents);
      toast.success("캘린더에 일정이 추가되었습니다.");
      onAdded();
    } catch (error) {
      const message = error instanceof Error ? error.message : "캘린더에 추가하지 못했습니다.";
      onSetError(message);
      toast.error(message);
    } finally {
      onSetSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-bold">일정 추가</h3>
          <button onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {calendarError && <p className="text-sm text-red-500">{calendarError}</p>}

          <label className="block text-sm font-bold text-hp-700">일정 제목</label>
          <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
            {schedule.certificateName}
          </div>

          <label className="block text-sm font-bold text-hp-700">캘린더에 추가할 일정</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!schedule.writtenExamDate}
              onClick={() => onChangeScheduleType("written")}
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                scheduleType === "written"
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              필기
            </button>
            <button
              type="button"
              disabled={!schedule.practicalExamDate}
              onClick={() => onChangeScheduleType("practical")}
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                scheduleType === "practical"
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              실기
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500">추가할 항목 선택</p>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${calendarSelection.apply ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"}`}>
              <input
                type="checkbox"
                checked={calendarSelection.apply}
                disabled={selectedApplyRanges.length === 0}
                onChange={() => onToggleSelection("apply")}
                className="mt-1 h-4 w-4 accent-hp-600 disabled:opacity-40"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">접수일</p>
                {selectedApplyRanges.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {selectedApplyRanges.map((range, index) => (
                      <div key={`modal-apply-${index}`} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {range.label}
                        </span>
                        <span className="font-semibold">{formatDateRange(range.start, range.end)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs font-semibold text-slate-400">일정 없음</p>
                )}
              </div>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${calendarSelection.exam ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"}`}>
              <input
                type="checkbox"
                checked={calendarSelection.exam}
                disabled={!selectedScheduleDate}
                onChange={() => onToggleSelection("exam")}
                className="mt-1 h-4 w-4 accent-hp-600 disabled:opacity-40"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">시험일</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{selectedScheduleDate || "일정 없음"}</p>
              </div>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${calendarSelection.result ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"}`}>
              <input
                type="checkbox"
                checked={calendarSelection.result}
                disabled={!selectedResultDate}
                onChange={() => onToggleSelection("result")}
                className="mt-1 h-4 w-4 accent-hp-600 disabled:opacity-40"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">합격 발표일</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{selectedResultDate || "일정 없음"}</p>
              </div>
            </label>
          </div>

          <button
            disabled={calendarSaving || selectedCalendarItemCount === 0}
            className="mt-4 w-full rounded-lg bg-hp-600 p-3 font-bold text-white disabled:opacity-60"
            onClick={() => void handleAddToCalendar()}
          >
            {calendarSaving ? "저장 중..." : "캘린더에 추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
