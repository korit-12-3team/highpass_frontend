"use client";

const KAKAO_WAIT_TIMEOUT_MS = 5000;
const KAKAO_WAIT_INTERVAL_MS = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForKakaoServices(timeoutMs = KAKAO_WAIT_TIMEOUT_MS) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const services = (window as typeof window & {
      kakao?: {
        maps?: {
          services?: unknown;
        };
      };
    }).kakao?.maps?.services;

    if (services) {
      return services as {
        Places: new () => {
          keywordSearch: (
            keyword: string,
            callback: (data: any[], status: string) => void,
          ) => void;
        };
        Status: {
          OK: string;
        };
      };
    }

    await sleep(KAKAO_WAIT_INTERVAL_MS);
  }

  throw new Error("지도 스크립트를 불러오지 못했습니다. 앱키와 카카오 도메인 설정을 확인해 주세요.");
}
