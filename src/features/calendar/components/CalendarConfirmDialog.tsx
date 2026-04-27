import { ConfirmDialogState } from "@/features/calendar/types";

type CalendarConfirmDialogProps = {
  dialog: ConfirmDialogState;
  onClose: () => void;
  onConfirm: () => void;
};

export function CalendarConfirmDialog({ dialog, onClose, onConfirm }: CalendarConfirmDialogProps) {
  if (!dialog) return null;

  const confirmClass =
    dialog.tone === "danger"
      ? "bg-red-500 text-white hover:bg-red-600"
      : "bg-hp-600 text-white hover:bg-hp-700";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Confirm</p>
        <h3 className="mt-2 text-xl font-black text-slate-950">{dialog.title}</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{dialog.message}</p>
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
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${confirmClass}`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
