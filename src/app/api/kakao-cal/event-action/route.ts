import { NextRequest, NextResponse } from "next/server";
import { getKakaoAccessToken, KakaoTokenError, kakaoCalPost } from "@/features/calendar/api/kakao-mcp-client";
import { API_BASE_URL } from "@/services/config/config";

type EventActionBody =
  | { action: "delete"; eventId: string; calendarId?: string }
  | { action: "update"; eventId: string; event: Record<string, unknown> };

function buildKakaoTokenErrorResponse(error: KakaoTokenError) {
  return NextResponse.json(
    { message: error.message, connectUrl: `${API_BASE_URL}/oauth2/authorization/kakao-calendar` },
    { status: error.status },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EventActionBody;
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    if (body.action === "delete") {
      const params = new URLSearchParams({ event_id: body.eventId });
      if (body.calendarId) params.set("calendar_id", body.calendarId);

      const res = await fetch(
        `https://kapi.kakao.com/v2/api/calendar/events?${params}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { message: (data as { msg?: string }).msg ?? "카카오 일정 삭제 실패" },
          { status: res.status },
        );
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "update") {
      const res = await kakaoCalPost(`/update/event/${body.eventId}`, token, "event", body.event);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { message: (data as { msg?: string }).msg ?? "카카오 일정 수정 실패" },
          { status: res.status },
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "지원하지 않는 action입니다." }, { status: 400 });
  } catch (error) {
    if (error instanceof KakaoTokenError) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
