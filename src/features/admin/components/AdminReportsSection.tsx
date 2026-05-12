import { useMemo, useState } from "react";
import { CircleHelp, Clock3, MessageSquareWarning, MessagesSquare, X } from "lucide-react";
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

function reporterLabel(report: AdminReport) {
  return report.reporter?.name || report.reporter?.email || "알 수 없음";
}

function reportTitle(report: AdminReport) {
  if (report.targetType === "chat" && report.chatDetail?.roomName) {
    return report.chatDetail.roomName;
  }
  return report.targetLabel;
}

function chatRoomTypeBadge(report: AdminReport) {
  if (report.targetType !== "chat") return null;
  const roomType = report.chatDetail?.roomType;
  const label = roomType === "GROUP" ? "그룹 채팅방" : "1:1 채팅방";
  const cls = roomType === "GROUP"
    ? "bg-violet-50 text-violet-700"
    : "bg-sky-50 text-sky-700";
  return { label, cls };
}

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

function reportKindLabel(report: AdminReport) {
  return report.targetType === "inquiry" ? "[문의]" : "[신고]";
}

function reportKindIcon(report: AdminReport) {
  return report.targetType === "inquiry" ? <CircleHelp size={18} /> : <MessageSquareWarning size={18} />;
}

function reportKindTone(report: AdminReport) {
  return report.targetType === "inquiry"
    ? {
        badge: "bg-sky-50 text-sky-700",
        icon: "bg-sky-50 text-sky-700",
      }
    : {
        badge: "bg-rose-50 text-rose-700",
        icon: "bg-rose-50 text-rose-700",
      };
}

function targetNickname(report: AdminReport): string | undefined {
  switch (report.targetType) {
    case "user": return report.userDetail?.nickname;
    case "post": return report.postDetail?.author;
    case "comment": return report.commentDetail?.author;
    case "chat": return report.chatDetail?.partner?.nickname;
    default: return undefined;
  }
}

function targetEmail(report: AdminReport): string | undefined {
  switch (report.targetType) {
    case "user": return report.userDetail?.email;
    case "chat": return report.chatDetail?.partner?.email;
    case "inquiry": return report.inquiryDetail?.accountEmail;
    default: return undefined;
  }
}

export function AdminReportsSection({
  reports,
  onUpdateReportStatus,
  onUpdatePostStatus,
  onUpdateUserStatus,
}: {
  reports: AdminReport[];
  onUpdateReportStatus: (reportId: string, status: ReportStatus, message?: string) => void;
  onUpdatePostStatus: (postId: string, status: PostStatus) => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
}) {
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  const reportsByStatus = useMemo(
    () => ({
      pending: reports.filter((report) => report.status === "pending"),
      processed: reports.filter((report) => report.status === "resolved" || report.status === "dismissed"),
    }),
    [reports],
  );

  return (
    <>
      <div className="space-y-4">
        <ReportStatusSection
          title="대기"
          description="확인이 필요한 신고 및 문의입니다."
          reports={reportsByStatus.pending}
          emptyMessage="대기 중인 신고/문의가 없습니다."
          onSelectReport={setSelectedReport}
        />
        <ReportStatusSection
          title="처리"
          description="승인 또는 반려로 처리된 신고 및 문의입니다."
          reports={reportsByStatus.processed}
          emptyMessage="처리된 신고/문의가 없습니다."
          onSelectReport={setSelectedReport}
        />
      </div>

      {selectedReport ? (
        <AdminReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateReportStatus={onUpdateReportStatus}
          onUpdatePostStatus={onUpdatePostStatus}
          onUpdateUserStatus={onUpdateUserStatus}
        />
      ) : null}
    </>
  );
}

function ReportStatusSection({
  title,
  description,
  reports,
  emptyMessage,
  onSelectReport,
}: {
  title: string;
  description: string;
  reports: AdminReport[];
  emptyMessage: string;
  onSelectReport: (report: AdminReport) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock3 size={16} className="text-slate-500" />
          <h3 className="text-base font-black text-slate-950">{title}</h3>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
      </div>

      {reports.length === 0 ? (
        <div className="p-8 text-center text-sm font-semibold text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">대상</th>
                <th className="px-4 py-3">내용</th>
                <th className="px-4 py-3">작성자</th>
                <th className="w-[110px] px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report) => {
                const tone = reportKindTone(report);

                return (
                  <tr
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="cursor-pointer bg-white transition hover:bg-amber-50/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                          {reportKindIcon(report)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            <span className={`mr-2 rounded-full px-2 py-0.5 text-[11px] ${tone.badge}`}>
                              {report.targetType === "inquiry"
                                ? reportKindLabel(report)
                                : `${reportKindLabel(report)} - ${targetTypeLabel(report.targetType)}`}
                            </span>
                            {(() => {
                              const badge = chatRoomTypeBadge(report);
                              return badge ? (
                                <span className={`mr-1.5 rounded-full px-2 py-0.5 text-[11px] font-black ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              ) : null;
                            })()}
                            {reportTitle(report)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatAdminReportDate(report.createdAt)}
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
                      {reporterLabel(report)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(report.status)}`}
                      >
                        {reportStatusLabel[report.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AdminReportDetailModal({
  report,
  onClose,
  onUpdateReportStatus,
  onUpdatePostStatus,
  onUpdateUserStatus,
}: {
  report: AdminReport;
  onClose: () => void;
  onUpdateReportStatus: (reportId: string, status: ReportStatus, message?: string) => void;
  onUpdatePostStatus: (postId: string, status: PostStatus) => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
}) {
  const [responseDraft, setResponseDraft] = useState(report.adminResponse ?? "");
  const tone = reportKindTone(report);
  const editable = report.status === "pending";
  const hasResponse = responseDraft.trim().length > 0;

  const handleUpdateStatus = (status: ReportStatus) => {
    if (!hasResponse) return;
    onUpdateReportStatus(report.id, status, responseDraft.trim());
    onClose(); 
  };

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
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone.badge}`}>
                {report.targetType === "inquiry"
                  ? reportKindLabel(report)
                  : `${reportKindLabel(report)} - ${targetTypeLabel(report.targetType)}`}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(report.status)}`}
              >
                {reportStatusLabel[report.status]}
              </span>
            </div>
            <h3 className="mt-3 break-words text-2xl font-black text-slate-950">
              {(() => {
                const badge = chatRoomTypeBadge(report);
                return badge ? (
                  <span className={`mr-2 rounded-full px-2.5 py-1 text-sm font-black ${badge.cls}`}>
                    {badge.label}
                  </span>
                ) : null;
              })()}
              {reportTitle(report)}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              작성자 {reporterLabel(report)} · {formatAdminReportDate(report.createdAt)}
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
            {(() => {
              const nickname = targetNickname(report);
              const email = targetEmail(report);
              if (!nickname && !email) {
                return <InfoCard label="대상 ID" value={report.targetId} />;
              }
              return (
                <>
                  {nickname ? <InfoCard label="닉네임" value={nickname} /> : null}
                  {email ? <InfoCard label="이메일" value={email} /> : null}
                </>
              );
            })()}
          </div>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-black text-slate-950">신고/문의 내용</h4>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {report.reason}
            </p>
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <MessagesSquare size={15} className="text-slate-500" />
              <h4 className="text-sm font-black text-slate-950">관리자 답변</h4>
              {report.respondedAt ? (
                <span className="text-xs font-semibold text-slate-400">
                  {formatAdminReportDate(report.respondedAt)} 전송됨
                </span>
              ) : null}
            </div>
            <textarea
              value={responseDraft}
              onChange={(event) => setResponseDraft(event.target.value)}
              rows={4}
              maxLength={2000}
              readOnly={!editable}
              placeholder="사용자에게 전달할 답변을 입력하세요."
              className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-hp-300 focus:bg-white focus:outline-none read-only:text-slate-500"
            />
            <p className="mt-1 text-right text-xs font-semibold text-slate-400">
              {responseDraft.length} / 2000
            </p>
          </section>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
          {report.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => handleUpdateStatus("dismissed")}
                disabled={!hasResponse}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                반려
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus("resolved")}
                disabled={!hasResponse}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                승인
              </button>
            </>
          ) : null}
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
