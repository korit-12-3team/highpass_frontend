import React from "react";
import { FileText, Heart, MessageSquare, Settings, User } from "lucide-react";
import type { UserProfile } from "@/entities/common/types";

type MyPageTab = "profile" | "posts" | "comments" | "likes" | "settings";

const TAB_ITEMS: { id: MyPageTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "회원정보", icon: <User size={16} /> },
  { id: "posts", label: "내 게시물", icon: <FileText size={16} /> },
  { id: "comments", label: "내 댓글", icon: <MessageSquare size={16} /> },
  { id: "likes", label: "좋아요", icon: <Heart size={16} /> },
  { id: "settings", label: "설정", icon: <Settings size={16} /> },
];

function AccountTypeBadge({ label, provider }: { label: string; provider?: string }) {
  const badge =
    provider === "KAKAO"
      ? { mark: "K", className: "border-[#FEE500] bg-[#FEE500] text-black" }
      : provider === "GOOGLE"
        ? { mark: "G", className: "border-slate-200 bg-white text-slate-700" }
        : { mark: "✓", className: "border-hp-200 bg-hp-50 text-hp-700" };

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-black ${badge.className}`}>
        {badge.mark}
      </span>
      {label}
    </span>
  );
}

export function MyPageHeader({
  user,
  accountTypeLabel,
  postCount,
  commentCount,
}: {
  user: UserProfile;
  accountTypeLabel: string;
  postCount: number;
  commentCount: number;
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-[24px] bg-slate-900 px-6 py-5 text-3xl font-black text-white">
            {user.nickname.substring(0, 1)}
          </div>
          <div className="min-w-0">
            <h2 className="mt-2 truncate text-3xl font-black text-slate-950">{user.nickname}</h2>
            <p className="mt-2 text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AccountTypeBadge label={accountTypeLabel} provider={user.socialProvider} />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            게시물 {postCount}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            댓글 {commentCount}
          </span>
        </div>
      </div>
    </section>
  );
}

export function MyPageTabNav({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: MyPageTab;
  counts: Partial<Record<Exclude<MyPageTab, "profile">, number>>;
  onChange: (tab: MyPageTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAB_ITEMS.map((item) => {
        const active = item.id === activeTab;
        const count = (item.id === "profile" || item.id === "settings")? null : counts[item.id];

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              active ? "bg-hp-600 text-white" : "border border-hp-200 bg-white text-hp-700 hover:bg-hp-50"
            }`}
          >
            {item.icon}
            {item.label}
            {count != null ? (
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
