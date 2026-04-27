import { Calendar as CalendarIcon, Clock, Pencil, Trash2, X } from "lucide-react";
import { EventType } from "@/shared/context/AppContext";
import { formatEventRange } from "@/features/calendar/utils/calendarLayout";

type CalendarEventDetailModalProps = {
  event: EventType | null;
  currentYear: number;
  getDisplayEventColor: (event: EventType) => string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function CalendarEventDetailModal({
  event,
  currentYear,
  getDisplayEventColor,
  onClose,
  onEdit,
  onDelete,
}: CalendarEventDetailModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`${getDisplayEventColor(event)} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-bold text-white/70">
                {event.isAllDay ? "종일" : `${event.startTime} ~ ${event.endTime}`}
              </p>
              <h3 className="text-xl font-bold leading-tight text-white">{event.title}</h3>
            </div>
            <button onClick={onClose} className="rounded-full bg-white/20 p-1.5">
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <CalendarIcon size={16} className="text-hp-500" />
            <span className="font-medium">{formatEventRange(event, currentYear)}</span>
          </div>
          {!event.isAllDay && (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock size={16} className="text-hp-500" />
              <span className="font-medium">
                {event.startTime} ~ {event.endTime}
              </span>
            </div>
          )}
          {event.content && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{event.content}</p>}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-hp-200 py-2.5 text-sm font-bold text-hp-700 transition-colors hover:bg-hp-50"
          >
            <Pencil size={15} />
            수정
          </button>
          <button
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 size={15} />
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
