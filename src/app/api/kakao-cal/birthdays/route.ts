import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoApiErrorResponse,
  buildKakaoTokenErrorResponse,
  getKakaoAccessToken,
  isKakaoTokenError,
  kakaoCalGet,
} from "@/features/calendar/api/kakao-mcp-client";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const res = await kakaoCalGet("/friends/birthdays", token);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return buildKakaoApiErrorResponse(res.status, data, "카카오 친구 생일을 불러오지 못했습니다.");
    }

    return NextResponse.json({ birthdays: data.birthdays ?? [] });
  } catch (error) {
    if (isKakaoTokenError(error)) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
