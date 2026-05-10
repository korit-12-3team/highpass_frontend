"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EventType } from "@/shared/context/AppContext";
import {
  KakaoCalendarApiResponse,
  KakaoEventRaw,
  getKakaoCalIdMap,
  getKakaoLoadedIdMap,
  kakaoEventToEventType,
  saveKakaoCalIdMap,
  saveKakaoLoadedIdMap,
} from "@/features/calendar/utils/kakaoSync";

export function useKakaoCalendar({
  currentYear,
  currentMonth,
  setEvents,
  kakaoCalendarConnectUrl,
}: {
  currentYear: number;
  currentMonth: number;
  setEvents: React.Dispatch<React.SetStateAction<EventType[]>>;
  kakaoCalendarConnectUrl: string;
}) {
  const [kakaoLoading, setKakaoLoading] = useState(false);

  const loadKakaoEvents = async () => {
    setKakaoLoading(true);
    try {
      const from = new Date(currentYear, currentMonth, 1).toISOString();
      const to   = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
      const res  = await fetch(
        `/api/kakao-cal/events/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { credentials: "include" },
      );
      const data = await res.json() as KakaoCalendarApiResponse;

      if (res.status === 401) {
        window.location.href = data.connectUrl ?? kakaoCalendarConnectUrl;
        return;
      }
      if (!res.ok) throw new Error(data.message ?? "불러오기 실패");

      const kakaoEvents = (data.events ?? []).map((e: KakaoEventRaw, i: number) => {
        const ev = kakaoEventToEventType(e, i);
        const rawId = (e.event_id ?? e.id ?? e.eventId ?? "") as string;
        const calId = (e.calendar_id ?? e.calendarId ?? "") as string;
        if (rawId) {
          if (calId) {
            const m = getKakaoCalIdMap();
            m[rawId] = calId;
            saveKakaoCalIdMap(m);
          }
          const loadedMap = getKakaoLoadedIdMap();
          loadedMap[ev.id] = rawId;
          saveKakaoLoadedIdMap(loadedMap);
        }
        return ev;
      });

      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        return [...prev, ...kakaoEvents.filter((e) => !existingIds.has(e.id))];
      });
      toast.success(`카카오 일정 ${kakaoEvents.length}개를 불러왔습니다.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "카카오 일정 불러오기 실패");
    } finally {
      setKakaoLoading(false);
    }
  };

  return { kakaoLoading, loadKakaoEvents };
}
