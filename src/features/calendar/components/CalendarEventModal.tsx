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
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="space-y-4 p-5">
          <input
            type="text"
            value={form.title}
            onChange={onChangeField("title")}
            placeholder="일정 제목"
            className="w-full border-b-2 border-hp-200 p-2 text-lg font-bold outline-none focus:border-hp-600"
          />
          <textarea
            value={form.content}
            onChange={onChangeField("content")}
            placeholder="일정 설명"
            rows={3}
            className="w-full rounded-xl border border-hp-100 p-3 outline-none focus:border-hp-300"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={form.startDate}
              onChange={onChangeStartDate}
              className="w-full rounded-xl border border-hp-100 p-2.5"
            />
            <input
              type="date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={onChangeEndDate}
              className="w-full rounded-xl border border-hp-100 p-2.5"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onToggleAllDay} className="rounded-lg border border-hp-200 px-3 py-2 text-sm">
              {form.isAllDay ? "종일" : "시간 설정"}
            </button>
            {!form.isAllDay && (
              <>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={onChangeField("startTime")}
                  className="rounded-xl border border-hp-100 p-2.5"
                />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={onChangeField("endTime")}
                  className="rounded-xl border border-hp-100 p-2.5"
                />
              </>
            )}
          </div>
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
