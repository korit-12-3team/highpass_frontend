"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthShell from "@/features/auth/components/AuthShell";
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, createUserProfile } from "@/features/mypage/api/profile";
import { useApp } from "@/shared/context/AppContext";
import { REGION_DATA } from "@/shared/constants";
import { fetchCurrentUserProfile } from "@/services/auth/auth";
import { API_BASE_URL } from "@/services/config/config";

interface SignupFormProps {
  isSocialSignup: boolean;
  socialSignupData?: {
    email: string;
    provider: string;
    providerId: string;
    nickname: string;
  };
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

const EMAIL_DOMAIN_OPTIONS = [
  "naver.com",
  "gmail.com",
  "daum.net",
  "hanmail.net",
  "nate.com",
  "kakao.com",
] as const;
const MIN_PASSWORD_LENGTH = 8;

function splitEmailParts(value: string) {
  const [localPart = "", domain = ""] = value.split("@");
  return { localPart, domain };
}

function stripAllWhitespace(value: string) {
  return value.replace(/\s+/g, "");
}

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

export default function SignupForm({ isSocialSignup, socialSignupData }: SignupFormProps) {
  const { isAuthenticated, authReady, handleAuthSuccess } = useApp();
  const router = useRouter();

  const socialEmail = socialSignupData?.email ?? "";
  const socialProvider = socialSignupData?.provider ?? "";
  const socialProviderId = socialSignupData?.providerId ?? "";
  const initialEmailParts = splitEmailParts(isSocialSignup ? socialEmail : "");

  const [emailLocalPart, setEmailLocalPart] = useState(initialEmailParts.localPart);
  const [emailDomain, setEmailDomain] = useState(
    EMAIL_DOMAIN_OPTIONS.includes(initialEmailParts.domain as (typeof EMAIL_DOMAIN_OPTIONS)[number])
      ? initialEmailParts.domain
      : "",
  );
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [passwordConfirmBlurred, setPasswordConfirmBlurred] = useState(false);
  const [passwordConfirmFocused, setPasswordConfirmFocused] = useState(false);
  const [nickname, setNickname] = useState(stripAllWhitespace(socialSignupData?.nickname ?? ""));
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
  const isPasswordTooShort = useMemo(
    () => !isSocialSignup && password.length > 0 && password.length < MIN_PASSWORD_LENGTH,
    [isSocialSignup, password],
  );
  const showPasswordTooShort = passwordBlurred && isPasswordTooShort;
  const showPasswordMismatch = passwordConfirmBlurred && !passwordConfirmFocused && isPasswordMismatch;
  const sanitizedNickname = useMemo(() => stripAllWhitespace(nickname), [nickname]);
  const email = useMemo(() => {
    if (isSocialSignup) return socialEmail;
    const localPart = emailLocalPart.trim();
    const domain = emailDomain.trim();
    return localPart && domain ? `${localPart}@${domain}` : "";
  }, [emailDomain, emailLocalPart, isSocialSignup, socialEmail]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    router.replace("/calendar");
  }, [authReady, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordBlurred(true);
    setPasswordConfirmBlurred(true);

    if (!sanitizedNickname) {
      setError("닉네임을 입력해 주세요.");
      return;
    }

    if (isPasswordMismatch) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isSocialSignup && password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
      return;
    }

    if (isSocialSignup && (!socialEmail || !socialProvider || !socialProviderId)) {
      setError("소셜 회원가입 정보가 올바르지 않습니다. 다시 시도해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isSocialSignup ? `${API_BASE_URL}/api/oauth2/signup` : `${API_BASE_URL}/api/auth/signup`;
      const payload = isSocialSignup
        ? {
            email: socialEmail,
            nickname: sanitizedNickname,
            ageRange,
            gender,
            siDo,
            gunGu,
            provider: socialProvider,
            providerId: socialProviderId,
          }
        : {
            email,
            password,
            nickname: sanitizedNickname,
            ageRange,
            gender,
            siDo,
            gunGu,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let payloadResponse: SignupApiResponse | null = null;
      try {
        payloadResponse = (await response.json()) as SignupApiResponse;
      } catch {
        payloadResponse = null;
      }

      if (!response.ok) {
        setError(payloadResponse?.message || "회원가입에 실패했습니다.");
        return;
      }

      handleAuthSuccess((await fetchCurrentUserProfile()) ?? mapSignupResponseToUser(payloadResponse ?? {}));
      toast.success("회원가입이 완료되었습니다.");
      router.replace(payloadResponse?.redirectUrl || "/calendar");
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="회원가입"
      subtitle={isSocialSignup ? "소셜 계정 인증이 완료되었습니다. 추가 정보를 입력해 주세요." : "계정을 생성해 주세요."}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSocialSignup ? (
          <div className="rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">{socialEmail || "이메일 정보를 가져오지 못했습니다."}</p>
            <p className="mt-1 text-xs text-slate-500">이메일과 비밀번호는 소셜 계정 인증값을 사용합니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(140px,180px)] gap-2">
            <input
              type="text"
              value={emailLocalPart}
              onChange={(e) => setEmailLocalPart(stripAllWhitespace(e.target.value))}
              placeholder="email"
              className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
              required
            />
            <div className="flex items-center justify-center text-slate-500">@</div>
            <select
              value={emailDomain}
              onChange={(e) => setEmailDomain(e.target.value)}
              className="appearance-none rounded-xl border border-hp-200 bg-hp-50 px-3 py-3 text-slate-800 outline-none focus:border-hp-500"
              required
            >
              <option value="">선택</option>
              {EMAIL_DOMAIN_OPTIONS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isSocialSignup ? (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onBlur={() => setPasswordBlurred(true)}
              placeholder="비밀번호"
              minLength={MIN_PASSWORD_LENGTH}
              className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
              required
            />
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                setError("");
              }}
              onFocus={() => setPasswordConfirmFocused(true)}
              onBlur={() => {
                setPasswordConfirmFocused(false);
                setPasswordConfirmBlurred(true);
              }}
              placeholder="비밀번호 확인"
              minLength={MIN_PASSWORD_LENGTH}
              className="w-full rounded-xl border border-hp-200 bg-hp-50 px-4 py-3 text-slate-800 outline-none focus:border-hp-500"
              required
            />
          </>
        ) : null}

        <input
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(stripAllWhitespace(e.target.value));
            setError("");
          }}
          onBlur={() => setNickname((prev) => stripAllWhitespace(prev))}
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

        {error || showPasswordMismatch || showPasswordTooShort ? (
          <p className="text-sm text-red-500">
            {showPasswordMismatch
              ? "비밀번호가 일치하지 않습니다."
              : showPasswordTooShort
                ? `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`
                : error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={
            loading ||
            isPasswordMismatch ||
            !sanitizedNickname ||
            !ageRange ||
            !gender ||
            !siDo ||
            !gunGu ||
            (isSocialSignup && (!socialEmail || !socialProvider || !socialProviderId)) ||
            (!isSocialSignup && !email) ||
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
