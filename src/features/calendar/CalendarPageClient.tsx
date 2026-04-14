"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Calendar as CalendarIcon, CheckCircle2, Circle, Clock, GripVertical, Pencil, Plus, Trash2, X, Zap,} from "lucide-react";
import { EventType, TodoItem, useApp } from "@/lib/AppContext";
import {
  createCalendarEvent,
  listCalendarEvents,
  removeCalendarEvent,
  updateCalendarEvent,
} from "@/lib/calendar";
import {
  createTodo,
  deleteTodo as deleteTodoApi,
  listTodos,
  toggleTodoStatus,
  updateTodoContent,
} from "@/lib/todos";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_VISIBLE_EVENT_ROWS = 2;
const TODO_ORDER_STORAGE_PREFIX = "hp_todo_order_";
type TodayInfo = {
  year: number;
  month: number;
  date: number;
};

type EventFormState = {
  id: string | null;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  color: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  kind: "general" | "certificate";
};

const DEFAULT_EVENT_FORM: EventFormState = {
  id: null,
  title: "",
  content: "",
  startDate: "",
  endDate: "",
  color: "bg-hp-500",
  isAllDay: true,
  startTime: "09:00",
  endTime: "10:00",
  kind: "general",
};

const formatDateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function getTodoOrderStorageKey(userId: string) {
  return `${TODO_ORDER_STORAGE_PREFIX}${userId}`;
}

function readTodoOrder(userId: string): Record<string, number[]> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(getTodoOrderStorageKey(userId));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([dateKey, ids]) => [
        dateKey,
        Array.isArray(ids) ? ids.map((id) => Number(id)).filter(Number.isFinite) : [],
      ]),
    );
  } catch {
    return {};
  }
}

function writeTodoOrder(userId: string, orderMap: Record<string, number[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getTodoOrderStorageKey(userId), JSON.stringify(orderMap));
}

function sortTodosByStoredOrder(items: TodoItem[], orderedIds: number[]) {
  if (orderedIds.length === 0) return items;

  const orderedIndex = new Map(orderedIds.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const left = orderedIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const right = orderedIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

function reorderTodos(items: TodoItem[], sourceId: number, targetId: number) {
  const sourceIndex = items.findIndex((todo) => todo.id === sourceId);
  const targetIndex = items.findIndex((todo) => todo.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function parseDate(dateText?: string, fallbackYear?: number) {
  if (!dateText) return null;

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;

  if (typeof fallbackYear === "number" && date.getFullYear() === 1970) {
    date.setFullYear(fallbackYear);
  }

  return date;
}

function formatEventRange(event: EventType, fallbackYear: number) {
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear);

  if (!start) return `${fallbackYear}.${event.month + 1}.${event.startDay}`;

  const startLabel = `${start.getFullYear()}.${start.getMonth() + 1}.${start.getDate()}`;
  if (!end) return startLabel;

  return start.toDateString() === end.toDateString()
    ? startLabel
    : `${startLabel} - ${end.getFullYear()}.${end.getMonth() + 1}.${end.getDate()}`;
}

function eventOverlapsDate(event: EventType, dateKey: string, fallbackYear: number) {
  const target = parseDate(dateKey);
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear);

  if (!target || !start) {
    const date = new Date(dateKey);
    return event.month === date.getMonth() && date.getDate() >= event.startDay && date.getDate() <= event.endDay;
  }

  return start <= target && target <= (end ?? start);
}

function getEventSegmentState(event: EventType, dateKey: string, fallbackYear: number) {
  const target = parseDate(dateKey);
  const start = parseDate(event.startDate, fallbackYear);
  const end = parseDate(event.endDate || event.startDate, fallbackYear) ?? start;

  if (!target || !start || !end) {
    return {
      startsToday: event.startDate === dateKey,
      endsToday: (event.endDate ?? event.startDate) === dateKey,
      showLabel: event.startDate === dateKey,
    };
  }

  const startsToday = start.toDateString() === target.toDateString();
  const endsToday = end.toDateString() === target.toDateString();

  return {
    startsToday,
    endsToday,
    showLabel: startsToday || target.getDate() === 1,
  };
}

function sortEventsForCalendar(events: EventType[], fallbackYear: number) {
  return [...events].sort((a, b) => {
    const aStart = parseDate(a.startDate, fallbackYear)?.getTime() ?? 0;
    const bStart = parseDate(b.startDate, fallbackYear)?.getTime() ?? 0;
    if (aStart !== bStart) return aStart - bStart;

    const aEnd = parseDate(a.endDate || a.startDate, fallbackYear)?.getTime() ?? aStart;
    const bEnd = parseDate(b.endDate || b.startDate, fallbackYear)?.getTime() ?? bStart;

    return bEnd - aEnd;
  });
}

type CalendarDayCell = {
  key: string;
  date: number;
  currentMonth: boolean;
};

function getCellDate(cell: CalendarDayCell, year: number, month: number) {
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

function buildWeekEventRows(
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

function buildEventForm(dateText: string, event?: EventType): EventFormState {
  if (!event) {
    return {
      ...DEFAULT_EVENT_FORM,
      startDate: dateText,
      endDate: dateText,
    };
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

function getDisplayEventColor(event: EventType) {
  return event.kind === "certificate" ? "bg-amber-500" : event.color;
}

function parseCalendarMonthParams(yearValue: string | null, monthValue: string | null) {
  if (!yearValue || !monthValue) return null;

  const year = Number(yearValue);
  const month = Number(monthValue);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;

  return new Date(year, month - 1, 1);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function CalendarPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, events, setEvents, todos, setTodos } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const requestedYear = searchParams.get("year");
  const requestedMonth = searchParams.get("month");
  const searchParamsString = searchParams.toString();
  const initialCalendarDate = parseCalendarMonthParams(requestedYear, requestedMonth);

  const [mounted, setMounted] = useState(false);
  const [todayInfo, setTodayInfo] = useState<TodayInfo | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return initialCalendarDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const date = initialCalendarDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? now.getDate() : 1;
  });
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [draggedTodoId, setDraggedTodoId] = useState<number | null>(null);
  const [dropTargetTodoId, setDropTargetTodoId] = useState<number | null>(null);
  const [calendarError, setCalendarError] = useState("");
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>(DEFAULT_EVENT_FORM);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthInputValue = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const selectedDateKey = formatDateKey(currentYear, currentMonth, selectedDate);

  useEffect(() => {
    const now = new Date();
    setTodayInfo({
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.getDate(),
    });
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const now = new Date();
    const parsed = parseCalendarMonthParams(requestedYear, requestedMonth);
    const nextDate = parsed ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthKey = getMonthKey(nextDate);
    let monthChanged = false;

    setCurrentDate((prev) => {
      if (getMonthKey(prev) === nextMonthKey) {
        return prev;
      }

      monthChanged = true;
      return nextDate;
    });

    if (monthChanged) {
      setSelectedDate(
        nextDate.getFullYear() === now.getFullYear() && nextDate.getMonth() === now.getMonth()
          ? now.getDate()
          : 1,
      );
    }
  }, [mounted, requestedMonth, requestedYear]);

  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(searchParamsString);
    params.set("year", String(currentYear));
    params.set("month", String(currentMonth + 1).padStart(2, "0"));

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [currentMonth, currentYear, mounted, pathname, router, searchParamsString]);

  const moveToMonth = (date: Date, nextSelectedDate?: number) => {
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    if (typeof nextSelectedDate === "number") {
      setSelectedDate(nextSelectedDate);
      return;
    }

    const now = new Date();
    setSelectedDate(
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? now.getDate() : 1,
    );
  };

  const openMonthPicker = () => {
    const picker = monthInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!picker) return;

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }

    picker.focus();
    picker.click();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") inputRef.current?.focus();
      if (e.key === "Escape") inputRef.current?.blur();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    void (async () => {
      try {
        setCalendarLoading(true);
        setCalendarError("");
        const loaded = await listCalendarEvents(currentUser.id);
        if (!cancelled) setEvents(loaded);
      } catch (error) {
        if (!cancelled) {
          setCalendarError(error instanceof Error ? error.message : "Failed to load calendar events.");
        }
      } finally {
        if (!cancelled) setCalendarLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser, setEvents]);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    void (async () => {
      try {
        const todoItems = await listTodos(currentUser.id);
        if (cancelled) return;

        setTodos((prev) => {
          const next = { ...prev };
          const storedOrder = readTodoOrder(currentUser.id);

          for (let d = 1; d <= daysInMonth; d += 1) {
            next[formatDateKey(currentYear, currentMonth, d)] = [];
          }

          todoItems.forEach((item) => {
            if (!item.createdAt) return;

            const itemDate = new Date(item.createdAt);
            if (Number.isNaN(itemDate.getTime())) return;
            if (itemDate.getFullYear() !== currentYear || itemDate.getMonth() !== currentMonth) return;

            const key = formatDateKey(currentYear, currentMonth, itemDate.getDate());
            next[key] = [...(next[key] ?? []), item];
          });

          for (let d = 1; d <= daysInMonth; d += 1) {
            const key = formatDateKey(currentYear, currentMonth, d);
            next[key] = sortTodosByStoredOrder(next[key] ?? [], storedOrder[key] ?? []);
          }

          return next;
        });
      } catch (error) {
        if (!cancelled) {
          setCalendarError(error instanceof Error ? error.message : "Failed to load todo items.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentMonth, currentUser, currentYear, daysInMonth, setTodos]);

  const syncTodoList = (
    dateKey: string,
    updater: (items: typeof todos[string]) => typeof todos[string],
  ) =>
    setTodos((prev) => {
      const nextItems = updater(prev[dateKey] ?? []);

      if (currentUser) {
        const nextOrder = readTodoOrder(currentUser.id);
        nextOrder[dateKey] = nextItems.map((todo) => todo.id);
        writeTodoOrder(currentUser.id, nextOrder);
      }

      return { ...prev, [dateKey]: nextItems };
    });

  const resetTodoDragState = () => {
    setDraggedTodoId(null);
    setDropTargetTodoId(null);
  };

  const handleTodoDragStart = (event: React.DragEvent<HTMLDivElement>, todoId: number) => {
    if (editingTodoId === todoId) {
      event.preventDefault();
      return;
    }

    setDraggedTodoId(todoId);
    setDropTargetTodoId(todoId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(todoId));
  };

  const handleTodoDragOver = (event: React.DragEvent<HTMLDivElement>, todoId: number) => {
    if (draggedTodoId === null || draggedTodoId === todoId) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTargetTodoId !== todoId) {
      setDropTargetTodoId(todoId);
    }
  };

  const handleTodoDrop = (event: React.DragEvent<HTMLDivElement>, todoId: number) => {
    event.preventDefault();

    const sourceId = draggedTodoId ?? Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isFinite(sourceId) || sourceId === todoId) {
      resetTodoDragState();
      return;
    }

    syncTodoList(selectedDateKey, (items: TodoItem[]) => reorderTodos(items, sourceId, todoId));
    resetTodoDragState();
  };

  const openCreateModal = () => {
    setCalendarError("");
    setEventForm(buildEventForm(selectedDateKey));
    setEventModalOpen(true);
  };

  const openEditModal = (event: EventType) => {
    setCalendarError("");
    setSelectedEvent(event);
    setEventForm(buildEventForm(selectedDateKey, event));
    setEventModalOpen(true);
  };

  const closeEventModal = () => {
    setEventModalOpen(false);
    setEventForm(DEFAULT_EVENT_FORM);
  };

  const handleAddTodo = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !newTodoText.trim() || !currentUser) return;

    try {
      const created = await createTodo(currentUser.id, newTodoText.trim(), selectedDateKey);
      syncTodoList(selectedDateKey, (items) => [...items, created]);
      setNewTodoText("");
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Failed to add the todo item.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setCalendarError("");
      await removeCalendarEvent(eventId);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      setSelectedEvent((prev) => (prev?.id === eventId ? null : prev));
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Failed to delete the event.");
    }
  };

  const handleToggleTodo = async (todoId: number) => {
    try {
      const updated = await toggleTodoStatus(todoId);
      syncTodoList(selectedDateKey, (items: TodoItem[]) =>
        items.map((todo) => (todo.id === todoId ? updated : todo)),
      );
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Failed to update the todo status.");
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await deleteTodoApi(todoId);
      syncTodoList(selectedDateKey, (items: TodoItem[]) => items.filter((todo) => todo.id !== todoId));
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Failed to delete the todo item.");
    }
  };

  const startTodoEdit = (todo: TodoItem) => {
    setCalendarError("");
    setEditingTodoId(todo.id);
    setEditingTodoText(todo.text);
  };

  const cancelTodoEdit = () => {
    setEditingTodoId(null);
    setEditingTodoText("");
  };

  const handleSubmitTodoEdit = async () => {
    if (editingTodoId === null || !editingTodoText.trim()) return;

    try {
      const updated = await updateTodoContent(editingTodoId, editingTodoText.trim());
      syncTodoList(selectedDateKey, (items: TodoItem[]) =>
        items.map((todo) => (todo.id === editingTodoId ? updated : todo)),
      );
      cancelTodoEdit();
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Failed to update the todo item.");
    }
  };

  const handleSubmitEvent = async () => {
    if (!currentUser || !eventForm.title.trim() || !eventForm.startDate || !eventForm.endDate || savingEvent) {
      return;
    }

    try {
      setSavingEvent(true);
      setCalendarError("");

      const payload = {
        title: eventForm.title.trim(),
        content: eventForm.content.trim() || eventForm.title.trim(),
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        color: eventForm.color,
        isAllDay: eventForm.isAllDay,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        kind: eventForm.kind,
      } as const;

      const savedEvent = eventForm.id
        ? await updateCalendarEvent({ calendarId: eventForm.id, ...payload })
        : await createCalendarEvent({ userId: currentUser.id, ...payload });

      setEvents((prev) =>
        eventForm.id ? prev.map((event) => (event.id === eventForm.id ? savedEvent : event)) : [...prev, savedEvent],
      );
      setSelectedEvent((prev) => (prev?.id === savedEvent.id ? savedEvent : prev));

      const nextDate = parseDate(savedEvent.startDate, currentYear) ?? new Date(savedEvent.startDate || selectedDateKey);
      setCurrentDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      setSelectedDate(nextDate.getDate());
      closeEventModal();
    } catch (error) {
      setCalendarError(error instanceof Error ? error.message : "Failed to save the event.");
    } finally {
      setSavingEvent(false);
    }
  };

  const calendarDays: CalendarDayCell[] = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayOfWeek + 1;

    if (dayNumber < 1) {
      return {
        key: `prev-${index}`,
        date: prevMonthDays + dayNumber,
        currentMonth: false,
      };
    }

    if (dayNumber > daysInMonth) {
      return {
        key: `next-${index}`,
        date: dayNumber - daysInMonth,
        currentMonth: false,
      };
    }

    return {
      key: `current-${dayNumber}`,
      date: dayNumber,
      currentMonth: true,
    };
  });

  const weekLayoutByCellKey = new Map(
    Array.from({ length: 6 }, (_, weekIndex) =>
      buildWeekEventRows(
        calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7),
        events,
        currentYear,
        currentMonth,
      ),
    )
      .flat()
      .map((item) => [item.cellKey, item] as const),
  );

  const selectedEvents = sortEventsForCalendar(
    events.filter((event) => eventOverlapsDate(event, selectedDateKey, currentYear)),
    currentYear,
  );
  const getTodosForDate = (date: number) => todos[formatDateKey(currentYear, currentMonth, date)] ?? [];
  const selectedTodos = getTodosForDate(selectedDate);
  const updateEventFormField =
    (field: keyof EventFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEventForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const toggleEventAllDay = () => {
    setEventForm((prev) => ({ ...prev, isAllDay: !prev.isAllDay }));
  };

  const handleCloseSelectedEvent = () => setSelectedEvent(null);

  const handleEditSelectedEvent = () => {
    if (!selectedEvent) return;

    setSelectedEvent(null);
    openEditModal(selectedEvent);
  };

  const handleDeleteSelectedEvent = () => {
    if (!selectedEvent) return;

    const eventId = selectedEvent.id;
    setSelectedEvent(null);
    void handleDeleteEvent(eventId);
  };

  const renderEventModal = () => {
    if (!eventModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

          <div className="space-y-4 p-5">
            <input
              type="text"
              value={eventForm.title}
              onChange={updateEventFormField("title")}
              placeholder="일정 제목"
              className="w-full border-b-2 border-hp-200 p-2 text-lg font-bold outline-none focus:border-hp-600"
            />
            <textarea
              value={eventForm.content}
              onChange={updateEventFormField("content")}
              placeholder="일정 설명"
              rows={3}
              className="w-full rounded-xl border border-hp-100 p-3 outline-none focus:border-hp-300"
            />
            <div className="flex gap-3">
              <input
                type="date"
                value={eventForm.startDate}
                onChange={updateEventFormField("startDate")}
                className="w-full rounded-xl border border-hp-100 p-2.5"
              />
              <input
                type="date"
                value={eventForm.endDate}
                onChange={updateEventFormField("endDate")}
                className="w-full rounded-xl border border-hp-100 p-2.5"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleEventAllDay}
                className="rounded-lg border border-hp-200 px-3 py-2 text-sm"
              >
                {eventForm.isAllDay ? "종일" : "시간 설정"}
              </button>
              {!eventForm.isAllDay && (
                <>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={updateEventFormField("startTime")}
                    className="rounded-xl border border-hp-100 p-2.5"
                  />
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={updateEventFormField("endTime")}
                    className="rounded-xl border border-hp-100 p-2.5"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 border-t border-hp-50 p-4">
            <button
              onClick={closeEventModal}
              className="flex-1 rounded-xl border border-hp-200 bg-hp-50 px-4 py-2.5 font-bold text-hp-700 hover:bg-hp-100"
            >
              취소
            </button>
            <button
              disabled={savingEvent}
              onClick={() => void handleSubmitEvent()}
              className="flex-1 rounded-xl bg-hp-600 px-4 py-2.5 font-bold text-white hover:bg-hp-700 disabled:opacity-60"
            >
              {savingEvent ? "저장 중..." : eventForm.id ? "수정" : "저장"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSelectedEventModal = () => {
    if (!selectedEvent) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={handleCloseSelectedEvent}
      >
        <div
          className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`${getDisplayEventColor(selectedEvent)} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-xs font-bold text-white/70">
                  {selectedEvent.isAllDay
                    ? "종일"
                    : `${selectedEvent.startTime} ~ ${selectedEvent.endTime}`}
                </p>
                <h3 className="text-xl font-bold leading-tight text-white">{selectedEvent.title}</h3>
              </div>
              <button onClick={handleCloseSelectedEvent} className="rounded-full bg-white/20 p-1.5">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <CalendarIcon size={16} className="text-hp-500" />
              <span className="font-medium">{formatEventRange(selectedEvent, currentYear)}</span>
            </div>
            {!selectedEvent.isAllDay && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Clock size={16} className="text-hp-500" />
                <span className="font-medium">
                  {selectedEvent.startTime} ~ {selectedEvent.endTime}
                </span>
              </div>
            )}
            {selectedEvent.content && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                {selectedEvent.content}
              </p>
            )}
          </div>

          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={handleEditSelectedEvent}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-hp-200 py-2.5 text-sm font-bold text-hp-700 transition-colors hover:bg-hp-50"
            >
              <Pencil size={15} />
              수정
            </button>
            <button
              onClick={handleDeleteSelectedEvent}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 size={15} />
              삭제
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in flex h-full flex-col gap-4 duration-500 lg:flex-row">
      <div className="flex flex-1 flex-col rounded-2xl border border-hp-100 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-[210px] shrink-0">
              <button
                type="button"
                onClick={openMonthPicker}
                className="flex w-full items-center rounded-lg px-2 py-1 text-left text-2xl font-bold tabular-nums text-slate-800 transition-colors hover:bg-hp-50"
              >
                {currentYear}년 {currentMonth + 1}월 {selectedDate}일
              </button>
              <input
                ref={monthInputRef}
                type="month"
                value={currentMonthInputValue}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (!nextValue) return;

                  const [yearText, monthText] = nextValue.split("-");
                  const nextYear = Number(yearText);
                  const nextMonth = Number(monthText);

                  if (!Number.isFinite(nextYear) || !Number.isFinite(nextMonth)) return;
                  moveToMonth(new Date(nextYear, nextMonth - 1, 1));
                }}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => moveToMonth(new Date(currentYear, currentMonth - 1, 1))}
                className="rounded-lg p-1.5 transition-colors hover:bg-hp-50"
              >
                <ArrowRight size={20} className="rotate-180 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  moveToMonth(now, now.getDate());
                }}
                className="rounded-lg px-2 text-xs font-bold text-hp-600 hover:bg-hp-50"
              >
                오늘
              </button>
              <button
                onClick={() => moveToMonth(new Date(currentYear, currentMonth + 1, 1))}
                className="rounded-lg p-1.5 transition-colors hover:bg-hp-50"
              >
                <ArrowRight size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-hp-200 text-xs font-bold">
              <button
                onClick={() => setCalendarView("month")}
                className={`px-3 py-1.5 transition-colors ${
                  calendarView === "month" ? "bg-hp-600 text-white" : "text-hp-600 hover:bg-hp-50"
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setCalendarView("week")}
                className={`border-l border-hp-200 px-3 py-1.5 transition-colors ${
                  calendarView === "week" ? "bg-hp-600 text-white" : "text-hp-600 hover:bg-hp-50"
                }`}
              >
                주간
              </button>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-hp-600 px-4 py-2 text-sm font-bold text-white hover:bg-hp-700"
          >
            <Plus size={16} />
            일정 추가
          </button>
        </div>
        {calendarError && <p className="mb-4 text-sm text-red-500">{calendarError}</p>}
        {calendarView === "week" ? (
          <div className="rounded-2xl border border-dashed border-hp-200 bg-hp-50/50 p-8 text-sm text-slate-500">
            주간 보기는 아직 지원되지 않습니다. 월간 보기에서 일정을 확인하고 할 일을 관리해 주세요.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 overflow-hidden rounded-t-2xl border border-b-0 border-hp-100 bg-slate-50 text-xs font-bold text-slate-400">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="border-r border-hp-100 py-3 text-center last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid min-h-[32rem] flex-1 auto-rows-fr grid-cols-7 overflow-hidden rounded-b-2xl border border-hp-100">
              {calendarDays.map((day, index) => {
                const cellDate = getCellDate(day, currentYear, currentMonth);
                const cellDateKey = formatDateKey(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
                const weekLayout = weekLayoutByCellKey.get(day.key);
                const dayEventRows = weekLayout?.rowEvents ?? [];
                const overflowCount = weekLayout?.overflowCount ?? 0;
                const dayTodos = day.currentMonth ? getTodosForDate(day.date) : [];
                const dayCompletedTodos = dayTodos.filter((todo) => todo.done).length;
                const dayPendingTodos = dayTodos.length - dayCompletedTodos;
                const isSelected = day.currentMonth && day.date === selectedDate;
                const isToday =
                  day.currentMonth &&
                  todayInfo?.year === currentYear &&
                  todayInfo?.month === currentMonth &&
                  todayInfo?.date === day.date;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => {
                      setCurrentDate(new Date(cellDate.getFullYear(), cellDate.getMonth(), 1));
                      setSelectedDate(cellDate.getDate());
                    }}
                    className={`relative min-h-28 border-r border-b border-hp-100 p-2 text-left transition-colors ${
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
                            : day.currentMonth
                              ? "text-slate-700"
                              : "text-slate-300"
                      }`}
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
                            할 일 {dayPendingTodos}
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
                          return <div key={`${day.key}-${event.id}`} className={`flex h-5 items-center overflow-hidden text-[10px] font-semibold text-white ${getDisplayEventColor(event)} ${day.currentMonth ? "" : "opacity-45"} ${isSingleDay ? "rounded-md" : segment.startsToday ? "-mr-3 rounded-l-md rounded-r-none pr-3" : segment.endsToday ? "-ml-3 rounded-l-none rounded-r-md pl-3" : "-mx-3 rounded-none px-3"}`}><span className={`truncate px-1 ${segment.showLabel ? "opacity-100" : "opacity-0"}`}>{event.title}</span></div>;
                        })}
                      </div>
                      <div className="mt-auto flex min-h-4 items-end">{overflowCount > 0 && <p className={`text-[10px] font-medium leading-none ${day.currentMonth ? "text-slate-400" : "text-slate-300"}`}>+ {overflowCount}개</p>}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <aside className="relative z-20 flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden rounded-2xl border border-hp-100 bg-white p-5 shadow-2xl lg:w-80">
          <div className="-m-5 mb-3 border-b border-hp-100 bg-gradient-to-r from-hp-50 via-white to-white px-5 py-4">
            <h3 className="mt-1 text-lg font-black text-slate-900">일정 및 할 일</h3>
          </div>
          <div className="mt-2 flex flex-1 flex-col overflow-hidden">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Events</p>
              <span className="rounded-full bg-hp-100 px-2.5 py-1 text-[11px] font-bold text-hp-700">{selectedEvents.length}</span>
            </div>
            <div className="max-h-[38%] overflow-y-auto rounded-2xl bg-slate-50/80 p-2 pr-1">
            {calendarLoading ? <div className="mb-4 rounded-xl border border-dashed border-hp-200 p-4 text-sm text-slate-500">
              일정을 불러오는 중입니다...
              </div> : selectedEvents.length === 0 ? 
                <div className="mb-4 rounded-xl border border-dashed border-hp-200 p-4 text-sm text-slate-500">
                  선택한 날짜에 등록된 일정이 없습니다.
                  </div> : selectedEvents.map((event) => (
                    <div key={event.id} onClick={() => setSelectedEvent(event)} className="group relative mb-3 flex cursor-pointer gap-3 overflow-hidden rounded-xl border border-hp-100 bg-white p-3.5 shadow-sm transition-colors hover:border-hp-300">
                      <div className={`w-1.5 rounded-full ${getDisplayEventColor(event)}`}></div>
                      <div className="flex-1">
                        <p className="mb-1 text-[10px] font-bold text-slate-400">
                          {event.isAllDay ? "종일" : `${event.startTime} ~ ${event.endTime}`}
                        </p>
                        <p className="text-sm font-bold">{event.title}</p>
                      </div>
                      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(event); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-hp-600"><Pencil size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); void handleDeleteEvent(event.id); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
            ))}
            </div>
            <div className="mt-3 flex flex-1 flex-col overflow-hidden">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Todos</p>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">{selectedTodos.length}</span>
              </div>
              <div className="mb-4 flex-1 overflow-y-auto rounded-2xl bg-slate-50/80 p-2 pr-1">
                <div className="space-y-2">
                {selectedTodos.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-slate-400 opacity-60"><Zap size={32} className="mb-3" /><p className="text-sm font-medium">이 날짜에 등록된 할 일이 없습니다.</p></div> : selectedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    draggable={editingTodoId !== todo.id}
                    onDragStart={(event) => handleTodoDragStart(event, todo.id)}
                    onDragOver={(event) => handleTodoDragOver(event, todo.id)}
                    onDrop={(event) => handleTodoDrop(event, todo.id)}
                    onDragEnd={resetTodoDragState}
                    className={`group flex items-start gap-3 rounded-xl border border-hp-100 bg-white p-3.5 shadow-sm transition ${todo.done ? "opacity-50" : ""} ${draggedTodoId === todo.id ? "scale-[0.98] border-hp-300 opacity-70" : ""} ${dropTargetTodoId === todo.id && draggedTodoId !== todo.id ? "border-hp-500 ring-2 ring-hp-100" : ""}`}
                  >
                    <div className={`mt-0.5 cursor-grab text-slate-300 active:cursor-grabbing ${editingTodoId === todo.id ? "pointer-events-none opacity-30" : "hover:text-hp-500"}`} aria-hidden="true">
                      <GripVertical size={18} />
                    </div>
                    <button onClick={() => handleToggleTodo(todo.id)} className="mt-0.5">
                      {todo.done ? <CheckCircle2 size={20} className="text-slate-500" /> : <Circle size={20} className="text-slate-300" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      {editingTodoId === todo.id ? <input type="text" value={editingTodoText} onChange={(e) => setEditingTodoText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleSubmitTodoEdit(); } if (e.key === "Escape") cancelTodoEdit(); }} className="w-full rounded-lg border border-hp-200 px-2.5 py-1.5 text-sm font-medium outline-none focus:border-hp-500" autoFocus /> : <p className={`text-sm ${todo.done ? "line-through text-slate-500" : "font-bold"}`}>{todo.text}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingTodoId === todo.id ? 
                      <>
                        <button onClick={() => void handleSubmitTodoEdit()} className="rounded-md px-2 py-1 text-[11px] font-bold text-hp-600 hover:bg-hp-50">
                          저장
                        </button>
                        <button onClick={cancelTodoEdit} className="rounded-md px-2 py-1 text-[11px] font-bold text-slate-400 hover:bg-slate-100">
                          취소
                        </button>
                      </> : 
                      <>
                        <button onClick={() => startTodoEdit(todo)} className="text-slate-300 opacity-0 hover:text-hp-600 group-hover:opacity-100">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteTodo(todo.id)} className="text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100">
                          <Trash2 size={16} /></button>
                      </>}
                    </div>
                  </div>
                ))}
                </div>
              </div>
              <div className="mt-auto flex items-center rounded-xl border-2 border-hp-200 bg-hp-50 px-3 shadow-sm focus-within:border-hp-600">
                <Plus size={20} className="text-slate-400" />
                <input ref={inputRef} type="text" value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} onKeyDown={handleAddTodo} placeholder="할 일을 입력하고 Enter를 누르세요" className="w-full bg-transparent px-2 py-4 text-sm font-bold outline-none placeholder:font-normal" />
              </div>
            </div>
          </div>
      </aside>

      {renderEventModal()}
      {renderSelectedEventModal()}
    </div>
  );
}
