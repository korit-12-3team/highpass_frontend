import { NextRequest, NextResponse } from "next/server";
import { getKakaoAccessToken, kakaoCalPost } from "@/features/calendar/api/kakao-mcp-client";

type EventActionBody =
  | { action: "delete"; eventId: string; calendarId?: string }
  | { action: "update"; eventId: string; event: Record<string, unknown> };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EventActionBody;
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    if (body.action === "delete") {
      const params = new URLSearchParams({ event_id: body.eventId });
      if (body.calendarId) params.set("calendar_id", body.calendarId);
      console.log("[kakao delete] event_id:", body.eventId, "calendar_id:", body.calendarId);
      const res = await fetch(
        `https://kapi.kakao.com/v2/api/calendar/events?${params}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json().catch(() => ({}));
      console.log("[kakao event-action delete] status:", res.status, data);
      if (!res.ok) {
        return NextResponse.json(
          { message: (data as { msg?: string }).msg ?? "카카오 삭제 실패" },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "update") {
      const res = await kakaoCalPost(
        `/update/event/${body.eventId}`,
        token,
        "event",
        body.event
      );
      const data = await res.json().catch(() => ({}));
      console.log("[kakao event-action update] status:", res.status, data);
      if (!res.ok) {
        return NextResponse.json(
          { message: (data as { msg?: string }).msg ?? "카카오 수정 실패" },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "알 수 없는 action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
