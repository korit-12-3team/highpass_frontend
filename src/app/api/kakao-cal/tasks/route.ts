import { NextRequest, NextResponse } from "next/server";
import { getKakaoAccessToken, kakaoCalGet, kakaoCalPost } from "@/features/calendar/api/kakao-mcp-client";
import { type CreateTaskInput } from "@/features/calendar/api/kakao-playmcp";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    const from = searchParams.get("from");
    const to   = searchParams.get("to");
    if (from) params.set("from", from);
    if (to)   params.set("to", to);

    const res = await kakaoCalGet(`/tasks?${params}`, token);
    const data = await res.json();

    if (!res.ok) {
      console.error("[kakao-cal/tasks GET]", data);
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ tasks: data.tasks ?? [] });
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
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
    if (body.memo)    task.memo = body.memo;

    const res = await kakaoCalPost("/create/task", token, "task", task);
    const data = await res.json();

    if (!res.ok) {
      console.error("[kakao-cal/tasks POST]", data);
      return NextResponse.json(
        { message: data.msg ?? data.message ?? "카카오 API 오류" },
        { status: res.status }
      );
    }
    return NextResponse.json({ task: data });
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
