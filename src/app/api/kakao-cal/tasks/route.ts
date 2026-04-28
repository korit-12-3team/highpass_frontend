import { NextRequest, NextResponse } from "next/server";
import { getKakaoAccessToken, KakaoTokenError, kakaoCalGet, kakaoCalPost } from "@/features/calendar/api/kakao-mcp-client";
import { type CreateTaskInput } from "@/features/calendar/api/kakao-playmcp";
import { API_BASE_URL } from "@/services/config/config";

function buildKakaoTokenErrorResponse(error: KakaoTokenError) {
  return NextResponse.json(
    { message: error.message, connectUrl: `${API_BASE_URL}/oauth2/authorization/kakao-calendar` },
    { status: error.status },
  );
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

    const res = await kakaoCalGet(`/tasks?${params}`, token);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ tasks: data.tasks ?? [] });
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

    const body = (await req.json()) as CreateTaskInput;
    if (!body.title) {
      return NextResponse.json({ message: "제목은 필수입니다." }, { status: 400 });
    }

    const task: Record<string, unknown> = { title: body.title };
    if (body.dueDate) task.due_date = body.dueDate;
    if (body.memo) task.memo = body.memo;

    const res = await kakaoCalPost("/create/task", token, "task", task);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.msg ?? data.message ?? "카카오 API 오류" },
        { status: res.status },
      );
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    if (error instanceof KakaoTokenError) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
