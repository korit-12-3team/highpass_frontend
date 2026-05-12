import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/services/config/config";

const KAKAO_API_BASE = "https://kapi.kakao.com/v2/api/calendar";
const KAKAO_CALENDAR_CONNECT_URL = `${API_BASE_URL}/oauth2/authorization/kakao-calendar`;

export class KakaoTokenError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "KakaoTokenError";
    Object.setPrototypeOf(this, KakaoTokenError.prototype);
  }
}

export function isKakaoTokenError(error: unknown): error is KakaoTokenError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "KakaoTokenError" &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

export function buildKakaoTokenErrorResponse(error: KakaoTokenError) {
  return NextResponse.json(
    { message: error.message, connectUrl: KAKAO_CALENDAR_CONNECT_URL },
    { status: error.status },
  );
}

export function buildKakaoApiErrorResponse(status: number, data: unknown, fallback = "카카오 API 오류") {
  const body = (data ?? {}) as { msg?: string; message?: string; code?: number };
  const responseBody: Record<string, unknown> = {
    message: body.msg ?? body.message ?? fallback,
    code: body.code,
  };
  if (status === 401 || status === 403) {
    responseBody.connectUrl = KAKAO_CALENDAR_CONNECT_URL;
  }
  return NextResponse.json(responseBody, { status });
}

export async function getKakaoAccessToken(cookieHeader: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/kakao/token`, {
    headers: { Cookie: cookieHeader },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new KakaoTokenError(
      (body as { message?: string }).message ?? "카카오 토큰 조회 실패",
      res.status,
    );
  }

  const data = (await res.json()) as { kakaoAccessToken: string };
  return data.kakaoAccessToken;
}

export async function kakaoCalGet(path: string, token: string): Promise<Response> {
  return fetch(`${KAKAO_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function kakaoCalPost(
  path: string,
  token: string,
  paramName: string,
  payload: object,
): Promise<Response> {
  const body = new URLSearchParams();
  body.set(paramName, JSON.stringify(payload));

  return fetch(`${KAKAO_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
}
