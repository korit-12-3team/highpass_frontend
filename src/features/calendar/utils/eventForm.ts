import { EventType } from "@/shared/context/AppContext";
import { EventFormState } from "@/features/calendar/types";

export type EventKind = "general" | "certificate" | "holiday" | "kakao";

export const EVENT_KIND_FILTERS: { kind: EventKind; label: string; colorClass: string }[] = [
  { kind: "general", label: "일반 일정", colorClass: "bg-hp-500" },
  { kind: "certificate", label: "자격증 일정", colorClass: "bg-amber-500" },
  { kind: "holiday", label: "공휴일", colorClass: "bg-rose-400" },
  { kind: "kakao", label: "카카오 일정", colorClass: "bg-yellow-400" },
];

export const DEFAULT_EVENT_FORM: EventFormState = {
  id: null,
  title: "",
  content: "",
  startDate: "",
  endDate: "",
  color: "bg-hp-500",
  isAllDay: false,
  startTime: "09:00",
  endTime: "10:00",
  kind: "general",
};

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getDefaultEventTimes() {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  return { startTime: formatTimeValue(start), endTime: formatTimeValue(end) };
}

export function buildEventForm(dateText: string, event?: EventType): EventFormState {
  if (!event) {
    return { ...DEFAULT_EVENT_FORM, startDate: dateText, endDate: dateText, ...getDefaultEventTimes() };
  }
  return {
    id: event.id,
    title: event.title,
    content: event.content ?? event.title,
    startDate: event.startDate ?? dateText,
    endDate: event.endDate ?? event.startDate ?? dateText,
    color: event.color || "bg-hp-500",
    isAllDay: event.isAllDay,
    startTime: event.startTime || "09:00",
    endTime: event.endTime || "10:00",
    kind: event.kind || "general",
  };
}

export function getDisplayEventColor(event: EventType): string {
  if (event.kind === "certificate") return "bg-amber-500";
  if (event.kind === "kakao") return "bg-yellow-400";
  return event.color;
}

export function getEventKind(event: EventType): EventKind {
  if (event.id.startsWith("holiday-")) return "holiday";
  if (event.kind === "kakao") return "kakao";
  return event.kind === "certificate" ? "certificate" : "general";
}
