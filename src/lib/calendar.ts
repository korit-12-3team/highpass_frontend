"use client";

import { EventType } from "@/lib/AppContext";
import { API_BASE_URL } from "@/lib/config";

type CalendarApiRecord = {
  id?: string | number;
  calendarId?: string | number;
  title?: string;
  content?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  color?: string;
  isAllDay?: boolean;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
};

type CreateCalendarEventInput = {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
};

function normalizeColor(color?: string) {
  return color || "bg-hp-500";
}

function parseDateParts(dateText?: string) {
  if (!dateText) return { month: 0, day: 1 };
  const date = new Date(dateText);
  return { month: date.getMonth(), day: date.getDate() };
}

function mapApiRecordToEvent(record: CalendarApiRecord): EventType {
  const start = parseDateParts(record.startDate);
  const end = parseDateParts(record.endDate || record.startDate);

  return {
    id: String(record.calendarId ?? record.id ?? Date.now()),
    title: record.title || record.content || record.name || "New Event",
    month: start.month,
    startDay: start.day,
    endDay: end.day,
    color: normalizeColor(record.color),
    isAllDay: record.isAllDay ?? record.allDay ?? true,
    startTime: record.startTime,
    endTime: record.endTime,
  };
}

async function parseCalendarResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  const parsed = JSON.parse(text) as CalendarApiRecord | { data?: CalendarApiRecord };
  if ("data" in parsed && parsed.data) return parsed.data;
  return parsed as CalendarApiRecord;
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<EventType> {
  const response = await fetch(`${API_BASE_URL}/api/calendar/${input.userId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      content: input.title,
      startDate: input.startDate,
      endDate: input.endDate,
      color: input.color,
      isAllDay: input.isAllDay,
      startTime: input.startTime,
      endTime: input.endTime,
    }),
  });

  if (!response.ok) throw new Error("캘린더 일정을 저장하지 못했습니다.");

  const data = await parseCalendarResponse(response);
  if (!data) {
    const start = parseDateParts(input.startDate);
    const end = parseDateParts(input.endDate);
    return {
      id: String(Date.now()),
      title: input.title,
      month: start.month,
      startDay: start.day,
      endDay: end.day,
      color: input.color,
      isAllDay: input.isAllDay,
      startTime: input.startTime,
      endTime: input.endTime,
    };
  }

  return mapApiRecordToEvent(data);
}

export async function getCalendarEvent(calendarId: string) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/${calendarId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw new Error("캘린더 일정을 불러오지 못했습니다.");

  const data = await parseCalendarResponse(response);
  return data ? mapApiRecordToEvent(data) : null;
}

export async function updateCalendarContent(calendarId: string, content: string) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/${calendarId}/content`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) throw new Error("캘린더 일정을 수정하지 못했습니다.");

  const data = await parseCalendarResponse(response);
  return data ? mapApiRecordToEvent(data) : null;
}

export async function removeCalendarEvent(calendarId: string) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/${calendarId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error("캘린더 일정을 삭제하지 못했습니다.");
}
