import { Headset, Mail, MapPin, Settings, UserRound, UserX } from "lucide-react";
import type { UserProfile } from "@/entities/common/types";
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS } from "@/features/mypage/api/profile";
import { InfoField, SectionCard } from "@/features/mypage/components/MyPageCommon";
import { REGION_DATA } from "@/shared/constants";

type ProfileEditState = {
  nickname: string;
  ageRange: string;
  gender: string;
  siDo: string;
  gunGu: string;
  newPassword: string;
  newPasswordConfirm: string;
};

function stripAllWhitespace(value: string) {
  return value.replace(/\s+/g, "");
}

export function MyPageProfileSection({
  user,
  accountTypeLabel,
  region,
  editOpen,
  verifying,
  editState,
  showPasswordLengthError,
  showPasswordMismatchError,
  saveError,
  saveSuccess,
  saving,
  isSocialAccount,
  onStartEdit,
  onCancelEdit,
  onSave,
  onStartWithdraw,
  onOpenInquiry,
  onChange,
  onBlurNewPassword,
  onBlurNewPasswordConfirm,
  onFocusNewPasswordConfirm,
  onAfterBlurNewPasswordConfirm,
  onSubmitByEnter,
}: {
  user: UserProfile;
  accountTypeLabel: string;
  region: { siDo: string; gunGu: string };
  editOpen: boolean;
  verifying: boolean;
  editState: ProfileEditState;
  showPasswordLengthError: boolean;
  showPasswordMismatchError: boolean;
  saveError: string;
  saveSuccess: string;
  saving: boolean;
  isSocialAccount: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onStartWithdraw: () => void;
  onOpenInquiry: () => void;
  onChange: (next: Partial<ProfileEditState>) => void;
  onBlurNewPassword: () => void;
  onBlurNewPasswordConfirm: () => void;
  onFocusNewPasswordConfirm: () => void;
  onAfterBlurNewPasswordConfirm: () => void;
  onSubmitByEnter: () => void;
}) {
  const handleEnterSubmit = (event: { key: string; preventDefault: () => void }) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onSubmitByEnter();
  };

  return (
    <SectionCard
      title="회원정보"
      description={`${accountTypeLabel} 계정입니다. 회원정보 수정 버튼을 눌러 정보를 변경할 수 있습니다.`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {editOpen ? (
            <>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
              >
                저장
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenInquiry}
                className="inline-flex items-center gap-2 rounded-full border border-hp-200 bg-white px-4 py-2 text-sm font-bold text-hp-700 transition hover:bg-hp-50"
              >
                <Headset size={16} />
                관리자에게 문의
              </button>
              <button
                type="button"
                onClick={onStartWithdraw}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <UserX size={16} />
                회원 탈퇴
              </button>
              <button
                type="button"
                onClick={onStartEdit}
                disabled={verifying}
                className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
              >
                회원정보 수정
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoField label="닉네임" value={user.nickname || "미등록"} icon={<UserRound size={16} />}>
          {editOpen ? (
            <input
              value={editState.nickname}
              onChange={(event) => onChange({ nickname: stripAllWhitespace(event.target.value) })}
              onBlur={(event) => onChange({ nickname: stripAllWhitespace(event.target.value) })}
              onKeyDown={handleEnterSubmit}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
            />
          ) : null}
        </InfoField>
        <InfoField label="이메일" value={user.email || "미등록"} icon={<Mail size={16} />} />
        <InfoField label="성별" value={user.gender || "미등록"} icon={<UserRound size={16} />}>
          {editOpen ? (
            <select
              value={editState.gender}
              onChange={(event) => onChange({ gender: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
            >
              <option value="">성별 선택</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
        </InfoField>
        <InfoField label="연령대" value={user.ageRange || "미등록"} icon={<Settings size={16} />}>
          {editOpen ? (
            <select
              value={editState.ageRange}
              onChange={(event) => onChange({ ageRange: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
            >
              <option value="">연령대 선택</option>
              {AGE_RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
        </InfoField>
        <InfoField label="시/도" value={region.siDo || "미등록"} icon={<MapPin size={16} />}>
          {editOpen ? (
            <select
              value={editState.siDo}
              onChange={(event) => onChange({ siDo: event.target.value, gunGu: "" })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
            >
              <option value="">시/도 선택</option>
              {Object.keys(REGION_DATA).map((siDo) => (
                <option key={siDo} value={siDo}>
                  {siDo}
                </option>
              ))}
            </select>
          ) : null}
        </InfoField>
        <InfoField label="구/군" value={region.gunGu || "미등록"} icon={<MapPin size={16} />}>
          {editOpen ? (
            <select
              value={editState.gunGu}
              onChange={(event) => onChange({ gunGu: event.target.value })}
              disabled={!editState.siDo}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500 disabled:opacity-40"
            >
              <option value="">구/군 선택</option>
              {(REGION_DATA[editState.siDo] || []).map((gunGu) => (
                <option key={gunGu} value={gunGu}>
                  {gunGu}
                </option>
              ))}
            </select>
          ) : null}
        </InfoField>
      </div>

      {editOpen && !isSocialAccount ? (
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div>
            <h4 className="text-xl font-black text-slate-950">비밀번호 변경</h4>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              type="password"
              value={editState.newPassword}
              onChange={(event) => onChange({ newPassword: event.target.value })}
              onBlur={onBlurNewPassword}
              onKeyDown={handleEnterSubmit}
              placeholder="새 비밀번호"
              minLength={8}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
            />
            <input
              type="password"
              value={editState.newPasswordConfirm}
              onChange={(event) => onChange({ newPasswordConfirm: event.target.value })}
              onFocus={onFocusNewPasswordConfirm}
              onBlur={() => {
                onAfterBlurNewPasswordConfirm();
                onBlurNewPasswordConfirm();
              }}
              onKeyDown={handleEnterSubmit}
              placeholder="새 비밀번호 확인"
              minLength={8}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
            />
          </div>

          {showPasswordLengthError ? <p className="mt-3 text-sm font-semibold text-red-500">새 비밀번호는 8자 이상이어야 합니다.</p> : null}
          {showPasswordMismatchError ? <p className="mt-3 text-sm font-semibold text-red-500">새 비밀번호가 일치하지 않습니다.</p> : null}
          {!showPasswordLengthError && !showPasswordMismatchError && saveError ? <p className="mt-3 text-sm font-semibold text-red-500">{saveError}</p> : null}
          {saveSuccess ? <p className="mt-3 text-sm font-semibold text-emerald-600">{saveSuccess}</p> : null}
        </div>
      ) : saveSuccess ? (
        <p className="mt-6 text-sm font-semibold text-emerald-600">{saveSuccess}</p>
      ) : saveError ? (
        <p className="mt-6 text-sm font-semibold text-red-500">{saveError}</p>
      ) : null}
    </SectionCard>
  );
}
