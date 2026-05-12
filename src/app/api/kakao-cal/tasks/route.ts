import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoApiErrorResponse,
  buildKakaoTokenErrorResponse,
  getKakaoAccessToken,
  isKakaoTokenError,
  kakaoCalGet,
  kakaoCalPost,
} from "@/features/calendar/api/kakao-mcp-client";
import { type CreateTaskInput } from "@/features/calendar/api/kakao-playmcp";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from) params.set("from", from + "T00:00:00+09:00");
    if (to) params.set("to", to + "T23:59:59+09:00");

    const res = await kakaoCalGet(`/tasks?${params}`, token);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return buildKakaoApiErrorResponse(res.status, data, "카카오 할 일을 불러오지 못했습니다.");
    }

    return NextResponse.json({ tasks: data.tasks ?? [] });
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

    const body = (await req.json()) as CreateTaskInput;
    if (!body.title) {
      return NextResponse.json({ message: "제목은 필수입니다." }, { status: 400 });
    }

    const task: Record<string, unknown> = { title: body.title };
    if (body.dueDate) task.due_date = body.dueDate;
    if (body.memo) task.memo = body.memo;

    const res = await kakaoCalPost("/create/task", token, "task", task);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return buildKakaoApiErrorResponse(res.status, data, "카카오 할 일 생성에 실패했습니다.");
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    if (isKakaoTokenError(error)) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
