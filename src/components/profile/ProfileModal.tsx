"use client";

import { MapPin, MessageSquare, User2, Users, X } from "lucide-react";
import type { UserProfile } from "@/lib/types";

interface ProfileModalProps {
  profile: UserProfile;
  loading?: boolean;
  error?: string;
  isOpen: boolean;
  isCurrentUser: boolean;
  onOpenEdit: () => void;
  onClose: () => void;
  onStartChat: () => void;
}

export default function ProfileModal({
  profile,
  loading,
  error,
  isOpen,
  isCurrentUser,
  onOpenEdit,
  onClose,
  onStartChat,
}: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
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
          <div className="absolute left-1/2 top-0 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-hp-100 bg-white text-2xl font-bold text-hp-600 shadow-sm">
            {profile.nickname.substring(0, 1) || "U"}
          </div>

          {(loading || error) && (
            <div className="pt-14">
              {loading && <p className="text-xs text-slate-400">프로필 정보를 불러오는 중입니다.</p>}
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
          )}

          <div className="flex flex-col items-center pt-14">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              {profile.nickname}
              {profile.name && profile.name !== profile.nickname ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                  {profile.name}
                </span>
              ) : null}
            </h3>

            <div className="mt-4 flex w-full flex-col gap-2 text-sm text-slate-600">
              {profile.email ? (
                <p className="flex items-center gap-2">
                  <User2 size={16} />
                  {profile.email}
                </p>
              ) : null}
              {profile.ageRange ? (
                <p className="flex items-center gap-2">
                  <Users size={16} />
                  {profile.ageRange}
                </p>
              ) : null}
              {profile.gender ? (
                <p className="flex items-center gap-2">
                  <Users size={16} />
                  {profile.gender}
                </p>
              ) : null}
              {profile.location ? (
                <p className="flex items-center gap-2">
                  <MapPin size={16} />
                  {profile.location}
                </p>
              ) : null}
            </div>

            {isCurrentUser ? (
              <button
                onClick={onOpenEdit}
                className="mt-6 w-full rounded-xl bg-hp-600 py-2.5 font-bold text-white transition-colors hover:bg-hp-700"
              >
                마이페이지로 이동
              </button>
            ) : (
              <button
                onClick={onStartChat}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-hp-600 py-2.5 font-bold text-white"
              >
                <MessageSquare size={18} />
                1:1 채팅하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
