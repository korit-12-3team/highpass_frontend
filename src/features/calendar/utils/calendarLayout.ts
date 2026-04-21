import { EventType } from "@/shared/context/AppContext";

export const MAX_VISIBLE_EVENT_ROWS = 2;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type CalendarDayCell = {
  key: string;
  date: number;
  currentMonth: boolean;
};

export const formatDateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function parseDate(dateText?: string, fallbackYear?: number) {
  if (!dateText) return null;

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;

  if (typeof fallbackYear === "number" && date.getFullYear() === 1970) {
    date.setFullYear(fallbackYear);
  }

  return date;
}

export function formatEventRange(event: EventType, fallbackYear: number) {
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear);

  if (!start) return `${fallbackYear}.${event.month + 1}.${event.startDay}`;

  const startLabel = `${start.getFullYear()}.${start.getMonth() + 1}.${start.getDate()}`;
  if (!end) return startLabel;

  return start.toDateString() === end.toDateString()
    ? startLabel
    : `${startLabel} - ${end.getFullYear()}.${end.getMonth() + 1}.${end.getDate()}`;
}

export function eventOverlapsDate(event: EventType, dateKey: string, fallbackYear: number) {
  const target = parseDate(dateKey);
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear);

  if (!target || !start) {
    const date = new Date(dateKey);
    return event.month === date.getMonth() && date.getDate() >= event.startDay && date.getDate() <= event.endDay;
  }

  return start <= target && target <= (end ?? start);
}

export function getEventSegmentState(event: EventType, dateKey: string, fallbackYear: number) {
  const target = parseDate(dateKey);
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear) ?? start;

  if (!target || !start || !end) {
    return {
      startsToday: event.startDate === dateKey,
      endsToday: (event.endDate ?? event.startDate) === dateKey,
    };
  }

  return {
    startsToday: start.toDateString() === target.toDateString(),
    endsToday: end.toDateString() === target.toDateString(),
  };
}

export function shouldShowEventLabel(event: EventType, dateKey: string, weekStartDate: Date, fallbackYear: number) {
  const target = parseDate(dateKey);
  const start = parseDate(event.startDate, fallbackYear);

  if (!target || !start) {
    return event.startDate === dateKey;
  }

  return startOfDay(start).getTime() === startOfDay(target).getTime() || startOfDay(target).getTime() === startOfDay(weekStartDate).getTime();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayDiff(start: Date, end: Date) {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_IN_MS);
}

export function getEventLabelStyle(event: EventType, dateKey: string, weekStartDate: Date, fallbackYear: number) {
  const target = parseDate(dateKey);
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear) ?? start;

  if (!target || !start || !end) {
    return { left: 0, width: "100%" };
  }

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const visibleStart = startOfDay(start) < startOfDay(weekStartDate) ? startOfDay(weekStartDate) : startOfDay(start);
  const visibleEnd = startOfDay(end) > startOfDay(weekEndDate) ? startOfDay(weekEndDate) : startOfDay(end);
  const daysBefore = Math.max(0, getDayDiff(visibleStart, target));
  const spanDays = Math.max(1, getDayDiff(visibleStart, visibleEnd) + 1);

  return {
    left: `${-daysBefore * 100}%`,
    width: `${spanDays * 100}%`,
  };
}

export function sortEventsForCalendar(events: EventType[], fallbackYear: number) {
  return [...events].sort((a, b) => {
    const aStart = parseDate(a.startDate, fallbackYear)?.getTime() ?? 0;
    const bStart = parseDate(b.startDate, fallbackYear)?.getTime() ?? 0;
    if (aStart !== bStart) return aStart - bStart;

    const aEnd = parseDate(a.endDate || a.startDate, fallbackYear)?.getTime() ?? aStart;
    const bEnd = parseDate(b.endDate || b.startDate, fallbackYear)?.getTime() ?? bStart;

    return bEnd - aEnd;
  });
}

export function getCellDate(cell: CalendarDayCell, year: number, month: number) {
  if (cell.currentMonth) return new Date(year, month, cell.date);
  if (cell.key.startsWith("prev-")) return new Date(year, month - 1, cell.date);
  return new Date(year, month + 1, cell.date);
}

function getEventTimeRange(event: EventType, fallbackYear: number) {
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear) ?? start;

  if (!start || !end) return null;

  return { start, end };
}

export function buildWeekEventRows(
  weekCells: CalendarDayCell[],
  events: EventType[],
  year: number,
  month: number,
) {
  const visible = weekCells.map((cell) => {
    const date = getCellDate(cell, year, month);
    return {
      cell,
      dateKey: formatDateKey(date.getFullYear(), date.getMonth(), date.getDate()),
    };
  });

  const eventMap = new Map<string, EventType>();
  visible.forEach(({ dateKey }) => {
    events.forEach((event) => {
      if (eventOverlapsDate(event, dateKey, year)) {
        eventMap.set(event.id, event);
      }
    });
  });

  const weekEvents = sortEventsForCalendar(Array.from(eventMap.values()), year);
  const rows: EventType[][] = [];

  weekEvents.forEach((event) => {
    const range = getEventTimeRange(event, year);
    const startTime = range?.start.getTime() ?? 0;
    const endTime = range?.end.getTime() ?? startTime;

    let rowIndex = rows.findIndex((row) =>
      row.every((placed) => {
        const placedRange = getEventTimeRange(placed, year);
        const placedStart = placedRange?.start.getTime() ?? 0;
        const placedEnd = placedRange?.end.getTime() ?? placedStart;
        return endTime < placedStart || startTime > placedEnd;
      }),
    );

    if (rowIndex === -1) {
      rows.push([event]);
      rowIndex = rows.length - 1;
    } else {
      rows[rowIndex].push(event);
    }
  });

  return visible.map(({ cell, dateKey }) => {
    const rowEvents = rows.map((row) => row.find((event) => eventOverlapsDate(event, dateKey, year)) ?? null);

    return {
      cellKey: cell.key,
      rowEvents,
      overflowCount: rowEvents.slice(MAX_VISIBLE_EVENT_ROWS).filter(Boolean).length,
    };
  });
}

export function parseCalendarMonthParams(yearValue: string | null, monthValue: string | null) {
  if (!yearValue || !monthValue) return null;

  const year = Number(yearValue);
  const month = Number(monthValue);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;

  return new Date(year, month - 1, 1);
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}
