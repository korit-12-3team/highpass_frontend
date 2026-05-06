"use client";

import { useEffect, useState } from "react";
import { CircleHelp, Clock3, MessageSquareWarning, MessagesSquare } from "lucide-react";
import { listMyReports, type MyReport } from "@/features/reports/api/my-reports";
import { EmptyState, SectionCard } from "@/features/mypage/components/MyPageCommon";

const STATUS_LABEL: Record<MyReport["status"], string> = {
  pending: "대기",
  resolved: "처리완료",
  dismissed: "반려",
};

const STATUS_CLASS: Record<MyReport["status"], string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  dismissed: "bg-slate-100 text-slate-600 ring-slate-200",
};

const TARGET_TYPE_LABEL: Record<MyReport["targetType"], string> = {
  user: "회원",
  post: "게시글",
  comment: "댓글",
  chat: "채팅",
  inquiry: "문의",
};

function formatDate(value?: string) {
  if (!value) return "";
  return value.replace("T", " ").slice(0, 16);
}

function ReportCard({ report }: { report: MyReport }) {
  const [expanded, setExpanded] = useState(false);
  const isInquiry = report.targetType === "inquiry";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${STATUS_CLASS[report.status]}`}>
              {STATUS_LABEL[report.status]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
              {isInquiry ? "[문의]" : `[신고] - ${TARGET_TYPE_LABEL[report.targetType]}`}
            </span>
          </div>
          <p className="mt-2 truncate font-black text-slate-950">{report.targetLabel}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">{formatDate(report.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="shrink-0 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50"
        >
          {expanded ? "접기" : "상세 보기"}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {isInquiry ? "문의 내용" : "신고 내용"}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {report.reason}
            </p>
          </div>

          {report.adminResponse ? (
            <div className="rounded-lg border border-hp-200 bg-hp-50 p-4">
              <div className="flex items-center gap-2">
                <MessagesSquare size={14} className="text-hp-600" />
                <p className="text-xs font-black uppercase tracking-wide text-hp-600">관리자 답변</p>
                {report.respondedAt ? (
                  <span className="text-xs font-semibold text-hp-400">{formatDate(report.respondedAt)}</span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {report.adminResponse}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm font-semibold text-slate-400">아직 답변이 등록되지 않았습니다.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function MyPageReportsSection() {
  const [reports, setReports] = useState<MyReport[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    void listMyReports()
      .then((items) => {
        if (cancelled) return;
        setReports(items);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SectionCard
      title="신고 및 문의 내역"
      description="제출한 신고와 문의 내역 및 관리자 답변을 확인할 수 있습니다."
    >
      {status === "loading" ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <Clock3 size={28} className="mx-auto text-slate-400" />
          <p className="mt-4 text-sm font-semibold text-slate-400">내역을 불러오는 중입니다.</p>
        </div>
      ) : status === "error" ? (
        <div className="rounded-[24px] border border-dashed border-rose-200 bg-rose-50 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-rose-500">내역을 불러오지 못했습니다.</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning size={24} />}
          title="신고 및 문의 내역이 없습니다."
          description="신고 또는 문의를 접수하면 여기서 처리 상태와 답변을 확인할 수 있습니다."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
