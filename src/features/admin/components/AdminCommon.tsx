import type { ReactNode } from "react";
import type { AdminUser, ApiStatus, PostStatus, ReportStatus, UserStatus } from "@/features/admin/types";

export const userStatusLabel: Record<UserStatus, string> = {
  active: "정상",
  suspended: "정지",
  deleted: "탈퇴",
};

export const postStatusLabel: Record<PostStatus, string> = {
  visible: "공개",
  hidden: "숨김",
  deleted: "삭제",
};

export const reportStatusLabel: Record<ReportStatus, string> = {
  pending: "대기",
  resolved: "처리",
  dismissed: "반려",
};

export function statusClass(status: UserStatus | PostStatus | ReportStatus) {
  if (status === "active" || status === "visible" || status === "resolved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === "suspended" || status === "hidden" || status === "pending") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

export function formatDateOnly(value: string) {
  if (!value) return "";
  return value.split("T")[0].split(" ")[0];
}

export function getLoginTypeLabel(user: AdminUser) {
  if (user.loginType === "social" || user.socialProvider) {
    return user.socialProvider ? `소셜회원 (${user.socialProvider})` : "소셜회원";
  }
  return "일반회원";
}

export function getLastSeenLabel(user: AdminUser) {
  if (user.online) return "접속 중";
  if (user.lastSeenAt) return user.lastSeenAt.replace("T", " ").slice(0, 16);
  return "기록 없음";
}

export function AdminStat({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase text-slate-400">{label}</p>
        <span className="text-hp-600">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export function ApiNotice({ status, label }: { status: ApiStatus; label: string }) {
  if (status === "ready") return null;

  const message =
    status === "loading"
      ? `${label} API를 호출하는 중입니다.`
      : status === "unavailable"
        ? `${label} API를 불러오지 못했습니다.`
        : `${label} API 연결 상태를 확인하기 전입니다.`;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
      {message}
    </div>
  );
}

export function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}
