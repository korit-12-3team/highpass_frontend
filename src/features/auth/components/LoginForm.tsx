"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Headset, Loader2 } from "lucide-react";
import AuthShell from "@/features/auth/components/AuthShell";
import { useApp } from "@/shared/context/AppContext";
import { fetchCurrentUserProfile } from "@/services/auth/auth";
import { API_BASE_URL } from "@/services/config/config";
import { createUserProfile } from "@/features/mypage/api/profile";
import { SupportInquiryModal } from "@/features/support/components/SupportInquiryModal";

type LoginApiResponse = {
  id?: string | number;
  userId?: string | number;
  email?: string;
  nickname?: string;
  ageRange?: string;
  gender?: string;
  siDo?: string;
  gunGu?: string;
  role?: string;
  redirectUrl?: string;
  message?: string;
};

function mapLoginResponseToUser(payload: LoginApiResponse) {
  const id = payload.userId ?? payload.id ?? "";
  const nickname = payload.nickname || (payload.email ? payload.email.split("@")[0] : "me");
  const location = [payload.siDo, payload.gunGu].filter(Boolean).join(" ");

  return createUserProfile({
    id: String(id),
    email: payload.email,
    nickname,
    name: nickname,
    ageRange: payload.ageRange,
    gender: payload.gender,
    location,
    role: payload.role || "USER",
    profileImage: null,
    loginType: "local",
  });
}

function stripAllWhitespace(value: string) {
  return value.replace(/\s+/g, "");
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
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    void (async () => {
      const user = await fetchCurrentUserProfile().catch(() => null);
      router.replace(user?.role === "ADMIN" ? "/admin" : "/calendar");
    })();
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

      const user = (await fetchCurrentUserProfile()) ?? mapLoginResponseToUser(payload ?? {});
      handleAuthSuccess(user);
      router.replace(payload?.redirectUrl || "/calendar");
    } catch {
      setError("서버에 연결할 수 없습니다. API 주소 또는 서버 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="로그인" subtitle="계정으로 로그인해 주세요">
      <form onSubmit={handleLocalLogin} className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          <p className="font-black">임시 관리자 계정</p>
          <p className="mt-1">아이디: admin@highpass.local</p>
          <p>비밀번호: Admin1234!</p>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(stripAllWhitespace(e.target.value))}
          placeholder="이메일"
          className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
          required
        />

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button type="submit" className="w-full rounded-xl bg-hp-600 py-3.5 font-bold text-white">
          {loading ? "..." : "로그인"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative mb-4 flex items-center py-2">
          <div className="flex-grow border-t border-hp-200"></div>
          <span className="mx-4 flex-shrink-0 text-xs font-medium text-hp-400">또는</span>
          <div className="flex-grow border-t border-hp-200"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setGoogleLoading(true);
              window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
            }}
            disabled={googleLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-hp-100 bg-white py-2.5 text-sm font-bold text-slate-800 transition-colors hover:bg-hp-50 disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
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
            onClick={() => {
              setKakaoLoading(true);
              window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
            }}
            disabled={kakaoLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#FDD800] disabled:opacity-60"
          >
            {kakaoLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
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
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-sm font-black text-slate-900">정지 또는 탈퇴 계정 문의</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          로그인할 수 없는 계정이라면 가입한 이메일로 관리자에게 직접 문의할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={() => {
            setInquirySubmitting(false);
            setInquiryOpen(true);
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-hp-200 bg-white px-4 py-2 text-sm font-bold text-hp-700 transition hover:bg-hp-50"
        >
          <Headset size={15} />
          계정 문의하기
        </button>
      </div>
      <SupportInquiryModal
        open={inquiryOpen}
        submitting={inquirySubmitting}
        requireEmail
        initialEmail={email}
        onSubmittingChange={setInquirySubmitting}
        onClose={() => {
          if (inquirySubmitting) return;
          setInquiryOpen(false);
          setInquirySubmitting(false);
        }}
      />
    </AuthShell>
  );
}
