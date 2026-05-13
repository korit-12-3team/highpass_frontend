"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/shared/context/AppContext";
import { CalendarDaySidebar } from "@/features/calendar/components/CalendarDaySidebar";
import { CalendarEventDetailModal } from "@/features/calendar/components/CalendarEventDetailModal";
import { CalendarEventModal } from "@/features/calendar/components/CalendarEventModal";
import { CalendarMainView } from "@/features/calendar/components/CalendarMainView";
import { useCalendarEvents } from "@/features/calendar/hooks/useCalendarEvents";
import { useCalendarTodos } from "@/features/calendar/hooks/useCalendarTodos";
import { useKakaoCalendar } from "@/features/calendar/hooks/useKakaoCalendar";
import { EventKind, getEventKind } from "@/features/calendar/utils/eventForm";
import {
  eventOverlapsDate,
  formatDateKey,
  getMonthKey,
  parseCalendarMonthParams,
  sortEventsForCalendar,
} from "@/features/calendar/utils/calendarLayout";
import { ConfirmDialogState } from "@/features/calendar/types";
import ConfirmModal from "@/shared/components/common/ConfirmModal";

type TodayInfo = { year: number; month: number; date: number };

export default function CalendarPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, events, setEvents, todos, setTodos } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [visibleEventKinds, setVisibleEventKinds] = useState<Record<EventKind, boolean>>({
    general: true,
    certificate: true,
    holiday: true,
    kakao: true,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOverlay, setIsOverlay] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const selectedDateKey = formatDateKey(currentYear, currentMonth, selectedDate);

  const {
    calendarLoading,
    savingEvent,
    eventModalOpen,
    eventForm,
    selectedEvent,
    setSelectedEvent,
    openCreateModal,
    openEditModal,
    closeEventModal,
    handleSubmitEvent,
    handleEventDragStart,
    handleEventDragOver,
    handleEventDrop,
    requestDeleteEvent,
    handleEditSelectedEvent,
    handleDeleteSelectedEvent,
    handleCloseSelectedEvent,
    updateEventFormField,
    updateEventStartDate,
    updateEventEndDate,
    toggleEventAllDay,
  } = useCalendarEvents({
    currentUser,
    isKakaoUser: currentUser?.socialProvider === "KAKAO",
    events,
    setEvents,
    currentYear,
    selectedDateKey,
    setCurrentDate,
    setSelectedDate,
    setConfirmDialog,
  });

  const { kakaoLoading, loadKakaoEvents, forceReloadKakaoEvents } = useKakaoCalendar({
    currentYear,
    currentMonth,
    setEvents,
  });

  const {
    newTodoText,
    setNewTodoText,
    editingTodoId,
    editingTodoText,
    setEditingTodoText,
    draggedTodoId,
    dropTargetTodoId,
    handleAddTodo,
    handleToggleTodo,
    startTodoEdit,
    cancelTodoEdit,
    handleSubmitTodoEdit,
    requestDeleteTodo,
    handleTodoDragStart,
    handleTodoDragOver,
    handleTodoDrop,
    resetTodoDragState,
  } = useCalendarTodos({
    currentUser,
    todos,
    setTodos,
    currentYear,
    currentMonth,
    daysInMonth,
    selectedDateKey,
    setConfirmDialog,
  });

  useEffect(() => {
    const now = new Date();
    setTodayInfo({ year: now.getFullYear(), month: now.getMonth(), date: now.getDate() });
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsOverlay(width <= 1280);
      setIsSidebarOpen(width > 1280);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const now = new Date();
    const parsed = parseCalendarMonthParams(requestedYear, requestedMonth);
    const nextDate = parsed ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthKey = getMonthKey(nextDate);
    let monthChanged = false;
    setCurrentDate((prev) => {
      if (getMonthKey(prev) === nextMonthKey) return prev;
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
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [currentMonth, currentYear, mounted, pathname, router, searchParamsString]);

  useEffect(() => {
    if (!mounted || !currentUser) return;
    if (searchParams.get("kakao_login") !== "1") return;
    const params = new URLSearchParams(searchParamsString);
    params.delete("kakao_login");
    const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(nextUrl, { scroll: false });
    setEvents([]);
    void loadKakaoEvents();
  }, [mounted, currentUser, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // 새로고침/월 이동 시 카카오 일정 자동 재조회 (Kakao 사용자만)
  useEffect(() => {
    if (!mounted || !currentUser) return;
    if (currentUser.socialProvider !== "KAKAO") return;
    if (searchParams.get("kakao_login") === "1") return; // 위 effect가 처리
    void loadKakaoEvents();
  }, [mounted, currentUser, currentYear, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;
    const errorCode = searchParams.get("kakao_error");
    if (!errorCode) return;
    const description = searchParams.get("kakao_error_description") ?? "";
    toast.error(`카카오 캘린더 연동 실패: ${errorCode}${description ? ` — ${description}` : ""}`, {
      duration: 8000,
    });
    const params = new URLSearchParams(searchParamsString);
    params.delete("kakao_error");
    params.delete("kakao_error_description");
    const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [mounted, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") inputRef.current?.focus();
      if (e.key === "Escape") inputRef.current?.blur();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const moveToMonth = (date: Date, nextSelectedDate?: number) => {
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    if (typeof nextSelectedDate === "number") { setSelectedDate(nextSelectedDate); return; }
    const now = new Date();
    setSelectedDate(
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? now.getDate() : 1,
    );
  };

  const selectedEvents = sortEventsForCalendar(
    events
      .filter((event) => visibleEventKinds[getEventKind(event)])
      .filter((event) => eventOverlapsDate(event, selectedDateKey, currentYear)),
    currentYear,
  );
  const selectedTodos = todos[selectedDateKey] ?? [];

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in flex h-full flex-col gap-4 duration-500 md:flex-row overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <CalendarMainView
          currentYear={currentYear}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          todayInfo={todayInfo}
          events={events}
          todos={todos}
          kakaoLoading={kakaoLoading}
          isKakaoUser={currentUser?.socialProvider === "KAKAO"}
          visibleEventKinds={visibleEventKinds}
          onToggleEventKind={(kind, value) => setVisibleEventKinds((prev) => ({ ...prev, [kind]: value }))}
          onMonthChange={(year, month) => moveToMonth(new Date(year, month - 1, 1))}
          onPrevMonth={() => moveToMonth(new Date(currentYear, currentMonth - 1, 1))}
          onNextMonth={() => moveToMonth(new Date(currentYear, currentMonth + 1, 1))}
          onToday={() => { const now = new Date(); moveToMonth(now, now.getDate()); }}
          onLoadKakao={forceReloadKakaoEvents}
          onCreateEvent={() => openCreateModal(selectedDateKey)}
          onSelectDate={(year, month, date) => {
            setCurrentDate(new Date(year, month, 1));
            setSelectedDate(date);
          }}
          onDoubleClickDate={(dateKey) => {
            const [y, m, d] = dateKey.split("-").map(Number);
            setCurrentDate(new Date(y, m - 1, 1));
            setSelectedDate(d);
            openCreateModal(dateKey);
          }}
          onEventDragStart={handleEventDragStart}
          onEventDragOver={handleEventDragOver}
          onEventDrop={handleEventDrop}
        />
      </div>

      {isOverlay && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-hp-600 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 md:bottom-12 md:right-10"
          aria-label="Todo 열기"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      <CalendarDaySidebar
        currentYear={currentYear}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        selectedEvents={selectedEvents}
        selectedTodos={selectedTodos}
        calendarLoading={calendarLoading}
        isSidebarOpen={isSidebarOpen}
        isOverlay={isOverlay}
        inputRef={inputRef}
        editingTodoId={editingTodoId}
        editingTodoText={editingTodoText}
        draggedTodoId={draggedTodoId}
        dropTargetTodoId={dropTargetTodoId}
        newTodoText={newTodoText}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onChangeNewTodo={setNewTodoText}
        onAddTodo={handleAddTodo}
        onToggleTodo={handleToggleTodo}
        onStartTodoEdit={startTodoEdit}
        onCancelTodoEdit={cancelTodoEdit}
        onSubmitTodoEdit={() => void handleSubmitTodoEdit()}
        onChangeTodoEditText={setEditingTodoText}
        onRequestDeleteTodo={requestDeleteTodo}
        onTodoDragStart={handleTodoDragStart}
        onTodoDragOver={handleTodoDragOver}
        onTodoDrop={handleTodoDrop}
        onTodoDragEnd={resetTodoDragState}
        onEditEvent={openEditModal}
        onRequestDeleteEvent={requestDeleteEvent}
        onSelectEvent={setSelectedEvent}
      />

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
        onClose={handleCloseSelectedEvent}
        onEdit={handleEditSelectedEvent}
        onDelete={handleDeleteSelectedEvent}
      />
      <ConfirmModal
        isOpen={confirmDialog !== null}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.message ?? ""}
        confirmLabel={confirmDialog?.confirmLabel ?? "확인"}
        variant={confirmDialog?.tone === "danger" ? "danger" : "primary"}
        onConfirm={() => {
          const action = confirmDialog?.onConfirm;
          setConfirmDialog(null);
          action?.();
        }}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
}
