"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EventType } from "@/shared/context/AppContext";
import {
  createCalendarEvent,
  listCalendarEvents,
  listHolidays,
  removeCalendarEvent,
  updateCalendarEvent,
} from "@/features/calendar/api/calendar";
import { formatDateKey, parseDate } from "@/features/calendar/utils/calendarLayout";
import { DEFAULT_EVENT_FORM, buildEventForm } from "@/features/calendar/utils/eventForm";
import { EventFormState, ConfirmDialogState } from "@/features/calendar/types";
import {
  getKakaoCalIdMap,
  getKakaoLoadedIdMap,
  getKakaoSyncMap,
  saveKakaoLoadedIdMap,
  saveKakaoSyncMap,
  syncToKakaoCalendar,
  toIso,
} from "@/features/calendar/utils/kakaoSync";
import { toUserMessage } from "@/shared/errors";

export function useCalendarEvents({
  currentUser,
  isKakaoUser,
  events,
  setEvents,
  currentYear,
  selectedDateKey,
  setCurrentDate,
  setSelectedDate,
  setConfirmDialog,
}: {
  currentUser: { id: string } | null;
  isKakaoUser: boolean;
  events: EventType[];
  setEvents: React.Dispatch<React.SetStateAction<EventType[]>>;
  currentYear: number;
  selectedDateKey: string;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<number>>;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
}) {
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>(DEFAULT_EVENT_FORM);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    void (async () => {
      setCalendarLoading(true);
      const [eventsResult, holidaysResult] = await Promise.allSettled([
        listCalendarEvents(currentUser.id),
        listHolidays(currentYear),
      ]);
      if (cancelled) return;

      const loadedEvents = eventsResult.status === "fulfilled" ? eventsResult.value : [];
      const loadedHolidays = holidaysResult.status === "fulfilled" ? holidaysResult.value : [];
      setEvents([...loadedEvents, ...loadedHolidays]);

      if (eventsResult.status === "rejected") {
        toast.error(toUserMessage(eventsResult.reason, "일정을 불러오지 못했습니다."));
      }
      if (holidaysResult.status === "rejected") {
        toast.error("공휴일 정보를 불러오지 못했습니다.");
      }

      setCalendarLoading(false);
    })();

    return () => { cancelled = true; };
  }, [currentUser, setEvents, currentYear]);

  const openCreateModal = (dateKey?: string) => {

    setEventForm(buildEventForm(dateKey ?? selectedDateKey));
    setEventModalOpen(true);
  };

  const openEditModal = (event: EventType) => {

    setEventForm(buildEventForm(selectedDateKey, event));
    setEventModalOpen(true);
  };

  const closeEventModal = () => {
    setEventModalOpen(false);
    setEventForm(DEFAULT_EVENT_FORM);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
  

      if (eventId.startsWith("kakao_")) {
        const loadedMap = getKakaoLoadedIdMap();
        const kakaoEventId = loadedMap[eventId];
        if (kakaoEventId) {
          const calendarId = getKakaoCalIdMap()[kakaoEventId];
          fetch("/api/kakao-cal/event-action/", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", eventId: kakaoEventId, ...(calendarId ? { calendarId } : {}) }),
          }).then((res) => {
            if (res.ok) { const m = getKakaoLoadedIdMap(); delete m[eventId]; saveKakaoLoadedIdMap(m); }
          }).catch(() => {});
        }
      } else {
        await removeCalendarEvent(eventId);
        const syncMap = getKakaoSyncMap();
        const kakaoEventId = syncMap[eventId];
        if (kakaoEventId) {
          const calendarId = getKakaoCalIdMap()[kakaoEventId];
          fetch("/api/kakao-cal/event-action/", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", eventId: kakaoEventId, ...(calendarId ? { calendarId } : {}) }),
          }).then((res) => {
            if (res.ok) { delete syncMap[eventId]; saveKakaoSyncMap(syncMap); }
          }).catch(() => {});
        }
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedEvent((prev) => (prev?.id === eventId ? null : prev));
    } catch (error) {
      toast.error(toUserMessage(error, "일정 삭제에 실패했습니다."));
    }
  };

  const handleSubmitEvent = async () => {
    if (!currentUser || savingEvent) return;
    if (!eventForm.title.trim()) { toast.warning("일정 제목을 입력해 주세요."); return; }
    if (!eventForm.startDate || !eventForm.endDate) { toast.warning("일정 날짜를 선택해 주세요."); return; }

    try {
      setSavingEvent(true);
  

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

      if (eventForm.id?.startsWith("kakao_")) {
        const formId = eventForm.id;
        const existing = events.find((e) => e.id === formId);
        if (existing) {
          const updated: EventType = {
            ...existing, ...payload,
            startTime: payload.isAllDay ? undefined : payload.startTime,
            endTime: payload.isAllDay ? undefined : payload.endTime,
          };
          setEvents((prev) => prev.map((e) => (e.id === formId ? updated : e)));
          setSelectedEvent((prev) => (prev?.id === formId ? updated : prev));
        }
        closeEventModal();
        toast.success("일정이 수정되었습니다.");

        const kakaoEventId = getKakaoLoadedIdMap()[formId];
        if (kakaoEventId) {
          const updateEvent: Record<string, unknown> = {
            title: payload.title,
            time: {
              start_at: toIso(payload.startDate, payload.isAllDay ? undefined : payload.startTime),
              end_at: toIso(payload.endDate, payload.isAllDay ? undefined : payload.endTime),
              all_day: payload.isAllDay,
              time_zone: "Asia/Seoul",
            },
            ...(payload.content ? { description: payload.content } : {}),
          };
          fetch("/api/kakao-cal/event-action/", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update", eventId: kakaoEventId, event: updateEvent }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              toast.warning((data as { message?: string }).message ?? "카카오 측 동기화가 실패했습니다.");
            }
          }).catch(() => {});
        }
        return;
      }

      const savedEvent = eventForm.id
        ? await updateCalendarEvent({ calendarId: eventForm.id, ...payload })
        : await createCalendarEvent({ userId: currentUser.id, ...payload });

      if (!eventForm.id) {
        const syncPayload = { ...payload };
        const newEventId = savedEvent.id;
        if (isKakaoUser) {
          setConfirmDialog({
            title: "카카오톡 캘린더",
            message: "카카오톡 캘린더에도 일정을 등록하시겠습니까? 등록 시 앱 일정은 카카오 일정으로 통합됩니다.",
            confirmLabel: "등록",
            tone: "primary",
            onConfirm: () => {
              (async () => {
                try {
                  const { kakaoEventId } = await syncToKakaoCalendar(newEventId, syncPayload);
                  if (!kakaoEventId) {
                    toast.error("카카오톡 캘린더 등록에 실패했습니다.");
                    return;
                  }

                  // 카카오 일정으로 통합: 백엔드의 앱 일정 삭제 후 state를 카카오 스타일로 교체
                  await removeCalendarEvent(newEventId).catch(() => {});

                  const startAt = new Date(
                    toIso(syncPayload.startDate, syncPayload.isAllDay ? undefined : syncPayload.startTime),
                  );
                  const newAppId = `kakao_${kakaoEventId}_${startAt.getTime()}`;

                  setEvents((prev) =>
                    prev.map((e) =>
                      e.id === newEventId
                        ? { ...e, id: newAppId, color: "bg-yellow-400" }
                        : e,
                    ),
                  );
                  setSelectedEvent((prev) =>
                    prev?.id === newEventId
                      ? { ...prev, id: newAppId, color: "bg-yellow-400" }
                      : prev,
                  );

                  // 다음 카카오 일정 로드 시 같은 일정으로 인식되도록 매핑 갱신
                  const loadedMap = getKakaoLoadedIdMap();
                  loadedMap[newAppId] = kakaoEventId;
                  saveKakaoLoadedIdMap(loadedMap);

                  // 앱 일정은 더 이상 존재하지 않으므로 syncMap의 매핑 제거
                  const syncMap = getKakaoSyncMap();
                  if (syncMap[newEventId]) {
                    delete syncMap[newEventId];
                    saveKakaoSyncMap(syncMap);
                  }

                  toast.success("카카오톡 캘린더에 등록되었습니다.");
                } catch {
                  toast.error("카카오톡 캘린더 등록에 실패했습니다.");
                }
              })();
            },
          });
        }
      } else {
        const kakaoEventId = getKakaoSyncMap()[eventForm.id];
        if (kakaoEventId) {
          fetch("/api/kakao-cal/event-action/", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update",
              eventId: kakaoEventId,
              event: {
                title: payload.title,
                time: {
                  start_at: toIso(payload.startDate, payload.isAllDay ? undefined : payload.startTime),
                  end_at: toIso(payload.endDate, payload.isAllDay ? undefined : payload.endTime),
                  all_day: payload.isAllDay,
                  time_zone: "Asia/Seoul",
                },
                description: payload.content ?? "",
              },
            }),
          }).catch(() => {});
        }
      }

      setEvents((prev) =>
        eventForm.id ? prev.map((e) => (e.id === eventForm.id ? savedEvent : e)) : [...prev, savedEvent],
      );
      setSelectedEvent((prev) => (prev?.id === savedEvent.id ? savedEvent : prev));

      const nextDate = parseDate(savedEvent.startDate, currentYear) ?? new Date(savedEvent.startDate || selectedDateKey);
      setCurrentDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      setSelectedDate(nextDate.getDate());
      closeEventModal();
      toast.success(eventForm.id ? "일정이 수정되었습니다." : "일정이 추가되었습니다.");
    } catch (error) {
      toast.error(toUserMessage(error, "일정을 저장하지 못했습니다."));
    } finally {
      setSavingEvent(false);
    }
  };

  const handleEventDragStart = (e: React.DragEvent, eventId: string) => {
    const event = events.find((ev) => ev.id === eventId);
    if (!event || eventId.startsWith("holiday-") || eventId.startsWith("kakao_") || event.kind === "certificate") {
      e.preventDefault();
      return;
    }
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", eventId);
  };

  const handleEventDragOver = (e: React.DragEvent) => {
    if (draggedEventId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
  };

  const handleEventDrop = async (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault();
    if (!draggedEventId) return;

    const eventToMove = events.find((ev) => ev.id === draggedEventId);
    if (!eventToMove?.startDate) { setDraggedEventId(null); return; }

    const diffTime = new Date(targetDateKey).getTime() - new Date(eventToMove.startDate).getTime();
    const shiftDate = (d: string) => {
      const shifted = new Date(new Date(d).getTime() + diffTime);
      return formatDateKey(shifted.getFullYear(), shifted.getMonth(), shifted.getDate());
    };

    try {
      const updated = await updateCalendarEvent({
        calendarId: eventToMove.id,
        title: eventToMove.title,
        content: eventToMove.content,
        startDate: targetDateKey,
        endDate: eventToMove.endDate ? shiftDate(eventToMove.endDate) : targetDateKey,
        isAllDay: eventToMove.isAllDay,
        startTime: eventToMove.startTime,
        endTime: eventToMove.endTime,
        kind: eventToMove.kind,
      });
      setEvents((prev) => prev.map((ev) => (ev.id === draggedEventId ? updated : ev)));
      toast.success("일정이 이동되었습니다.");
    } catch {
      toast.error("일정 이동에 실패했습니다.");
    } finally {
      setDraggedEventId(null);
    }
  };

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

  return {
    calendarLoading,
    savingEvent,
    eventModalOpen,
    eventForm,
    setEventForm,
    selectedEvent,
    setSelectedEvent,
    draggedEventId,
    openCreateModal,
    openEditModal,
    closeEventModal,
    handleSubmitEvent,
    handleEventDragStart,
    handleEventDragOver,
    handleEventDrop,
    requestDeleteEvent,
    handleEditSelectedEvent: () => {
      if (!selectedEvent) return;
      const ev = selectedEvent;
      setSelectedEvent(null);
      window.setTimeout(() => openEditModal(ev), 0);
    },
    handleDeleteSelectedEvent: () => {
      if (!selectedEvent) return;
      requestDeleteEvent(selectedEvent);
    },
    handleCloseSelectedEvent: () => setSelectedEvent(null),
    updateEventFormField:
      (field: keyof EventFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEventForm((prev) => ({ ...prev, [field]: e.target.value })),
    updateEventStartDate: (e: React.ChangeEvent<HTMLInputElement>) => {
      const startDate = e.target.value;
      setEventForm((prev) => ({ ...prev, startDate, endDate: startDate }));
    },
    updateEventEndDate: (e: React.ChangeEvent<HTMLInputElement>) => {
      const endDate = e.target.value;
      setEventForm((prev) => ({
        ...prev,
        endDate: prev.startDate && endDate < prev.startDate ? prev.startDate : endDate,
      }));
    },
    toggleEventAllDay: () => setEventForm((prev) => ({ ...prev, isAllDay: !prev.isAllDay })),
  };
}
