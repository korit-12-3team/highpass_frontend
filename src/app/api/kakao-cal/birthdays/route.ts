import { NextRequest, NextResponse } from "next/server";
import { getKakaoAccessToken, KakaoTokenError, kakaoCalGet } from "@/features/calendar/api/kakao-mcp-client";
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

    const res = await kakaoCalGet("/friends/birthdays", token);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ birthdays: data.birthdays ?? [] });
  } catch (error) {
    if (error instanceof KakaoTokenError) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
