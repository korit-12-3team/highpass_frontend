import { API_BASE_URL } from "@/services/config/config";

const KAKAO_API_BASE = "https://kapi.kakao.com/v2/api/calendar";

// 백엔드에서 저장된 카카오 액세스 토큰을 가져옵니다.
export async function getKakaoAccessToken(cookieHeader: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/kakao/token`, {
    headers: { Cookie: cookieHeader },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? "카카오 토큰 조회 실패");
  }

  const data = (await res.json()) as { kakaoAccessToken: string };
  return data.kakaoAccessToken;
}

// GET 요청
export async function kakaoCalGet(path: string, token: string): Promise<Response> {
  return fetch(`${KAKAO_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// POST 요청 - 카카오 캘린더 API는 application/x-www-form-urlencoded 사용
export async function kakaoCalPost(
  path: string,
  token: string,
  paramName: string,
  payload: object
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
