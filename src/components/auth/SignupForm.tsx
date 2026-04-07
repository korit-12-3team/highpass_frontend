"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { useApp, UserProfile } from "@/lib/AppContext";
import { API_BASE_URL } from "@/lib/config";
import { REGION_DATA } from "@/lib/constants";

interface SignupFormProps {
  isSocialSignup: boolean;
}

type SignupApiResponse = {
  userId?: string | number;
  email?: string;
  nickname?: string;
  redirectUrl?: string;
  message?: string;
};

function mapSignupResponseToUser(
  payload: SignupApiResponse | null,
  fallback: {
    email: string;
    nickname: string;
    ageGroup: string;
    gender: string;
    sido: string;
    sigungu: string;
  },
): UserProfile {
  return {
    id: String(payload?.userId ?? fallback.email),
    email: payload?.email ?? fallback.email,
    nickname: payload?.nickname ?? fallback.nickname,
    name: payload?.nickname ?? fallback.nickname,
    ageGroup: fallback.ageGroup,
    gender: fallback.gender,
    location: `${fallback.sido} ${fallback.sigungu}`.trim(),
    profileImage: null,
    loginType: "local",
  };
}

export default function SignupForm({ isSocialSignup }: SignupFormProps) {
  const { isAuthenticated, handleAuthSuccess } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState(isSocialSignup ? "social-user@example.com" : "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPasswordMismatch =
    !isSocialSignup && passwordConfirm.length > 0 && password !== passwordConfirm;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/calendar");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPasswordMismatch) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");

    if (isSocialSignup) {
      setLoading(false);
      setError("소셜 회원가입 API 연결 후 활성화됩니다.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          nickname,
          ageRange: ageGroup,
          gender,
          siDo: sido,
          gunGu: sigungu,
        }),
      });

      let payload: SignupApiResponse | null = null;
      try {
        payload = (await response.json()) as SignupApiResponse;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setError(payload?.message || "회원가입에 실패했습니다.");
        return;
      }

      const user = mapSignupResponseToUser(payload, {
        email,
        nickname,
        ageGroup,
        gender,
        sido,
        sigungu,
      });

      handleAuthSuccess(user);
      router.replace(payload?.redirectUrl || "/calendar");
    } catch {
      setError("서버에 연결할 수 없습니다. API 주소와 서버 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="회원가입"
      subtitle={isSocialSignup ? "소셜 회원가입 초기 세팅" : "일반 회원가입"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          disabled={isSocialSignup}
          className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500 disabled:opacity-60"
          required
        />

        {!isSocialSignup && (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
              required
            />
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
              required
            />
          </>
        )}

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
          required
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={sido}
            onChange={(e) => {
              setSido(e.target.value);
              setSigungu("");
            }}
            className="appearance-none rounded-xl border border-hp-200 bg-hp-50 px-3 py-3 text-slate-800 outline-none focus:border-hp-500"
            required
          >
            <option value="">시/도 선택</option>
            {Object.keys(REGION_DATA).map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <select
            value={sigungu}
            onChange={(e) => setSigungu(e.target.value)}
            disabled={!sido}
            className="appearance-none rounded-xl border border-hp-200 bg-hp-50 px-3 py-3 text-slate-800 outline-none focus:border-hp-500 disabled:opacity-40"
            required
          >
            <option value="">시/군/구 선택</option>
            {(REGION_DATA[sido] || []).map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs text-slate-600">연령대</p>
          <div className="grid grid-cols-5 gap-1.5">
            {["10대", "20대", "30대", "40대", "50대+"].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setAgeGroup(item)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  ageGroup === item
                    ? "bg-hp-600 text-white"
                    : "border border-hp-200 bg-white text-slate-600 hover:border-hp-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-slate-600">성별</p>
          <div className="grid grid-cols-2 gap-1.5">
            {["M", "F"].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setGender(item)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  gender === item
                    ? "bg-hp-600 text-white"
                    : "border border-hp-200 bg-white text-slate-600 hover:border-hp-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-5">
          {(error || isPasswordMismatch) && (
            <p className="text-sm text-red-500">
              {isPasswordMismatch ? "비밀번호가 일치하지 않습니다." : error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            isPasswordMismatch ||
            !email ||
            !nickname ||
            !ageGroup ||
            !gender ||
            !sido ||
            !sigungu ||
            (!isSocialSignup && !password)
          }
          className="w-full rounded-xl bg-hp-600 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "..." : "회원가입"}
        </button>
      </form>

      <div className="mt-5 text-center text-sm">
        <Link href="/login" className="text-hp-400 hover:text-hp-600">
          로그인으로 돌아가기
        </Link>
      </div>
    </AuthShell>
  );
}
