import React from "react";

export function MyPagePasswordModal({
  open,
  password,
  error,
  checking,
  onChangePassword,
  onClose,
  onConfirm,
}: {
  open: boolean;
  password: string;
  error: string;
  checking: boolean;
  onChangePassword: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div>
          <h3 className="mt-2 text-2xl font-black text-slate-950">비밀번호 확인</h3>
          <p className="mt-2 text-sm text-slate-500">현재 비밀번호 확인 후 회원정보를 수정할 수 있습니다.</p>
        </div>

        <div className="mt-5">
          <input
            type="password"
            value={password}
            onChange={(event) => onChangePassword(event.target.value)}
            placeholder="현재 비밀번호"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
          />
        </div>

        {error ? <p className="mt-3 text-sm font-semibold text-red-500">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={checking}
            className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
          >
            {checking ? "확인 중..." : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
