"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { useApp, UserProfile } from "@/lib/AppContext";
import { API_BASE_URL } from "@/lib/config";

type LoginApiResponse = {
  id?: string | number;
  userId?: string | number;
  email?: string;
  nickname?: string;
  redirectUrl?: string;
  message?: string;
};

function mapLoginResponseToUser(payload: LoginApiResponse): UserProfile {
  const numericUserId = payload.userId ?? payload.id;
  const nickname = payload.nickname || (payload.email ? payload.email.split("@")[0] : "me");

  return {
    id: numericUserId == null ? "" : String(numericUserId),
    email: payload.email,
    nickname,
    name: nickname,
    ageGroup: "미등록",
    gender: "미등록",
    location: "미등록",
    profileImage: null,
    loginType: "local",
  };
}

export default function LoginForm() {
  const { handleAuthSuccess, isAuthenticated, authReady } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    router.replace("/calendar");
  }, [authReady, isAuthenticated, router]);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let payload: LoginApiResponse | null = null;
      try {
        payload = (await response.json()) as LoginApiResponse;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setError(payload?.message || "로그인에 실패했습니다.");
        return;
      }

      const user = mapLoginResponseToUser(payload ?? {});
      if (!/^\d+$/.test(String(user.id).trim())) {
        setError('로그인에 성공했지만 서버가 숫자 "userId"를 내려주지 않았습니다.');
        return;
      }

      handleAuthSuccess(user);
      router.replace(payload?.redirectUrl || "/calendar");
    } catch {
      setError("서버에 연결할 수 없습니다. API 주소 또는 서버 상태를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  const handleKakaoLogin = () => {
    setKakaoLoading(true);
    window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
  };

  return (
    <AuthShell title="로그인" subtitle="계정으로 로그인하세요">
      <form onSubmit={handleLocalLogin} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" className="w-full bg-hp-600 text-white font-bold py-3.5 rounded-xl">
          {loading ? "..." : "로그인"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative flex items-center py-2 mb-4">
          <div className="flex-grow border-t border-hp-200"></div>
          <span className="flex-shrink-0 mx-4 text-hp-400 text-xs font-medium">또는</span>
          <div className="flex-grow border-t border-hp-200"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-hp-50 border border-hp-100 font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {googleLoading ? "이동 중..." : "Google"}
          </button>

          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={kakaoLoading}
            className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD800] disabled:opacity-60 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
          >
            {kakaoLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.52 5.44c-.16.48.32.88.72.64l6.32-4.24c.48.08 1.04.08 1.52.08 6.96 0 12.64-4.48 12.64-10.08S22.96 4.64 16 4.64z" />
              </svg>
            )}
            {kakaoLoading ? "이동 중..." : "카카오"}
          </button>
        </div>
      </div>

      <div className="mt-5 text-center text-sm">
        <Link href="/signup?provider=false" className="text-hp-400 hover:text-hp-600">
          회원가입
        </Link>
      </div>
    </AuthShell>
  );
}
