import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoTokenErrorResponse,
  getKakaoAccessToken,
  isKakaoTokenError,
} from "@/features/calendar/api/kakao-mcp-client";

/**
 * 진단용: 현재 카카오 access token이 실제로 어떤 스코프를 가지고 있는지 확인.
 * `/calendar` 화면 띄운 상태에서 브라우저로 `/api/kakao-cal/scopes` 접속하면 됨.
 */
export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const scopesRes = await fetch("https://kapi.kakao.com/v2/user/scopes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const scopesData = (await scopesRes.json().catch(() => ({}))) as {
      scopes?: Array<{ id: string; display_name?: string; agreed?: boolean; using?: boolean }>;
    };
    const talkCalendar = scopesData.scopes?.find((s) => s.id === "talk_calendar");

    // 실제 events API를 호출해 raw 응답을 그대로 노출
    const now   = new Date();
    const from  = new Date(now.getFullYear(), now.getMonth(),     1).toISOString();
    const to    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const params = new URLSearchParams({ from, to });
    const eventsRes  = await fetch(`https://kapi.kakao.com/v2/api/calendar/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const eventsData = await eventsRes.json().catch(() => ({}));

    const eventsArr = (eventsData as { events?: Record<string, unknown>[] }).events;
    const firstEvent = eventsArr && eventsArr.length > 0 ? eventsArr[0] : null;
    const sampleEventInspection = firstEvent
      ? {
          all_keys: Object.keys(firstEvent),
          title_field:   firstEvent.title,
          name_field:    firstEvent.name,
          summary_field: firstEvent.summary,
          subject_field: firstEvent.subject,
          event_nested:  firstEvent.event,
        }
      : null;

    return NextResponse.json({
      scopesStatus: scopesRes.status,
      scopesRaw: scopesData,
      eventsStatus: eventsRes.status,
      eventsRaw: eventsData,
      sampleEventInspection,
      diagnosis: {
        talk_calendar_listed: !!talkCalendar,
        talk_calendar_agreed: talkCalendar?.agreed === true,
        events_call_ok: eventsRes.ok,
        events_kakao_code: (eventsData as { code?: number }).code,
        events_kakao_msg:  (eventsData as { msg?: string  }).msg,
        events_count: eventsArr?.length ?? 0,
      },
    });
  } catch (error) {
    if (isKakaoTokenError(error)) return buildKakaoTokenErrorResponse(error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
