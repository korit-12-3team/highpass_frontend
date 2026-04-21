"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Circle, GripVertical, Pencil, Plus, Trash2, Zap,} from "lucide-react";
import { EventType, TodoItem, useApp } from "@/shared/context/AppContext";
import {
  createCalendarEvent,
  listCalendarEvents,
  removeCalendarEvent,
  updateCalendarEvent,
} from "@/features/calendar/api/calendar";
import {
  createTodo,
  deleteTodo as deleteTodoApi,
  listTodos,
  toggleTodoStatus,
  updateTodoContent,
} from "@/features/calendar/api/todos";
import {
  CalendarDayCell,
  MAX_VISIBLE_EVENT_ROWS,
  buildWeekEventRows,
  eventOverlapsDate,
  formatDateKey,
  getCellDate,
  getEventLabelStyle,
  getEventSegmentState,
  getMonthKey,
  parseCalendarMonthParams,
  parseDate,
  shouldShowEventLabel,
  sortEventsForCalendar,
} from "@/features/calendar/utils/calendarLayout";
import {
  readTodoOrder,
  reorderTodos,
  sortTodosByStoredOrder,
  writeTodoOrder,
} from "@/features/calendar/utils/todoOrder";
import { CalendarConfirmDialog } from "@/features/calendar/components/CalendarConfirmDialog";
import { CalendarEventDetailModal } from "@/features/calendar/components/CalendarEventDetailModal";
import { CalendarEventModal } from "@/features/calendar/components/CalendarEventModal";
import { ConfirmDialogState, EventFormState } from "@/features/calendar/types";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
type TodayInfo = {
  year: number;
  month: number;
  date: number;
};

type EventKind = NonNullable<EventType["kind"]>;

const EVENT_KIND_FILTERS: { kind: EventKind; label: string; colorClass: string }[] = [
  { kind: "general", label: "일반 일정", colorClass: "bg-hp-500" },
  { kind: "certificate", label: "자격증 일정", colorClass: "bg-amber-500" },
];

const DEFAULT_EVENT_FORM: EventFormState = {
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

  return {
    startTime: formatTimeValue(start),
    endTime: formatTimeValue(end),
  };
}

function buildEventForm(dateText: string, event?: EventType): EventFormState {
  if (!event) {
    const defaultTimes = getDefaultEventTimes();

    return {
      ...DEFAULT_EVENT_FORM,
      startDate: dateText,
      endDate: dateText,
      startTime: defaultTimes.startTime,
      endTime: defaultTimes.endTime,
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

function getEventKind(event: EventType): EventKind {
  return event.kind === "certificate" ? "certificate" : "general";
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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [visibleEventKinds, setVisibleEventKinds] = useState<Record<EventKind, boolean>>({
    general: true,
    certificate: true,
  });

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
    setEventForm(buildEventForm(selectedDateKey, event));
    setEventModalOpen(true);
  };

  const closeEventModal = () => {
    setEventModalOpen(false);
    setEventForm(DEFAULT_EVENT_FORM);
  };

  const closeConfirmDialog = () => setConfirmDialog(null);

  const handleConfirmDialogConfirm = () => {
    const action = confirmDialog?.onConfirm;
    closeConfirmDialog();
    action?.();
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
    if (!currentUser || savingEvent) {
      return;
    }

    if (!eventForm.title.trim()) {
      toast.warning("일정 제목을 입력해 주세요.");
      return;
    }

    if (!eventForm.startDate || !eventForm.endDate) {
      toast.warning("일정 날짜를 선택해 주세요.");
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
      toast.success(eventForm.id ? "일정이 수정되었습니다." : "일정이 추가되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "일정을 저장하지 못했습니다.";
      setCalendarError(message);
      toast.error(message);
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

  const filteredEvents = events.filter((event) => visibleEventKinds[getEventKind(event)]);
  const eventKindCounts = EVENT_KIND_FILTERS.reduce(
    (counts, filter) => ({
      ...counts,
      [filter.kind]: events.filter((event) => getEventKind(event) === filter.kind).length,
    }),
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

  const selectedEvents = sortEventsForCalendar(
    filteredEvents.filter((event) => eventOverlapsDate(event, selectedDateKey, currentYear)),
    currentYear,
  );
  const getTodosForDate = (date: number) => todos[formatDateKey(currentYear, currentMonth, date)] ?? [];
  const selectedTodos = getTodosForDate(selectedDate);
  const updateEventFormField =
    (field: keyof EventFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEventForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const updateEventStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    setEventForm((prev) => ({
      ...prev,
      startDate,
      endDate: startDate,
    }));
  };

  const updateEventEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endDate = e.target.value;
    setEventForm((prev) => ({
      ...prev,
      endDate: prev.startDate && endDate < prev.startDate ? prev.startDate : endDate,
    }));
  };

  const toggleEventAllDay = () => {
    setEventForm((prev) => ({ ...prev, isAllDay: !prev.isAllDay }));
  };

  const handleCloseSelectedEvent = () => setSelectedEvent(null);

  const requestDeleteEvent = (event: EventType) => {
    setConfirmDialog({
      title: "일정 삭제",
      message: "삭제한 일정은 되돌릴 수 없습니다. 삭제하시겠습니까?",
      confirmLabel: "삭제하기",
      tone: "danger",
      onConfirm: () => {
        setSelectedEvent((prev) => (prev?.id === event.id ? null : prev));
        void handleDeleteEvent(event.id);
      },
    });
  };

  const requestDeleteTodo = (todo: TodoItem) => {
    setConfirmDialog({
      title: "할 일 삭제",
      message: `"${todo.text}" 할 일을 삭제하시겠습니까?`,
      confirmLabel: "삭제하기",
      tone: "danger",
      onConfirm: () => {
        void handleDeleteTodo(todo.id);
      },
    });
  };

  const handleEditSelectedEvent = () => {
    if (!selectedEvent) return;
    const eventToEdit = selectedEvent;
    setSelectedEvent(null);
    window.setTimeout(() => openEditModal(eventToEdit), 0);
  };

  const handleDeleteSelectedEvent = () => {
    if (!selectedEvent) return;
    requestDeleteEvent(selectedEvent);
  };

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in flex h-full flex-col gap-4 duration-500 lg:flex-row">
      <div className="flex flex-1 flex-col rounded-2xl border border-hp-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hp-100 bg-slate-50/70 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Calendars</span>
            {EVENT_KIND_FILTERS.map((filter) => (
              <label
                key={filter.kind}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-hp-50 hover:ring-hp-200"
              >
                <input
                  type="checkbox"
                  checked={visibleEventKinds[filter.kind]}
                  onChange={(event) =>
                    setVisibleEventKinds((prev) => ({
                      ...prev,
                      [filter.kind]: event.target.checked,
                    }))
                  }
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-hp-600"
                />
                <span className={`h-2.5 w-2.5 rounded-full ${filter.colorClass}`} />
                <span>{filter.label}</span>
                <span className="text-slate-400">{eventKindCounts[filter.kind] ?? 0}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVisibleEventKinds({ general: true, certificate: true })}
            className="text-xs font-bold text-hp-600 transition hover:text-hp-700"
          >
            전체 보기
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
                const weekStartDate = getCellDate(calendarDays[index - (index % 7)], currentYear, currentMonth);
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
                          const showMultiDayLabel = shouldShowEventLabel(event, cellDateKey, weekStartDate, currentYear);
                          return (
                            <div
                              key={`${day.key}-${event.id}`}
                              className={`relative flex h-5 items-center text-[10px] font-semibold text-white ${getDisplayEventColor(event)} ${day.currentMonth ? "" : "opacity-45"} ${isSingleDay ? "overflow-hidden rounded-md" : segment.startsToday ? "z-10 -mr-3 overflow-visible rounded-l-md rounded-r-none pr-3" : segment.endsToday ? "-ml-3 overflow-hidden rounded-l-none rounded-r-md pl-3" : "-mx-3 overflow-hidden rounded-none px-3"}`}
                            >
                              {isSingleDay ? (
                                <span className="truncate px-1">{event.title}</span>
                              ) : showMultiDayLabel ? (
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
                      <div className="mt-auto flex min-h-4 items-end">
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
                        <button onClick={(e) => { e.stopPropagation(); requestDeleteEvent(event); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"><Trash2 size={16} /></button>
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
                        <button onClick={() => requestDeleteTodo(todo)} className="text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100">
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

      <CalendarEventModal
        open={eventModalOpen}
        form={eventForm}
        saving={savingEvent}
        onChangeField={updateEventFormField}
        onChangeStartDate={updateEventStartDate}
        onChangeEndDate={updateEventEndDate}
        onToggleAllDay={toggleEventAllDay}
        onClose={closeEventModal}
        onSubmit={() => void handleSubmitEvent()}
      />
      <CalendarEventDetailModal
        event={selectedEvent}
        currentYear={currentYear}
        getDisplayEventColor={getDisplayEventColor}
        onClose={handleCloseSelectedEvent}
        onEdit={handleEditSelectedEvent}
        onDelete={handleDeleteSelectedEvent}
      />
      <CalendarConfirmDialog
        dialog={confirmDialog}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
      />
    </div>
  );
}

