import { useState } from "react";
import { MessageSquareWarning, X } from "lucide-react";
import type {
  AdminReport,
  PostStatus,
  ReportStatus,
  UserStatus,
} from "@/features/admin/types";
import {
  reportStatusLabel,
  statusClass,
} from "@/features/admin/components/AdminCommon";

function targetTypeLabel(targetType: AdminReport["targetType"]) {
  switch (targetType) {
    case "post":
      return "게시글";
    case "comment":
      return "댓글";
    case "chat":
      return "채팅";
    case "inquiry":
      return "문의";
    case "user":
    default:
      return "회원";
  }
}

export function AdminReportsSection({
  reports,
  onUpdateReportStatus,
  onUpdatePostStatus,
  onUpdateUserStatus,
}: {
  reports: AdminReport[];
  onUpdateReportStatus: (reportId: string, status: ReportStatus) => void;
  onUpdatePostStatus: (postId: string, status: PostStatus) => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
}) {
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-black text-slate-950">신고 및 문의 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">대상</th>
                <th className="px-4 py-3">내용</th>
                <th className="px-4 py-3">작성자</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="cursor-pointer bg-white transition hover:bg-amber-50/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <MessageSquareWarning size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">
                          {report.targetLabel}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {targetTypeLabel(report.targetType)} · {formatAdminReportDate(report.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">
                    <p className="line-clamp-2 whitespace-pre-wrap break-words">
                      {report.reason}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">
                    {report.reporter}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(report.status)}`}
                    >
                      {reportStatusLabel[report.status]}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateReportStatus(report.id, "resolved")}
                        disabled={report.status === "resolved"}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        처리완료
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateReportStatus(report.id, "dismissed")}
                        disabled={report.status === "dismissed"}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        반려
                      </button>
                      {report.targetType === "post" ? (
                        <button
                          type="button"
                          onClick={() => onUpdatePostStatus(report.targetId, "hidden")}
                          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                        >
                          게시글 숨김
                        </button>
                      ) : report.targetType === "user" ? (
                        <button
                          type="button"
                          onClick={() => onUpdateUserStatus(report.targetId, "suspended")}
                          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                        >
                          회원 정지
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReport ? (
        <AdminReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      ) : null}
    </>
  );
}

function AdminReportDetailModal({
  report,
  onClose,
}: {
  report: AdminReport;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                {targetTypeLabel(report.targetType)}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(report.status)}`}
              >
                {reportStatusLabel[report.status]}
              </span>
            </div>
            <h3 className="mt-3 break-words text-2xl font-black text-slate-950">
              {report.targetLabel}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              작성자 {report.reporter} · {formatAdminReportDate(report.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard label="대상 유형" value={targetTypeLabel(report.targetType)} />
            <InfoCard label="대상 ID" value={report.targetId} />
          </div>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-black text-slate-950">신고/문의 내용</h4>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {report.reason}
            </p>
          </section>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function formatAdminReportDate(value?: string) {
  if (!value) return "날짜 없음";
  return value.replace("T", " ").slice(0, 16);
}
