import { MessageSquareWarning } from "lucide-react";
import type { AdminReport, PostStatus, ReportStatus, UserStatus } from "@/features/admin/types";
import { reportStatusLabel, statusClass } from "@/features/admin/components/AdminCommon";

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
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-black text-slate-950">신고 목록</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">신고 대상</th>
              <th className="px-4 py-3">사유</th>
              <th className="px-4 py-3">신고자</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3 text-right">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <MessageSquareWarning size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{report.targetLabel}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {report.targetType === "post" ? "게시글" : "회원"} · {report.createdAt}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-600">{report.reason}</td>
                <td className="px-4 py-3 font-semibold text-slate-600">{report.reporter}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(report.status)}`}>
                    {reportStatusLabel[report.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onUpdateReportStatus(report.id, "resolved")} disabled={report.status === "resolved"} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                      처리완료
                    </button>
                    <button type="button" onClick={() => onUpdateReportStatus(report.id, "dismissed")} disabled={report.status === "dismissed"} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                      반려
                    </button>
                    {report.targetType === "post" ? (
                      <button type="button" onClick={() => onUpdatePostStatus(report.targetId, "hidden")} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100">
                        게시글 숨김
                      </button>
                    ) : (
                      <button type="button" onClick={() => onUpdateUserStatus(report.targetId, "suspended")} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100">
                        회원 정지
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

