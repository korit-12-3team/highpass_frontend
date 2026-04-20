export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL!;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
export const BACKEND_ORIGIN = new URL(API_BASE_URL).origin;
export const CHAT_API_BASE_URL = BACKEND_ORIGIN;
export const STOMP_ENDPOINT_URL = `${BACKEND_ORIGIN}/ws-stomp`;
