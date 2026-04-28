"use client";

import { useEffect, useState } from "react";
import { Headset, X } from "lucide-react";
import { toast } from "sonner";
import { createReport, createSupportInquiry } from "@/features/reports/api/reports";

const CATEGORY_OPTIONS = [
  { value: "account", label: "계정" },
  { value: "board", label: "게시판 및 커뮤니티" },
  { value: "service", label: "서비스 이용 문의" },
  { value: "other", label: "기타" },
];

type SupportInquiryModalProps = {
  open: boolean;
  submitting: boolean;
  requireEmail?: boolean;
  initialEmail?: string;
  onSubmittingChange: (value: boolean) => void;
  onClose: () => void;
};

export function SupportInquiryModal({
  open,
  submitting,
  requireEmail = false,
  initialEmail = "",
  onSubmittingChange,
  onClose,
}: SupportInquiryModalProps) {
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [email, setEmail] = useState(initialEmail);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory(CATEGORY_OPTIONS[0].value);
    setEmail(initialEmail);
    setTitle("");
    setContent("");
  }, [initialEmail, open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (requireEmail && !trimmedEmail) {
      toast.error("가입한 이메일을 입력해 주세요.");
      return;
    }

    if (!trimmedTitle) {
      toast.error("문의 제목을 입력해 주세요.");
      return;
    }

    if (trimmedContent.length < 10) {
      toast.error("문의 내용은 10자 이상 입력해 주세요.");
      return;
    }

    try {
      onSubmittingChange(true);

      if (requireEmail) {
        await createSupportInquiry({
          email: trimmedEmail,
          title: trimmedTitle,
          reasonCode: category,
          detail: trimmedContent,
        });
      } else {
        await createReport({
          targetType: "inquiry",
          targetId: "support",
          targetLabel: trimmedTitle,
          reasonCode: category,
          detail: trimmedContent,
        });
      }

      toast.success("문의가 관리자에게 전달되었습니다.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "문의 접수에 실패했습니다.",
      );
      onSubmittingChange(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              관리자에게 문의하기
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              계정 상태, 로그인 문제, 게시판 불편 사항을 관리자에게 직접 문의할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {requireEmail ? (
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                가입 이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="정지 또는 탈퇴 처리된 계정의 이메일"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-hp-300"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              문의 분류
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-hp-300"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
            
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              문의 제목
            </label>
            {requireEmail ? (
              <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="예: 정지 계정 해제 문의"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-hp-300"
            />
          ) : <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="예: 버그 관련 문의"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-hp-300"
            />}
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              문의 내용
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={7}
              maxLength={2000}
              placeholder="상황을 확인할 수 있도록 구체적으로 적어 주세요. 최소 10자 이상 입력해 주세요."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 outline-none transition focus:border-hp-300"
            />
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
              <span>최소 10자</span>
              <span>{content.length}/2000</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
          >
            작성
          </button>
        </div>
      </div>
    </div>
  );
}
