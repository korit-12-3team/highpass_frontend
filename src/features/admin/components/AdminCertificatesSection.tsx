import { RefreshCw } from "lucide-react";

export function AdminCertificatesSection({
  totalSchedules,
  syncing,
  syncMessage,
  syncError,
  onSync,
}: {
  totalSchedules: number;
  syncing: boolean;
  syncMessage: string;
  syncError: string;
  onSync: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">자격증 일정 갱신</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            저장된 자격증 일정 데이터를 최신 기준으로 다시 갱신합니다.
          </p>
          <p className="mt-4 text-sm font-bold text-slate-700">
            현재 저장 건수: <span className="text-slate-950">{totalSchedules}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-hp-200 bg-white px-4 py-2.5 text-sm font-black text-hp-700 transition hover:bg-hp-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
          {syncing ? "갱신 중..." : "자격증 일정 갱신"}
        </button>
      </div>

      {syncMessage ? (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {syncMessage}
        </div>
      ) : null}

      {syncError ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {syncError}
        </div>
      ) : null}
    </section>
  );
}
