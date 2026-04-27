import { NextRequest, NextResponse } from "next/server";
import { getKakaoAccessToken, kakaoCalGet } from "@/features/calendar/api/kakao-mcp-client";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const res = await kakaoCalGet("/friends/birthdays", token);
    const data = await res.json();

    if (!res.ok) {
      console.error("[kakao-cal/birthdays GET]", data);
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ birthdays: data.birthdays ?? [] });
  } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
