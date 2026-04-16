import { Mail, MapPin, Settings, ShieldCheck, UserRound } from "lucide-react";
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS } from "@/lib/profile";
import { REGION_DATA } from "@/lib/constants";
import type { UserProfile } from "@/lib/types";
import { InfoField, SectionCard } from "@/features/mypage/components/MyPageCommon";

type ProfileEditState = {
  nickname: string;
  ageRange: string;
  gender: string;
  siDo: string;
  gunGu: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export function MyPageProfileSection({
  user,
  accountTypeLabel,
  region,
  editOpen,
  verifying,
  editState,
  saveError,
  saveSuccess,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onChange,
}: {
  user: UserProfile;
  accountTypeLabel: string;
  region: { siDo: string; gunGu: string };
  editOpen: boolean;
  verifying: boolean;
  editState: ProfileEditState;
  saveError: string;
  saveSuccess: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onChange: (next: Partial<ProfileEditState>) => void;
}) {
  return (
    <SectionCard
      title="회원정보"
      description="기본 정보를 확인하고, 비밀번호 확인 후 필요한 항목만 수정할 수 있습니다."
    >
      <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h4 className="mt-3 text-2xl font-black text-slate-950">{user.nickname}</h4>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Mail size={15} className="text-hp-600" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={15} className="text-hp-600" />
                {accountTypeLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editOpen ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  수정 취소
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "정보 저장"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartEdit}
                disabled={verifying}
                className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
              >
                {verifying ? "확인 중..." : "회원정보 수정"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoField label="닉네임" value={user.nickname || "미등록"} icon={<UserRound size={16} />}>
            {editOpen ? (
              <input
                value={editState.nickname}
                onChange={(event) => onChange({ nickname: event.target.value })}
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
      </div>

      {editOpen ? (
        <div className="mt-6 rounded-[24px] border border-hp-200 bg-hp-50/70 p-4">
          <div>
            <p className="text-sm font-bold text-slate-900">프로필 정보를 직접 수정하고 바로 저장할 수 있습니다.</p>
            <p className="mt-1 text-sm text-slate-500">새 비밀번호는 선택 입력이며, 비워두면 변경하지 않습니다.</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">New Password</p>
              <input
                type="password"
                value={editState.newPassword}
                onChange={(event) => onChange({ newPassword: event.target.value })}
                placeholder="새 비밀번호"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
              />
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Confirm Password</p>
              <input
                type="password"
                value={editState.newPasswordConfirm}
                onChange={(event) => onChange({ newPasswordConfirm: event.target.value })}
                placeholder="새 비밀번호 확인"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
              />
            </div>
          </div>

          {saveError ? <p className="mt-3 text-sm font-semibold text-red-500">{saveError}</p> : null}
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
