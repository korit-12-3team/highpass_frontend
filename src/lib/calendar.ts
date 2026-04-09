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
  kind?: "general" | "certificate";
};

type CalendarListApiRecord = CalendarApiRecord[] | { data?: CalendarApiRecord[] };

function inferEventKind(title?: string, color?: string): "general" | "certificate" {
  const text = `${title || ""} ${color || ""}`;
  return /필기|실기|접수/.test(text) || /emerald|teal|violet|amber|indigo/i.test(text) ? "certificate" : "general";
}

function inferEventColor(title?: string, color?: string) {
  if (color) return color;
  return inferEventKind(title, color) === "certificate" ? "bg-violet-500" : "bg-hp-500";
}

function parseDateParts(dateText?: string) {
  if (!dateText) return { month: 0, day: 1 };
  const date = new Date(dateText);
  return { month: date.getMonth(), day: date.getDate() };
}

function mapApiRecordToEvent(record: CalendarApiRecord): EventType {
  const start = parseDateParts(record.startDate);
  const end = parseDateParts(record.endDate || record.startDate);
  const title = record.title || record.content || record.name || "일정";

  return {
    id: String(record.calendarId ?? record.id ?? Date.now()),
    title,
    month: start.month,
    startDay: start.day,
    endDay: end.day,
    color: inferEventColor(title, record.color),
    isAllDay: record.isAllDay ?? record.allDay ?? true,
    startTime: record.startTime,
    endTime: record.endTime,
    kind: inferEventKind(title, record.color),
  };
}

async function parseCalendarResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  if (text.trim().startsWith("<")) {
    throw new Error("서버가 JSON 대신 HTML을 반환했습니다.");
  }

  const parsed = JSON.parse(text) as CalendarApiRecord | { data?: CalendarApiRecord };
  if ("data" in parsed && parsed.data) return parsed.data;
  return parsed as CalendarApiRecord;
}

export async function listCalendarEvents(userId: string): Promise<EventType[]> {
  const response = await fetch(`${API_BASE_URL}/api/calendar/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("캘린더 일정을 불러오지 못했습니다.");
  }

  const text = await response.text();
  if (!text) return [];
  if (text.trim().startsWith("<")) {
    throw new Error("서버가 JSON 대신 HTML을 반환했습니다.");
  }

  const parsed = JSON.parse(text) as CalendarListApiRecord;
  const payload = Array.isArray(parsed) ? parsed : parsed.data;
  if (!Array.isArray(payload)) return [];

  return payload.map(mapApiRecordToEvent);
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
      kind: input.kind,
    }),
  });

  if (!response.ok) {
    throw new Error("캘린더 일정을 추가하지 못했습니다.");
  }

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
      kind: input.kind || inferEventKind(input.title, input.color),
    };
  }

  const mapped = mapApiRecordToEvent(data);
  return {
    ...mapped,
    color: input.color || mapped.color,
    kind: input.kind || mapped.kind,
  };
}

export async function removeCalendarEvent(calendarId: string) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/${calendarId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("캘린더 일정을 삭제하지 못했습니다.");
  }
}
