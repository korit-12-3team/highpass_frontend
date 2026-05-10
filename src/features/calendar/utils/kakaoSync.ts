import { EventType } from "@/shared/context/AppContext";

export type KakaoEventRaw = Record<string, unknown>;
export type KakaoCalendarApiResponse = {
  events?: KakaoEventRaw[];
  message?: string;
  connectUrl?: string;
};

export function toIso(date: string, time?: string): string {
  const base = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  return new Date(base).toISOString();
}

const KAKAO_CAL_ID_MAP_KEY = "hp_kakao_cal_id_map";
const KAKAO_SYNC_MAP_KEY = "hp_kakao_sync_map";
const KAKAO_LOADED_ID_MAP_KEY = "hp_kakao_loaded_id_map";

export function getKakaoCalIdMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KAKAO_CAL_ID_MAP_KEY) ?? "{}"); } catch { return {}; }
}
export function saveKakaoCalIdMap(map: Record<string, string>) {
  localStorage.setItem(KAKAO_CAL_ID_MAP_KEY, JSON.stringify(map));
}
export function getKakaoSyncMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KAKAO_SYNC_MAP_KEY) ?? "{}"); } catch { return {}; }
}
export function saveKakaoSyncMap(map: Record<string, string>) {
  localStorage.setItem(KAKAO_SYNC_MAP_KEY, JSON.stringify(map));
}
export function getKakaoLoadedIdMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KAKAO_LOADED_ID_MAP_KEY) ?? "{}"); } catch { return {}; }
}
export function saveKakaoLoadedIdMap(map: Record<string, string>) {
  localStorage.setItem(KAKAO_LOADED_ID_MAP_KEY, JSON.stringify(map));
}

export function kakaoEventToEventType(e: KakaoEventRaw, index: number): EventType {
  const rawId    = (e.event_id ?? e.id ?? e.eventId ?? "") as string;
  const rawTitle = (e.title ?? e.name ?? "") as string;
  const time     = (e.time ?? {}) as Record<string, unknown>;
  const startAt  = time.start_at ? new Date(time.start_at as string) : new Date();
  const allDay   = (time.all_day ?? false) as boolean;
  const rawEndAt = time.end_at ? new Date(time.end_at as string) : startAt;
  const endAt    = allDay && rawEndAt > startAt
    ? new Date(rawEndAt.getTime() - 24 * 60 * 60 * 1000)
    : rawEndAt;
  const desc = (e.description ?? e.memo ?? "") as string;

  const toDate = (d: Date) => d.toISOString().slice(0, 10);
  const toTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return {
    id: `kakao_${rawId || index}_${startAt.getTime()}`,
    title: rawTitle || "카카오 일정",
    content: desc,
    month: startAt.getMonth() + 1,
    startDay: startAt.getDate(),
    endDay: endAt.getDate(),
    startDate: toDate(startAt),
    endDate: toDate(endAt),
    color: "bg-yellow-400",
    isAllDay: allDay,
    startTime: allDay ? undefined : toTime(startAt),
    endTime:   allDay ? undefined : toTime(endAt),
    kind: "general",
  };
}

export async function syncToKakaoCalendar(
  appEventId: string,
  payload: {
    title: string;
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    startTime?: string;
    endTime?: string;
    content?: string;
  }
) {
  const res = await fetch("/api/kakao-cal/events/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      title: payload.title,
      startAt: toIso(payload.startDate, payload.isAllDay ? undefined : payload.startTime),
      endAt:   toIso(payload.endDate,   payload.isAllDay ? undefined : payload.endTime),
      allDay:  payload.isAllDay,
      description: payload.content ?? "",
    }),
  });

  if (res.ok) {
    const data = await res.json().catch(() => ({})) as { event?: { event_id?: string } };
    const kakaoEventId = data.event?.event_id;
    if (kakaoEventId) {
      const map = getKakaoSyncMap();
      map[appEventId] = kakaoEventId;
      saveKakaoSyncMap(map);
    }
  }
}
