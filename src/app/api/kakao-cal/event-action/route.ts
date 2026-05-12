import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoApiErrorResponse,
  buildKakaoTokenErrorResponse,
  getKakaoAccessToken,
  isKakaoTokenError,
} from "@/features/calendar/api/kakao-mcp-client";

type EventActionBody =
  | { action: "delete"; eventId: string; calendarId?: string }
  | { action: "update"; eventId: string; event: Record<string, unknown> }
  | { action: "delete-task"; taskId: string };

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
        return buildKakaoApiErrorResponse(res.status, data, "카카오 일정 삭제에 실패했습니다.");
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "delete-task") {
      const params = new URLSearchParams({ task_id: body.taskId });
      const res = await fetch(
        `https://kapi.kakao.com/v2/api/calendar/tasks?${params}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return buildKakaoApiErrorResponse(res.status, data, "카카오 할 일 삭제에 실패했습니다.");
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "update") {
      const formBody = new URLSearchParams();
      formBody.set("event_id", body.eventId);
      formBody.set("event", JSON.stringify(body.event));
      const res = await fetch("https://kapi.kakao.com/v2/api/calendar/update/event/host", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return buildKakaoApiErrorResponse(res.status, data, "카카오 일정 수정에 실패했습니다.");
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "지원하지 않는 action입니다." }, { status: 400 });
  } catch (error) {
    if (isKakaoTokenError(error)) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
