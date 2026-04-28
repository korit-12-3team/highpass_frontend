import { NextRequest, NextResponse } from "next/server";
import { getKakaoAccessToken, KakaoTokenError, kakaoCalGet, kakaoCalPost } from "@/features/calendar/api/kakao-mcp-client";
import { type CreateEventInput } from "@/features/calendar/api/kakao-playmcp";
import { API_BASE_URL } from "@/services/config/config";

function buildKakaoTokenErrorResponse(error: KakaoTokenError) {
  return NextResponse.json(
    { message: error.message, connectUrl: `${API_BASE_URL}/oauth2/authorization/kakao-calendar` },
    { status: error.status },
  );
}

export async function DELETE(req: NextRequest) {
  try {
    const { eventId } = (await req.json()) as { eventId: string };
    if (!eventId) {
      return NextResponse.json({ message: "eventId가 필요합니다." }, { status: 400 });
    }

    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const res = await fetch(
      `https://kapi.kakao.com/v2/api/calendar/delete/events/${eventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: (data as { msg?: string }).msg ?? "카카오 API 오류" },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof KakaoTokenError) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

function roundTo5Min(isoString: string): string {
  const date = new Date(isoString);
  const remainder = date.getMinutes() % 5;
  if (remainder !== 0) {
    date.setMinutes(date.getMinutes() + (5 - remainder), 0, 0);
  }
  return date.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await kakaoCalGet(`/events?${params}`, token);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ events: data.events ?? [] });
  } catch (error) {
    if (error instanceof KakaoTokenError) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const body = (await req.json()) as CreateEventInput;
    if (!body.title || !body.startAt || !body.endAt) {
      return NextResponse.json({ message: "제목, 시작일, 종료일은 필수입니다." }, { status: 400 });
    }

    const event: Record<string, unknown> = {
      title: body.title,
      time: {
        start_at: roundTo5Min(body.startAt),
        end_at: roundTo5Min(body.endAt),
        all_day: body.allDay ?? false,
        time_zone: "Asia/Seoul",
      },
    };
    if (body.description) event.description = body.description;
    if (body.location) event.location = { name: body.location };
    if (body.color) event.color = body.color;

    const res = await kakaoCalPost("/create/event", token, "event", event);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.msg ?? data.message ?? "카카오 API 오류" },
        { status: res.status },
      );
    }

    return NextResponse.json({ event: data });
  } catch (error) {
    if (error instanceof KakaoTokenError) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
