"use client";

import React, { useRef } from "react";
import { ArrowRight, MessageCircle, Plus } from "lucide-react";
import { EventType, TodoItem } from "@/shared/context/AppContext";
import {
  CalendarDayCell,
  MAX_VISIBLE_EVENT_ROWS,
  buildWeekEventRows,
  eventOverlapsDate,
  formatDateKey,
  getCellDate,
  getEventLabelStyle,
  getEventSegmentState,
  shouldShowEventLabel,
} from "@/features/calendar/utils/calendarLayout";
import {
  EventKind,
  EVENT_KIND_FILTERS,
  getDisplayEventColor,
  getEventKind,
} from "@/features/calendar/utils/eventForm";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

type CalendarMainViewProps = {
  currentYear: number;
  currentMonth: number;
  selectedDate: number;
  todayInfo: { year: number; month: number; date: number } | null;
  events: EventType[];
  todos: Record<string, TodoItem[]>;
  kakaoLoading: boolean;
  isKakaoUser: boolean;
  visibleEventKinds: Record<EventKind, boolean>;
  onToggleEventKind: (kind: EventKind, value: boolean) => void;
  onMonthChange: (year: number, month: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onLoadKakao: () => void;
  onCreateEvent: () => void;
  onSelectDate: (year: number, month: number, date: number) => void;
  onDoubleClickDate: (dateKey: string) => void;
  onEventDragStart: (e: React.DragEvent, eventId: string) => void;
  onEventDragOver: (e: React.DragEvent) => void;
  onEventDrop: (e: React.DragEvent, dateKey: string) => void;
};

export function CalendarMainView({
  currentYear,
  currentMonth,
  selectedDate,
  todayInfo,
  events,
  todos,
  kakaoLoading,
  isKakaoUser,
  visibleEventKinds,
  onToggleEventKind,
  onMonthChange,
  onPrevMonth,
  onNextMonth,
  onToday,
  onLoadKakao,
  onCreateEvent,
  onSelectDate,
  onDoubleClickDate,
  onEventDragStart,
  onEventDragOver,
  onEventDrop,
}: CalendarMainViewProps) {
  const monthInputRef = useRef<HTMLInputElement>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const currentMonthInputValue = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const calendarDays: CalendarDayCell[] = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayOfWeek + 1;
    if (dayNumber < 1) return { key: `prev-${index}`, date: prevMonthDays + dayNumber, currentMonth: false };
    if (dayNumber > daysInMonth) return { key: `next-${index}`, date: dayNumber - daysInMonth, currentMonth: false };
    return { key: `current-${dayNumber}`, date: dayNumber, currentMonth: true };
  });

  const filteredEvents = events.filter((event) => visibleEventKinds[getEventKind(event)]);
  const eventKindCounts = EVENT_KIND_FILTERS.reduce(
    (counts, filter) => ({ ...counts, [filter.kind]: events.filter((e) => getEventKind(e) === filter.kind).length }),
    {} as Record<EventKind, number>,
  );

  const weekLayoutByCellKey = new Map(
    Array.from({ length: 6 }, (_, weekIndex) =>
      buildWeekEventRows(
        calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7),
        filteredEvents,
        currentYear,
        currentMonth,
      ),
    )
      .flat()
      .map((item) => [item.cellKey, item] as const),
  );

  const getTodosForDate = (date: number) => todos[formatDateKey(currentYear, currentMonth, date)] ?? [];

  const openMonthPicker = () => {
    const picker = monthInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!picker) return;
    if (typeof picker.showPicker === "function") { picker.showPicker(); return; }
    picker.focus();
    picker.click();
  };

  return (
    <div className="flex h-full min-w-[700px] flex-col rounded-2xl border border-hp-100 bg-white p-5 shadow-sm transition-all duration-300">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-y-4">
        <div className="flex items-center gap-4">
          <div className="w-fit shrink-0">
            <button
              type="button"
              onClick={openMonthPicker}
              className="flex w-full items-center rounded-lg px-2 py-1 text-left text-2xl font-bold tabular-nums text-slate-800 transition-colors hover:bg-hp-50"
            >
              {currentYear}년 {currentMonth + 1}월
            </button>
            <input
              ref={monthInputRef}
              type="month"
              value={currentMonthInputValue}
              onChange={(e) => {
                if (!e.target.value) return;
                const [yearText, monthText] = e.target.value.split("-");
                const nextYear = Number(yearText);
                const nextMonth = Number(monthText);
                if (!Number.isFinite(nextYear) || !Number.isFinite(nextMonth)) return;
                onMonthChange(nextYear, nextMonth);
              }}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={onPrevMonth} className="rounded-lg p-1.5 transition-colors hover:bg-hp-50">
              <ArrowRight size={20} className="rotate-180 text-slate-400" />
            </button>
            <button onClick={onToday} className="rounded-lg px-2 text-xs font-bold text-hp-600 hover:bg-hp-50">
              오늘
            </button>
            <button onClick={onNextMonth} className="rounded-lg p-1.5 transition-colors hover:bg-hp-50">
              <ArrowRight size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-nowrap">
          {isKakaoUser && (
            <button
              onClick={onLoadKakao}
              disabled={kakaoLoading}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#FEE500] px-4 text-sm font-bold text-[#191919] whitespace-nowrap transition-colors hover:bg-[#FADA00] disabled:opacity-50"
            >
              <MessageCircle size={16} fill="currentColor" />
              {kakaoLoading ? "불러오는 중…" : "카카오 일정"}
            </button>
          )}
          <button
            onClick={onCreateEvent}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-hp-600 px-4 text-sm font-bold text-white whitespace-nowrap transition-colors hover:bg-hp-700"
          >
            <Plus size={16} />
            일정 추가
          </button>
        </div>
      </div>

      {/* Event kind filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {EVENT_KIND_FILTERS.map((filter) => {
          const isActive = visibleEventKinds[filter.kind];
          return (
            <label
              key={filter.kind}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-sm ring-1 ${
                isActive
                  ? "bg-white text-slate-700 ring-hp-500"
                  : "bg-slate-100 text-slate-400 ring-slate-200 opacity-60 hover:opacity-100"
              }`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => onToggleEventKind(filter.kind, e.target.checked)}
                className="sr-only"
              />
              <span className={`h-2.5 w-2.5 rounded-full ${filter.colorClass} ${!isActive && "grayscale"}`} />
              <span>{filter.label}</span>
              <span className={isActive ? "text-hp-600" : "text-slate-400"}>{eventKindCounts[filter.kind] ?? 0}</span>
            </label>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 overflow-hidden rounded-t-2xl border border-b-0 border-hp-100 bg-slate-50 text-xs font-bold text-slate-400">
        {WEEK_DAYS.map((day, idx) => (
          <div
            key={day}
            className={`border-r border-hp-100 py-3 text-center last:border-r-0 ${
              idx === 0 ? "text-rose-400" : idx === 6 ? "text-blue-400" : ""
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-fr grid-cols-7 overflow-hidden rounded-b-2xl border border-hp-100">
        {calendarDays.map((day, index) => {
          const cellDate = getCellDate(day, currentYear, currentMonth);
          const cellDateKey = formatDateKey(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
          const weekLayout = weekLayoutByCellKey.get(day.key);
          const dayEventRows = weekLayout?.rowEvents ?? [];
          const overflowCount = weekLayout?.overflowCount ?? 0;
          const dayTodos = day.currentMonth ? getTodosForDate(day.date) : [];
          const dayCompletedTodos = dayTodos.filter((todo) => todo.done).length;
          const dayPendingTodos = dayTodos.length - dayCompletedTodos;
          const weekStartDate = getCellDate(calendarDays[index - (index % 7)], currentYear, currentMonth);
          const isSelected = day.currentMonth && day.date === selectedDate;
          const isToday =
            day.currentMonth &&
            todayInfo?.year === currentYear &&
            todayInfo?.month === currentMonth &&
            todayInfo?.date === day.date;
          const isHoliday = filteredEvents.some(
            (ev) => ev.id.startsWith("holiday-") && eventOverlapsDate(ev, cellDateKey, currentYear),
          );
          const dayOfWeek = cellDate.getDay();

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDate(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())}
              onDoubleClick={() => onDoubleClickDate(cellDateKey)}
              onDragOver={onEventDragOver}
              onDrop={(e) => onEventDrop(e, cellDateKey)}
              className={`relative min-h-0 border-r border-b border-hp-100 p-1.5 text-left transition-colors ${
                day.currentMonth
                  ? isSelected
                    ? "bg-hp-50"
                    : "bg-white hover:bg-hp-50/50"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100/80"
              }`}
              style={{
                borderRightWidth: (index + 1) % 7 === 0 ? 0 : undefined,
                borderBottomWidth: index >= 35 ? 0 : undefined,
              }}
            >
              <span
                className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  isToday
                    ? "bg-hp-600 text-white"
                    : isSelected
                      ? "bg-white text-hp-700 ring-1 ring-hp-200"
                      : isHoliday || dayOfWeek === 0
                        ? "text-rose-400"
                        : dayOfWeek === 6
                          ? "text-blue-400"
                          : "text-slate-700"
                } ${day.currentMonth || isToday || isSelected ? "" : "opacity-45"}`}
              >
                {day.date}
              </span>

              {day.currentMonth && (dayCompletedTodos > 0 || dayPendingTodos > 0) && (
                <div className="absolute right-2 top-2 flex items-center gap-0.5 whitespace-nowrap">
                  {dayCompletedTodos > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      완료 {dayCompletedTodos}
                    </span>
                  )}
                  {dayPendingTodos > 0 && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      예정 {dayPendingTodos}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-7 flex h-[calc(100%-1.75rem)] flex-col">
                <div className="grid grid-rows-2 gap-0.5">
                  {dayEventRows.slice(0, MAX_VISIBLE_EVENT_ROWS).map((event, rowIndex) => {
                    if (!event) return <div key={`${day.key}-empty-${rowIndex}`} className="h-5" />;
                    const segment = getEventSegmentState(event, cellDateKey, currentYear);
                    const isSingleDay = segment.startsToday && segment.endsToday;
                    const labelStyle = getEventLabelStyle(event, cellDateKey, weekStartDate, currentYear);
                    const isDraggable =
                      !event.id.startsWith("holiday-") &&
                      !event.id.startsWith("kakao_") &&
                      event.kind !== "certificate";

                    return (
                      <div
                        key={`${day.key}-${event.id}`}
                        draggable={isDraggable}
                        onDragStart={(e) => onEventDragStart(e, event.id)}
                        className={`relative flex h-5 items-center text-[10px] font-semibold text-white ${getDisplayEventColor(event)} ${day.currentMonth ? "" : "opacity-45"} ${
                          isSingleDay
                            ? "overflow-hidden rounded-md"
                            : segment.startsToday
                              ? "z-10 -mr-[7px] overflow-visible rounded-l-md rounded-r-none"
                              : segment.endsToday
                                ? "overflow-hidden -ml-[6px] rounded-l-none rounded-r-md"
                                : "overflow-hidden -ml-[6px] -mr-[7px] rounded-none"
                        } ${isDraggable ? "cursor-move" : ""}`}
                      >
                        {isSingleDay ? (
                          <span className="truncate px-1">{event.title}</span>
                        ) : segment.startsToday ? (
                          <span
                            className="pointer-events-none absolute z-20 truncate px-1 leading-5"
                            style={labelStyle}
                          >
                            {event.title}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex min-h-4 items-start">
                  {overflowCount > 0 && (
                    <p className={`text-[10px] font-medium leading-none ${day.currentMonth ? "text-slate-400" : "text-slate-300"}`}>
                      + {overflowCount}개
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
