"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { createReport, type CreateReportInput } from "@/features/reports/api/reports";

type ReportReasonOption = {
  value: string;
  label: string;
};

const REPORT_REASON_OPTIONS: Record<CreateReportInput["targetType"], ReportReasonOption[]> = {
  user: [
    { value: "harassment", label: "괴롭힘 및 혐오 표현" },
    { value: "spam", label: "스팸 또는 광고" },
    { value: "impersonation", label: "사칭 계정" },
    { value: "inappropriate_profile", label: "부적절한 프로필" },
    { value: "other", label: "기타" },
  ],
  post: [
    { value: "abuse", label: "욕설 또는 혐오 표현" },
    { value: "spam", label: "도배 또는 광고" },
    { value: "fraud", label: "사기 또는 허위 정보" },
    { value: "sexual_content", label: "음란 또는 부적절한 내용" },
    { value: "other", label: "기타" },
  ],
  comment: [
    { value: "abuse", label: "욕설 또는 혐오 표현" },
    { value: "spam", label: "도배 또는 광고" },
    { value: "harassment", label: "괴롭힘 또는 분쟁 유도" },
    { value: "sexual_content", label: "음란 또는 부적절한 내용" },
    { value: "other", label: "기타" },
  ],
  chat: [
    { value: "harassment", label: "괴롭힘 또는 협박" },
    { value: "spam", label: "광고 또는 도배" },
    { value: "fraud", label: "사기 또는 외부 유도" },
    { value: "sexual_content", label: "음란 또는 부적절한 대화" },
    { value: "other", label: "기타" },
  ],
  inquiry: [
    { value: "account", label: "계정 및 로그인" },
    { value: "board", label: "게시판 및 커뮤니티" },
    { value: "chat", label: "채팅 및 신고" },
    { value: "service", label: "서비스 이용 문의" },
    { value: "other", label: "기타" },
  ],
};

type ReportDialogProps = {
  isOpen: boolean;
  targetType: CreateReportInput["targetType"];
  targetId: string;
  title: string;
  subtitle: string;
  description?: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export default function ReportDialog({
  isOpen,
  targetType,
  targetId,
  title,
  subtitle,
  description = "신고 내용은 관리자에게 전달되며 운영 검토에 사용됩니다.",
  onClose,
  onSubmitted,
}: ReportDialogProps) {
  const reasonOptions = useMemo(
    () => REPORT_REASON_OPTIONS[targetType],
    [targetType],
  );
  const [reasonCode, setReasonCode] = useState(reasonOptions[0]?.value ?? "other");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setReasonCode(reasonOptions[0]?.value ?? "other");
    setDetail("");
    setSubmitting(false);
  }, [isOpen, reasonOptions]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const trimmedDetail = detail.trim();
    if (trimmedDetail.length < 10) {
      toast.error("신고 내용은 10자 이상 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await createReport({
        targetType,
        targetId,
        reasonCode,
        detail: trimmedDetail,
      });
      toast.success("신고가 접수되었습니다.");
      onSubmitted?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "신고 접수에 실패했습니다.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-rose-400">
              <AlertTriangle size={13} />
              Report
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {subtitle}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              신고 사유
            </label>
            <select
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-rose-300"
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              상세 설명
            </label>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              rows={6}
              maxLength={500}
              placeholder="관리자가 상황을 이해할 수 있도록 구체적으로 적어 주세요. 최소 10자 이상 입력해 주세요."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 outline-none transition focus:border-rose-300"
            />
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
              <span>최소 10자</span>
              <span>{detail.length}/500</span>
            </div>
          </div>
        </div>

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
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
          >
            {submitting ? "접수 중..." : "신고 접수"}
          </button>
        </div>
      </div>
    </div>
  );
}
