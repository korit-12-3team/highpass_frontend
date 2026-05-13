"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, MapPin, MessageSquare, User2, Users, X } from "lucide-react";
import type { UserProfile } from "@/entities/common/types";
import ReportDialog from "@/features/reports/components/ReportDialog";
import Avatar from "@/shared/components/common/Avatar";
import { DEFAULT_AVATAR_VISUAL_CLASS } from "@/shared/utils/avatar-custom";

interface ProfileModalProps {
  profile: UserProfile;
  loading?: boolean;
  isOpen: boolean;
  isCurrentUser: boolean;
  onOpenEdit: () => void;
  onClose: () => void;
  onStartChat: () => void;
}

export default function ProfileModal({
  profile,
  loading,
  isOpen,
  isCurrentUser,
  onOpenEdit,
  onClose,
  onStartChat,
}: ProfileModalProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const isDeleted =
    profile.status?.toLowerCase() === "deleted" || profile.nickname === "탈퇴한 계정";
  const activeAvatarClass = isDeleted
    ? DEFAULT_AVATAR_VISUAL_CLASS
    : profile.avatarVisualClassName || DEFAULT_AVATAR_VISUAL_CLASS;

  const lastSeenLabel = useMemo(() => {
    if (profile.online) return "접속 중";
    if (profile.lastSeenAt) {
      return `마지막 접속 ${profile.lastSeenAt.split("T")[0]}`;
    }
    return "마지막 접속 정보 없음";
  }, [profile.lastSeenAt, profile.online]);

  if (!isOpen) return null;

  if (reportModalOpen && !isDeleted) {
    return (
      <ReportDialog
        isOpen={reportModalOpen}
        targetType="user"
        targetId={profile.id}
        title={`${profile.nickname}님을 신고할까요?`}
        subtitle="프로필, 행동, 대화 태도 등 신고 사유를 선택해 주세요."
        onClose={() => setReportModalOpen(false)}
        onSubmitted={() => setReportModalOpen(false)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-24 bg-hp-600">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/30 p-1 text-white hover:bg-white/40"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative px-6 pb-6 text-center">
          <Avatar
            src={isDeleted ? null : profile.profileImage}
            name={profile.nickname}
            customVisualClassName={activeAvatarClass}
            className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white text-2xl shadow-sm"
          />

          {loading && (
            <div className="pt-14">
              <p className="text-xs text-slate-400">프로필 정보를 불러오는 중입니다.</p>
            </div>
          )}

          <div className="flex flex-col items-center pt-14">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              {profile.nickname}
              {!isDeleted && profile.name && profile.name !== profile.nickname ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                  {profile.name}
                </span>
              ) : null}
            </h3>

            <div className="mt-4 flex w-full flex-col gap-2 text-left text-sm text-slate-600">
              {isDeleted ? (
                <p className="flex items-center justify-center gap-2 text-slate-500">
                  탈퇴 처리된 계정입니다.
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        profile.online ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    {lastSeenLabel}
                  </p>
                  {profile.email ? (
                    <p className="flex items-center gap-2">
                      <User2 size={16} />
                      {profile.email}
                    </p>
                  ) : null}
                  {profile.ageRange || profile.gender ? (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="shrink-0" />
                      <span>
                        {[profile.ageRange, profile.gender].filter(Boolean).join(" / ")}
                      </span>
                    </div>
                  ) : null}
                  {profile.location ? (
                    <p className="flex items-center gap-2">
                      <MapPin size={16} />
                      {profile.location}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {isCurrentUser ? (
              <button
                onClick={onOpenEdit}
                className="mt-6 w-full rounded-xl bg-hp-600 py-2.5 font-bold text-white transition-colors hover:bg-hp-700"
              >
                마이페이지로 이동
              </button>
            ) : isDeleted ? (
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-xl bg-slate-100 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                닫기
              </button>
            ) : (
              <div className="mt-6 flex w-full gap-2">
                <button
                  onClick={onStartChat}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-hp-600 py-2.5 font-bold text-white"
                >
                  <MessageSquare size={18} />
                  1:1 채팅하기
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-bold text-rose-600 transition hover:bg-rose-100"
                >
                  <AlertTriangle size={17} />
                  신고
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
