export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL!;
const configuredApiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/backend").replace(/\/$/, "");
const apiProxyPath = (process.env.NEXT_PUBLIC_API_PROXY_PATH || "/backend").replace(/\/$/, "");
const apiBaseUrlIsAbsolute = /^https?:\/\//i.test(configuredApiBaseUrl);
const useApiProxy = process.env.NEXT_PUBLIC_USE_API_PROXY !== "false";
export const KAKAO_MAP_APPKEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APPKEY ?? "";
export const BACKEND_ORIGIN = apiBaseUrlIsAbsolute
  ? new URL(configuredApiBaseUrl).origin
  : (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || configuredApiBaseUrl).replace(/\/$/, "");
export const API_BASE_URL = useApiProxy && typeof window !== "undefined" ? apiProxyPath : BACKEND_ORIGIN;
export const CHAT_API_BASE_URL = useApiProxy && typeof window !== "undefined" ? apiProxyPath : BACKEND_ORIGIN;
export const STOMP_ENDPOINT_URL = `${BACKEND_ORIGIN}/ws-stomp`;
