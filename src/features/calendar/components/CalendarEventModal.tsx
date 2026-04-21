import React from "react";
import { EventFormState } from "@/features/calendar/types";

type CalendarEventModalProps = {
  open: boolean;
  form: EventFormState;
  saving: boolean;
  onChangeField: (
    field: keyof EventFormState,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onChangeStartDate: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeEndDate: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleAllDay: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function CalendarEventModal({
  open,
  form,
  saving,
  onChangeField,
  onChangeStartDate,
  onChangeEndDate,
  onToggleAllDay,
  onClose,
  onSubmit,
}: CalendarEventModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="space-y-5 p-5">
          <input
            type="text"
            value={form.title}
            onChange={onChangeField("title")}
            placeholder="일정 제목"
            className="w-full border-b-2 border-hp-200 px-1 py-3 text-xl font-black outline-none focus:border-hp-600"
          />

          <div className="space-y-3">
            <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-3">
              <button
                type="button"
                onClick={onToggleAllDay}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                  form.isAllDay
                    ? "border-hp-600 bg-hp-600 text-white"
                    : "border-hp-200 bg-white text-hp-700 hover:bg-hp-50"
                }`}
              >
                종일
              </button>
              <label className="space-y-1">
                <span className="text-xs font-bold text-slate-500">시작일</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={onChangeStartDate}
                  className="w-full rounded-xl border border-hp-100 p-2.5 text-sm font-semibold outline-none focus:border-hp-400"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-slate-500">종료일</span>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || undefined}
                  onChange={onChangeEndDate}
                  className="w-full rounded-xl border border-hp-100 p-2.5 text-sm font-semibold outline-none focus:border-hp-400"
                />
              </label>
            </div>

            {!form.isAllDay && (
              <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-3">
                <div className="w-[52px]" />
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-500">시작 시간</span>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={onChangeField("startTime")}
                    className="w-full rounded-xl border border-hp-100 p-2.5 text-sm font-semibold outline-none focus:border-hp-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-500">종료 시간</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={onChangeField("endTime")}
                    className="w-full rounded-xl border border-hp-100 p-2.5 text-sm font-semibold outline-none focus:border-hp-400"
                  />
                </label>
              </div>
            )}
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-500">일정 설명</span>
            <textarea
              value={form.content}
              onChange={onChangeField("content")}
              placeholder="메모나 세부 내용을 입력해 주세요"
              rows={3}
              className="w-full resize-none rounded-xl border border-hp-100 p-3 text-sm outline-none focus:border-hp-300"
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-hp-50 p-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-hp-200 bg-hp-50 px-4 py-2.5 font-bold text-hp-700 hover:bg-hp-100"
          >
            취소
          </button>
          <button
            disabled={saving}
            onClick={onSubmit}
            className="flex-1 rounded-xl bg-hp-600 px-4 py-2.5 font-bold text-white hover:bg-hp-700 disabled:opacity-60"
          >
            {saving ? "저장 중..." : form.id ? "수정" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
