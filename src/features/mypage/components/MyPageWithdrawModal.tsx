const CONFIRM_TEXT = "회원탈퇴";

export function MyPageWithdrawModal({
  open,
  value,
  error,
  submitting,
  onChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  value: string;
  error: string;
  submitting: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mt-2 text-xl font-black text-slate-950">회원 탈퇴</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          탈퇴 처리 후 계정은 로그인할 수 없으며, 작성한 게시글과 댓글의 작성자는 탈퇴한 계정으로 표시됩니다.
        </p>
        <p className="mt-4 text-sm font-bold text-slate-800">
          계속하려면 아래 입력창에 <span className="text-rose-600">{CONFIRM_TEXT}</span>를 입력해 주세요.
        </p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={CONFIRM_TEXT}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-rose-400"
        />
        {error ? <p className="mt-3 text-sm font-semibold text-rose-500">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting || value !== CONFIRM_TEXT}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "처리 중..." : "탈퇴 처리"}
          </button>
        </div>
      </div>
    </div>
  );
}
