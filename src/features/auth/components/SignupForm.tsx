"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/features/auth/components/AuthShell";
import { useApp } from "@/shared/context/AppContext";
import { fetchCurrentUserProfile } from "@/services/auth/auth";
import { API_BASE_URL } from "@/services/config/config";
import { REGION_DATA } from "@/shared/constants";
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, createUserProfile } from "@/features/mypage/api/profile";

interface SignupFormProps {
  isSocialSignup: boolean;
}

type SignupApiResponse = {
  id?: string | number;
  userId?: string | number;
  email?: string;
  nickname?: string;
  ageRange?: string;
  gender?: string;
  siDo?: string;
  gunGu?: string;
  redirectUrl?: string;
  message?: string;
};

function mapSignupResponseToUser(payload: SignupApiResponse) {
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
    profileImage: null,
    loginType: "local",
  });
}

export default function SignupForm({ isSocialSignup }: SignupFormProps) {
  const { isAuthenticated, authReady, handleAuthSuccess } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState(isSocialSignup ? "social-user@example.com" : "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [siDo, setSiDo] = useState("");
  const [gunGu, setGunGu] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPasswordMismatch = useMemo(
    () => !isSocialSignup && passwordConfirm.length > 0 && password !== passwordConfirm,
    [isSocialSignup, password, passwordConfirm],
  );

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    router.replace("/calendar");
  }, [authReady, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPasswordMismatch) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (isSocialSignup) {
      setError("소셜 회원가입은 아직 준비 중입니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          nickname,
          ageRange,
          gender,
          siDo,
          gunGu,
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

      handleAuthSuccess((await fetchCurrentUserProfile()) ?? mapSignupResponseToUser(payload ?? {}));
      router.replace(payload?.redirectUrl || "/calendar");
    } catch {
      setError("서버에 연결할 수 없습니다. API 주소 또는 서버 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="회원가입" subtitle={isSocialSignup ? "소셜 회원가입" : "계정을 생성해 주세요"}>
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

        {!isSocialSignup ? (
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
        ) : null}

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
            value={siDo}
            onChange={(e) => {
              setSiDo(e.target.value);
              setGunGu("");
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
            value={gunGu}
            onChange={(e) => setGunGu(e.target.value)}
            disabled={!siDo}
            className="appearance-none rounded-xl border border-hp-200 bg-hp-50 px-3 py-3 text-slate-800 outline-none focus:border-hp-500 disabled:opacity-40"
            required
          >
            <option value="">구/군 선택</option>
            {(REGION_DATA[siDo] || []).map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs text-slate-600">연령대</p>
          <div className="grid grid-cols-5 gap-1.5">
            {AGE_RANGE_OPTIONS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setAgeRange(item)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  ageRange === item ? "bg-hp-600 text-white" : "border border-hp-200 bg-white text-slate-600 hover:border-hp-400"
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
            {GENDER_OPTIONS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setGender(item)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  gender === item ? "bg-hp-600 text-white" : "border border-hp-200 bg-white text-slate-600 hover:border-hp-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {(error || isPasswordMismatch) ? (
          <p className="text-sm text-red-500">{isPasswordMismatch ? "비밀번호가 일치하지 않습니다." : error}</p>
        ) : null}

        <button
          type="submit"
          disabled={
            loading ||
            isPasswordMismatch ||
            !email ||
            !nickname ||
            !ageRange ||
            !gender ||
            !siDo ||
            !gunGu ||
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
