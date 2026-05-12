import React, { useEffect, useState } from "react";
import { FileText, Heart, MessageSquare, MessageSquareWarning, Palette, Settings, User } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import type { UserProfile } from "@/entities/common/types";
import Avatar from "@/shared/components/common/Avatar";

type MyPageTab = "profile" | "posts" | "comments" | "likes" | "settings" | "reports";

const TAB_ITEMS: { id: MyPageTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "회원정보", icon: <User size={16} /> },
  { id: "posts", label: "내 게시물", icon: <FileText size={16} /> },
  { id: "likes", label: "좋아요", icon: <Heart size={16} /> },
  { id: "comments", label: "내 댓글", icon: <MessageSquare size={16} /> },
  { id: "reports", label: "신고/문의", icon: <MessageSquareWarning size={16} /> },
  { id: "settings", label: "설정", icon: <Settings size={16} /> },
];

function parseAvatarColor(value?: string | null): { bg: string; text: string } {
  if (value?.includes("|")) {
    const [bg, text] = value.split("|");
    return { bg: bg ?? "#4f46e5", text: text ?? "#ffffff" };
  }
  if (value?.startsWith("#")) {
    return { bg: value, text: "#ffffff" };
  }
  return { bg: "#4f46e5", text: "#ffffff" };
}

function AccountTypeBadge({ label, provider }: { label: string; provider?: string }) {
  const badge =
    provider === "KAKAO"
      ? { mark: "K", className: "border-[#FEE500] bg-[#FEE500] text-black" }
      : provider === "GOOGLE"
        ? { mark: "G", className: "border-slate-200 bg-white text-slate-700" }
        : { mark: "U", className: "border-hp-200 bg-hp-50 text-hp-700" };

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
  onAvatarColorChange,
}: {
  user: UserProfile;
  accountTypeLabel: string;
  postCount: number;
  commentCount: number;
  onAvatarColorChange?: (value: string) => Promise<void>;
}) {
  const parsed = parseAvatarColor(user.avatarVisualClassName);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [colorTab, setColorTab] = useState<"bg" | "text">("bg");
  const [bgColor, setBgColor] = useState(parsed.bg);
  const [textColor, setTextColor] = useState(parsed.text);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = parseAvatarColor(user.avatarVisualClassName);
    setBgColor(p.bg);
    setTextColor(p.text);
  }, [user.avatarVisualClassName]);

  const handleSave = async () => {
    if (!onAvatarColorChange) return;
    try {
      setSaving(true);
      await onAvatarColorChange(`${bgColor}|${textColor}`);
      setPickerOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const p = parseAvatarColor(user.avatarVisualClassName);
    setBgColor(p.bg);
    setTextColor(p.text);
    setPickerOpen(false);
  };

  const previewClass = `${bgColor}|${textColor}`;

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => onAvatarColorChange && setPickerOpen((prev) => !prev)}
              className={`relative ${onAvatarColorChange ? "cursor-pointer transition hover:opacity-90" : ""}`}
              aria-label="아바타 색상 변경"
            >
              <Avatar
                src={user.profileImage}
                name={user.nickname}
                customVisualClassName={pickerOpen ? previewClass : (user.avatarVisualClassName ?? undefined)}
                className="h-18 w-18 rounded-[24px]"
              />
              {onAvatarColorChange && (
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-hp-600 text-white shadow-sm">
                  <Palette size={13} />
                </span>
              )}
            </button>

            {pickerOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <p className="mb-3 text-xs font-bold text-slate-500">아바타 색상</p>

                <div className="mb-3 flex overflow-hidden rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setColorTab("bg")}
                    className={`flex-1 py-1.5 text-xs font-bold transition ${colorTab === "bg" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    배경색
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorTab("text")}
                    className={`flex-1 py-1.5 text-xs font-bold transition ${colorTab === "text" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    글자색
                  </button>
                </div>

                <HexColorPicker
                  color={colorTab === "bg" ? bgColor : textColor}
                  onChange={colorTab === "bg" ? setBgColor : setTextColor}
                  style={{ width: "100%", height: "160px" }}
                />

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-hp-600 py-2 text-xs font-bold text-white hover:bg-hp-700 disabled:opacity-60"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            )}
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
        const count = item.id === "profile" || item.id === "settings" ? null : counts[item.id];

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              active
                ? "bg-hp-600 text-white"
                : "border border-hp-200 bg-white text-hp-700 hover:bg-hp-50"
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