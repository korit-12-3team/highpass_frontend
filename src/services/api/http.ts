"use client";

import axios from "axios";
import { API_BASE_URL } from "@/services/config/config";
import { notifyAuthExpired, refreshAccessToken } from "@/services/auth/auth";
import { ApiError } from "@/shared/errors";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const requestUrl = String(originalRequest?.url ?? "");

    const shouldSkipRefresh =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/signup") ||
      requestUrl.includes("/api/auth/logout") ||
      requestUrl.includes("/api/auth/refresh");

    if (status !== 401 || !originalRequest || originalRequest._retry || shouldSkipRefresh) {
      if (status === 401 && shouldSkipRefresh) notifyAuthExpired();
      return Promise.reject(toApiError(error));
    }

    originalRequest._retry = true;
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      notifyAuthExpired();
      return Promise.reject(toApiError(error));
    }

    return http(originalRequest);
  },
);

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | null;
    return new ApiError(data?.message || "요청에 실패했습니다.");
  }
  return new ApiError("요청에 실패했습니다.");
}
