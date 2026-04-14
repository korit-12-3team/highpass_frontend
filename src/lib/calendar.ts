import { EventType } from "@/lib/AppContext";
import { fetchWithAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

type CalendarApiRecord = {
  id?: string | number;
  calendarId?: string | number;
  userId?: string | number;
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
  kind?: "general" | "certificate";
};

type CalendarListApiRecord = CalendarApiRecord[] | { data?: CalendarApiRecord[] };

type CreateCalendarEventInput = {
  userId: string;
  title: string;
  content?: string;
  startDate: string;
  endDate: string;
  color: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  kind?: "general" | "certificate";
};

type UpdateCalendarEventInput = {
  calendarId: string;
  title: string;
  content?: string;
  startDate: string;
  endDate: string;
  color?: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  kind?: "general" | "certificate";
};

function inferEventKind(title?: string, color?: string): "general" | "certificate" {
  const text = `${title || ""} ${color || ""}`;
  return /written|practical|registration|exam/i.test(text) || /emerald|teal|violet|amber|indigo/i.test(text)
    ? "certificate"
    : "general";
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

function normalizeTime(value?: string | null) {
  if (!value) return undefined;
  return value.slice(0, 5);
}

function mapApiRecordToEvent(record: CalendarApiRecord): EventType {
  const startDate = record.startDate;
  const endDate = record.endDate || record.startDate;
  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);
  const title = record.title || record.content || record.name || "Event";

  return {
    id: String(record.calendarId ?? record.id ?? Date.now()),
    title,
    content: record.content ?? record.title ?? title,
    month: start.month,
    startDay: start.day,
    endDay: end.day,
    startDate,
    endDate,
    color: inferEventColor(title, record.color),
    isAllDay: record.isAllDay ?? record.allDay ?? (!record.startTime && !record.endTime),
    startTime: normalizeTime(record.startTime),
    endTime: normalizeTime(record.endTime),
    kind: record.kind ?? inferEventKind(title, record.color),
  };
}

async function parseCalendarResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  if (text.trim().startsWith("<")) {
    throw new Error("Server returned HTML instead of JSON.");
  }

  const parsed = JSON.parse(text) as CalendarApiRecord | { data?: CalendarApiRecord };
  if ("data" in parsed && parsed.data) return parsed.data;
  return parsed as CalendarApiRecord;
}

export async function listCalendarEvents(userId: string): Promise<EventType[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/calendar/${userId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to load calendar events.");
  }

  const text = await response.text();
  if (!text) return [];
  if (text.trim().startsWith("<")) {
    throw new Error("Server returned HTML instead of JSON.");
  }

  const parsed = JSON.parse(text) as CalendarListApiRecord;
  const payload = Array.isArray(parsed) ? parsed : parsed.data;
  if (!Array.isArray(payload)) return [];

  return payload.map(mapApiRecordToEvent);
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<EventType> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/calendar/${input.userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      content: input.content ?? input.title,
      startDate: input.startDate,
      endDate: input.endDate,
      color: input.color,
      isAllDay: input.isAllDay,
      startTime: input.isAllDay ? null : input.startTime,
      endTime: input.isAllDay ? null : input.endTime,
      kind: input.kind,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create the calendar event.");
  }

  const data = await parseCalendarResponse(response);
  if (!data) {
    const start = parseDateParts(input.startDate);
    const end = parseDateParts(input.endDate);
    return {
      id: String(Date.now()),
      title: input.title,
      content: input.content ?? input.title,
      month: start.month,
      startDay: start.day,
      endDay: end.day,
      startDate: input.startDate,
      endDate: input.endDate,
      color: input.color,
      isAllDay: input.isAllDay,
      startTime: input.isAllDay ? undefined : input.startTime,
      endTime: input.isAllDay ? undefined : input.endTime,
      kind: input.kind || inferEventKind(input.title, input.color),
    };
  }

  const mapped = mapApiRecordToEvent(data);
  return {
    ...mapped,
    content: input.content ?? mapped.content,
    color: input.color || mapped.color,
    isAllDay: input.isAllDay,
    startTime: input.isAllDay ? undefined : input.startTime,
    endTime: input.isAllDay ? undefined : input.endTime,
    kind: input.kind || mapped.kind,
  };
}

export async function updateCalendarEvent(input: UpdateCalendarEventInput): Promise<EventType> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/calendar/${input.calendarId}/content`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      content: input.content ?? input.title,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.isAllDay ? null : input.startTime,
      endTime: input.isAllDay ? null : input.endTime,
      kind: input.kind,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update the calendar event.");
  }

  const data = await parseCalendarResponse(response);
  if (!data) {
    const start = parseDateParts(input.startDate);
    const end = parseDateParts(input.endDate);
    return {
      id: input.calendarId,
      title: input.title,
      content: input.content ?? input.title,
      month: start.month,
      startDay: start.day,
      endDay: end.day,
      startDate: input.startDate,
      endDate: input.endDate,
      color: input.color ?? inferEventColor(input.title, undefined),
      isAllDay: input.isAllDay,
      startTime: input.isAllDay ? undefined : input.startTime,
      endTime: input.isAllDay ? undefined : input.endTime,
      kind: input.kind ?? inferEventKind(input.title, input.color),
    };
  }

  const mapped = mapApiRecordToEvent(data);
  return {
    ...mapped,
    content: input.content ?? mapped.content,
    color: input.color ?? mapped.color,
    isAllDay: input.isAllDay,
    startTime: input.isAllDay ? undefined : input.startTime,
    endTime: input.isAllDay ? undefined : input.endTime,
    kind: input.kind ?? mapped.kind,
  };
}

export async function removeCalendarEvent(calendarId: string) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/calendar/${calendarId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete the calendar event.");
  }
}
