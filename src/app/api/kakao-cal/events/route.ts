import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoApiErrorResponse,
  buildKakaoTokenErrorResponse,
  getKakaoAccessToken,
  isKakaoTokenError,
  kakaoCalGet,
  kakaoCalPost,
} from "@/features/calendar/api/kakao-mcp-client";
import { type CreateEventInput } from "@/features/calendar/api/kakao-playmcp";

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
    if (from) params.set("from", from.includes("T") ? from : from + "T00:00:00+09:00");
    if (to) params.set("to", to.includes("T") ? to : to + "T23:59:59+09:00");

    const res = await kakaoCalGet(`/events?${params}`, token);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return buildKakaoApiErrorResponse(res.status, data, "카카오 일정을 불러오지 못했습니다.");
    }

    return NextResponse.json({ events: data.events ?? [] });
  } catch (error) {
    if (isKakaoTokenError(error)) {
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
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return buildKakaoApiErrorResponse(res.status, data, "카카오 일정 생성에 실패했습니다.");
    }

    return NextResponse.json({ event: data });
  } catch (error) {
    if (isKakaoTokenError(error)) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
