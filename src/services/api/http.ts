"use client";

import axios from "axios";
import { API_BASE_URL } from "@/services/config/config";
import { notifyAuthExpired, refreshAccessToken } from "@/services/auth/auth";

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
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      notifyAuthExpired();
      return Promise.reject(error);
    }

    return http(originalRequest);
  },
);
