"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { EventType } from "@/shared/context/AppContext";
import { fetchWithAuth } from "@/services/auth/auth";
import { API_BASE_URL } from "@/services/config/config";
import {
  KakaoCalendarApiResponse,
  KakaoEventRaw,
  getKakaoCalIdMap,
  getKakaoLoadedIdMap,
  kakaoEventToEventType,
  saveKakaoCalIdMap,
  saveKakaoLoadedIdMap,
} from "@/features/calendar/utils/kakaoSync";

const KAKAO_OAUTH_REDIRECT_KEY = "hp_kakao_oauth_last_redirect_at";
const KAKAO_OAUTH_REDIRECT_COOLDOWN_MS = 60_000;

function canRedirectToKakaoOAuth(): boolean {
  try {
    const last = sessionStorage.getItem(KAKAO_OAUTH_REDIRECT_KEY);
    if (!last) return true;
    return Date.now() - Number(last) > KAKAO_OAUTH_REDIRECT_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markKakaoOAuthRedirect() {
  try {
    sessionStorage.setItem(KAKAO_OAUTH_REDIRECT_KEY, String(Date.now()));
  } catch {
    /* sessionStorage unavailable */
  }
}

export function useKakaoCalendar({
  currentYear,
  currentMonth,
  setEvents,
}: {
  currentYear: number;
  currentMonth: number;
  setEvents: React.Dispatch<React.SetStateAction<EventType[]>>;
}) {
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  const loadKakaoEvents = async (force = false) => {
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    if (!force && loadedMonthsRef.current.has(monthKey)) return;
    setKakaoLoading(true);
    try {
      const from = new Date(currentYear, currentMonth, 1).toISOString();
      const to   = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
      const res  = await fetchWithAuth(
        `${API_BASE_URL}/api/kakao/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      const data = await res.json() as KakaoCalendarApiResponse;

      if (res.status === 403 && data.connectUrl) {
        const connectUrl = data.connectUrl;
        toast.error("카카오 캘린더 권한이 부족합니다. 톡캘린더 동의 후 재연결해 주세요.", {
          duration: 12000,
          action: { label: "재연결하기", onClick: () => { window.location.href = connectUrl; } },
        });
        return;
      }

      if (res.status === 401 && data.connectUrl) {
        if (!canRedirectToKakaoOAuth()) {
          toast.error("카카오 캘린더 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.", { duration: 8000 });
          return;
        }
        markKakaoOAuthRedirect();
        toast.info("카카오 캘린더 권한이 만료되어 재연동이 필요합니다.");
        window.location.href = data.connectUrl;
        return;
      }
      if (!res.ok) {
        const code = (data as { code?: number }).code;
        const codeSuffix = typeof code === "number" ? ` (code: ${code})` : "";
        throw new Error(`${data.message ?? "불러오기 실패"}${codeSuffix}`);
      }

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
      loadedMonthsRef.current.add(monthKey);
      toast.success(`카카오 일정 ${kakaoEvents.length}개를 불러왔습니다.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "카카오 일정 불러오기 실패");
    } finally {
      setKakaoLoading(false);
    }
  };

  return {
    kakaoLoading,
    loadKakaoEvents,
    forceReloadKakaoEvents: () => loadKakaoEvents(true),
  };
}
