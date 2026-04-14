"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Clock3,
  FileText,
  Heart,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useApp, type BoardPost, type PostComment } from "@/lib/AppContext";
import { listComments } from "@/lib/comments";
import { REGION_DATA } from "@/lib/constants";
import { getUserProfile, updateUserPassword, updateUserProfile } from "@/lib/profile";

type MyPageTab = "profile" | "posts" | "comments" | "likes";

type MyCommentItem = {
  comment: PostComment;
  post: BoardPost;
};

const TAB_ITEMS: { id: MyPageTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "회원정보", icon: <Settings size={16} /> },
  { id: "posts", label: "내 게시물", icon: <FileText size={16} /> },
  { id: "comments", label: "내 댓글", icon: <MessageSquare size={16} /> },
  { id: "likes", label: "좋아요", icon: <Heart size={16} /> },
];

const AGE_RANGE_OPTIONS = ["10대", "20대", "30대", "40대", "50대+"];
const GENDER_OPTIONS = ["남", "여"];

function inferRegionFromLocation(location?: string) {
  const normalized = (location || "").trim();
  if (!normalized) return { siDo: "", gunGu: "" };

  for (const [siDo, gunGuList] of Object.entries(REGION_DATA)) {
    if (!normalized.includes(siDo)) continue;
    const matchedGunGu = gunGuList.find((gunGu) => normalized.includes(gunGu)) || "";
    return { siDo, gunGu: matchedGunGu };
  }

  return { siDo: "", gunGu: "" };
}

function formatDate(value?: string) {
  if (!value) return "날짜 정보 없음";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-6">
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-hp-600 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-base font-bold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {/*
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">VERIFY</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">비밀번호 확인</h3>
              <p className="mt-2 text-sm text-slate-500">현재 비밀번호가 맞으면 기존 회원정보 카드가 바로 입력창으로 바뀝니다.</p>
            </div>

            <div className="mt-5">
              <input
                type="password"
                value={profilePasswordDraft}
                onChange={(event) => setProfilePasswordDraft(event.target.value)}
                placeholder="현재 비밀번호"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
              />
            </div>

            {profileSaveError ? <p className="mt-3 text-sm font-semibold text-red-500">{profileSaveError}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfilePasswordModalOpen(false);
                  setProfilePasswordDraft("");
                  setProfileSaveError("");
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmProfileEdit()}
                disabled={profilePasswordChecking}
                className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
              >
                {profilePasswordChecking ? "확인 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>

      {profilePasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">VERIFY</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">비밀번호 확인</h3>
              <p className="mt-2 text-sm text-slate-500">현재 비밀번호가 맞으면 기존 회원정보 카드가 바로 입력창으로 바뀝니다.</p>
            </div>

            <div className="mt-5">
              <input
                type="password"
                value={profilePasswordDraft}
                onChange={(event) => setProfilePasswordDraft(event.target.value)}
                placeholder="현재 비밀번호"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
              />
            </div>

            {profileSaveError ? <p className="mt-3 text-sm font-semibold text-red-500">{profileSaveError}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfilePasswordModalOpen(false);
                  setProfilePasswordDraft("");
                  setProfileSaveError("");
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmProfileEdit()}
                disabled={profilePasswordChecking}
                className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
              >
                {profilePasswordChecking ? "확인 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      */}
    </div>
  );
}

function InfoField({
  label,
  value,
  icon,
  children,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        {icon ? <span className="text-hp-600">{icon}</span> : null}
        {children ?? <p className="text-base font-bold text-slate-900">{value}</p>}
      </div>
    </div>
  );
}

function PostList({ posts, onOpenPost }: { posts: BoardPost[]; onOpenPost: (post: BoardPost) => void }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={24} />}
        title="작성한 게시물이 없습니다"
        description="자유게시판이나 스터디 모집 게시판에 글을 작성하면 여기서 바로 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <button
          key={`${post.type}-${post.id}`}
          type="button"
          onClick={() => onOpenPost(post)}
          className="block w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-hp-300 hover:shadow-md"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                post.type === "study" ? "bg-hp-100 text-hp-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              {post.type === "study" ? "스터디 모집" : "자유게시판"}
            </span>
            {post.cert ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{post.cert}</span> : null}
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock3 size={12} />
              {formatDate(post.createdAt)}
            </span>
          </div>

          <h4 className="mt-3 text-lg font-black text-slate-950">{post.title}</h4>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{post.content}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
            <span>조회수 {post.views}</span>
            <span>좋아요 {post.likes}</span>
            <span>댓글 {post.comments.length}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function CommentList({ items, onOpenPost }: { items: MyCommentItem[]; onOpenPost: (post: BoardPost) => void }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={24} />}
        title="작성한 댓글이 없습니다"
        description="게시물에 댓글을 남기면 어떤 글에 남겼는지 여기서 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map(({ comment, post }) => (
        <button
          key={`${post.type}-${post.id}-${comment.id}`}
          type="button"
          onClick={() => onOpenPost(post)}
          className="block w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-hp-300 hover:shadow-md"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                post.type === "study" ? "bg-hp-100 text-hp-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              {post.type === "study" ? "스터디 모집" : "자유게시판"}
            </span>
            <span className="text-xs font-semibold text-slate-400">{formatDate(comment.createdAt)}</span>
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">COMMENTED POST</p>
          <h4 className="mt-1 text-base font-black text-slate-900">{post.title}</h4>
          <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            {comment.text}
          </p>
        </button>
      ))}
    </div>
  );
}

export default function MyPageClient() {
  const { currentUser, boardData, setCurrentUser } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<MyPageTab>("profile");
  const [hydratedPosts, setHydratedPosts] = useState<BoardPost[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [profileUser, setProfileUser] = useState(currentUser);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profilePasswordModalOpen, setProfilePasswordModalOpen] = useState(false);
  const [profilePasswordDraft, setProfilePasswordDraft] = useState("");
  const [profilePasswordChecking, setProfilePasswordChecking] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editAgeRange, setEditAgeRange] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editSiDo, setEditSiDo] = useState("");
  const [editGunGu, setEditGunGu] = useState("");
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordSaveError, setPasswordSaveError] = useState("");
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (requestedTab === "profile" || requestedTab === "posts" || requestedTab === "comments" || requestedTab === "likes") {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (activeTab === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", activeTab);
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [activeTab, pathname, router, searchParams]);

  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const latestProfile = await getUserProfile(currentUser.id);
        if (!cancelled) {
          setProfileUser(latestProfile ?? currentUser);
        }
      } catch {
        if (!cancelled) {
          setProfileUser(currentUser);
        }
      }
    };

    setProfileUser(currentUser);
    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    const hydrateComments = async () => {
      if (boardData.length === 0) {
        setHydratedPosts([]);
        return;
      }

      setCommentsLoading(true);

      try {
        const postsWithComments = await Promise.all(
          boardData.map(async (post) => {
            try {
              const comments = await listComments(post.type === "study" ? "STUDY" : "FREE", post.id);
              return { ...post, comments };
            } catch {
              return post;
            }
          }),
        );

        if (!cancelled) {
          setHydratedPosts(postsWithComments);
        }
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    };

    void hydrateComments();

    return () => {
      cancelled = true;
    };
  }, [boardData, currentUser]);

  const displayUser = profileUser ?? currentUser;
  const visiblePosts = hydratedPosts.length > 0 ? hydratedPosts : boardData;
  const regionFromProfile = useMemo(() => inferRegionFromLocation(displayUser?.location), [displayUser?.location]);

  useEffect(() => {
    if (!displayUser) return;

    setEditNickname(displayUser.nickname || "");
    setEditAgeRange(displayUser.ageRange || "");
    setEditGender(displayUser.gender || "");
    setEditSiDo(regionFromProfile.siDo);
    setEditGunGu(regionFromProfile.gunGu);
  }, [displayUser, regionFromProfile.gunGu, regionFromProfile.siDo]);

  const myPosts = useMemo(
    () =>
      visiblePosts
        .filter((post) => post.authorId === displayUser?.id)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [displayUser?.id, visiblePosts],
  );

  const likedPosts = useMemo(
    () =>
      visiblePosts
        .filter((post) => post.likedByUser)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [visiblePosts],
  );

  const myComments = useMemo(() => {
    if (!displayUser) return [];

    return visiblePosts
      .flatMap((post) =>
        post.comments
          .filter((comment) => comment.author === displayUser.nickname)
          .map((comment) => ({ comment, post })),
      )
      .sort((a, b) => String(b.comment.createdAt).localeCompare(String(a.comment.createdAt)));
  }, [displayUser, visiblePosts]);

  if (!currentUser) return null;

  const resetEditFields = () => {
    setEditNickname(displayUser?.nickname || "");
    setEditAgeRange(displayUser?.ageRange || "");
    setEditGender(displayUser?.gender || "");
    setEditSiDo(regionFromProfile.siDo);
    setEditGunGu(regionFromProfile.gunGu);
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setProfileSaveError("");
    setProfileSaveSuccess("");
    setPasswordSaveError("");
    setPasswordSaveSuccess("");
    setProfilePasswordDraft("");
  };

  const openBoardPost = (post: BoardPost) => {
    const boardPath = post.type === "study" ? "/study" : "/free";
    const returnTo = activeTab === "profile" ? pathname : `${pathname}?tab=${encodeURIComponent(activeTab)}`;
    router.push(`${boardPath}/${encodeURIComponent(post.id)}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const saveProfile = async () => {
    if (!currentUser) return;

    const password = currentPassword.trim();
    const nickname = editNickname.trim();
    const ageRange = editAgeRange.trim();
    const gender = editGender.trim();
    const siDo = editSiDo.trim();
    const gunGu = editGunGu.trim();
    const nextPassword = newPassword.trim();
    const confirmPassword = newPasswordConfirm.trim();

    if (!password) {
      setProfileSaveError("현재 비밀번호를 입력해 주세요.");
      setProfileSaveSuccess("");
      return;
    }

    if (!nickname || !ageRange || !gender || !siDo || !gunGu) {
      setProfileSaveError("닉네임, 연령대, 성별, 지역을 모두 입력해 주세요.");
      setProfileSaveSuccess("");
      return;
    }

    if ((nextPassword || confirmPassword) && nextPassword !== confirmPassword) {
      setProfileSaveError("?덈줈??鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎.");
      setProfileSaveSuccess("");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileSaveError("");
      setProfileSaveSuccess("");

      const updated = await updateUserProfile(currentUser.id, {
        currentPassword: password,
        nickname,
        ageRange,
        gender,
        siDo,
        gunGu,
      });

      if (nextPassword) {
        await updateUserPassword(currentUser.id, {
          currentPassword: password,
          newPassword: nextPassword,
        });
      }

      setCurrentUser((prev) => (prev ? { ...prev, ...updated, name: updated.name || prev.name } : prev));
      setProfileUser(updated);
      setProfileEditOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setProfileSaveSuccess("회원정보가 업데이트되었습니다.");
    } catch (error) {
      setProfileSaveError(error instanceof Error ? error.message : "회원정보 수정에 실패했습니다.");
      setProfileSaveSuccess("");
    } finally {
      setProfileSaving(false);
    }
  };

  const confirmProfileEdit = async () => {
    if (!currentUser || !displayUser) return;

    const password = profilePasswordDraft.trim();
    if (!password) {
      setProfileSaveError("?꾩옱 鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??");
      return;
    }

    const currentRegion = inferRegionFromLocation(displayUser.location);

    try {
      setProfilePasswordChecking(true);
      setProfileSaveError("");
      setProfileSaveSuccess("");

      await updateUserProfile(currentUser.id, {
        currentPassword: password,
        nickname: displayUser.nickname,
        ageRange: displayUser.ageRange,
        gender: displayUser.gender,
        siDo: currentRegion.siDo,
        gunGu: currentRegion.gunGu,
      });

      setCurrentPassword(password);
      setProfilePasswordDraft("");
      setProfilePasswordModalOpen(false);
      setProfileEditOpen(true);
    } catch (error) {
      setProfileSaveError(error instanceof Error ? error.message : "?꾩옱 鍮꾨?踰덊샇瑜??뺤씤?섏? 紐삵뻽?듬땲??");
    } finally {
      setProfilePasswordChecking(false);
    }
  };

  const savePassword = async () => {
    if (!currentUser) return;

    const password = currentPassword.trim();
    const nextPassword = newPassword.trim();
    const confirmPassword = newPasswordConfirm.trim();

    if (!password || !nextPassword || !confirmPassword) {
      setPasswordSaveError("현재 비밀번호와 새로운 비밀번호를 모두 입력해 주세요.");
      setPasswordSaveSuccess("");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordSaveError("새로운 비밀번호가 일치하지 않습니다.");
      setPasswordSaveSuccess("");
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordSaveError("");
      setPasswordSaveSuccess("");

      await updateUserPassword(currentUser.id, {
        currentPassword: password,
        newPassword: nextPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setPasswordSaveSuccess("비밀번호가 변경되었습니다.");
      setProfileSaveSuccess("");
    } catch (error) {
      setPasswordSaveError(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
      setPasswordSaveSuccess("");
    } finally {
      setPasswordSaving(false);
    }
  };

  const accountTypeLabel = displayUser?.loginType === "local" ? "일반 회원" : "소셜 회원";

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in space-y-6 duration-500">
      <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-[24px] bg-slate-900 px-6 py-5 text-3xl font-black text-white">
              {displayUser?.nickname?.substring(0, 1)}
            </div>
            <div className="min-w-0">
              <h2 className="mt-2 truncate text-3xl font-black text-slate-950">{displayUser?.nickname}</h2>
              <p className="mt-2 text-sm text-slate-500">{displayUser?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              {accountTypeLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              게시물 {myPosts.length}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              댓글 {myComments.length}
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {TAB_ITEMS.map((item) => {
          const active = item.id === activeTab;
          const count =
            item.id === "posts" ? myPosts.length : item.id === "comments" ? myComments.length : item.id === "likes" ? likedPosts.length : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
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

      {activeTab === "profile" ? (
        <SectionCard title="회원정보" description="기본 정보는 읽기 전용으로 표시되며, 수정 버튼을 눌렀을 때만 편집할 수 있습니다.">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h4 className="mt-3 text-2xl font-black text-slate-950">{displayUser?.nickname}</h4>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={15} className="text-hp-600" />
                    {displayUser?.email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={15} className="text-hp-600" />
                    {accountTypeLabel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (profileEditOpen) {
                    resetEditFields();
                    setProfilePasswordModalOpen(false);
                    setProfileEditOpen(false);
                  } else {
                    resetEditFields();
                    setProfilePasswordModalOpen(true);
                  }
                }}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  profileEditOpen
                    ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    : "bg-hp-600 text-white hover:bg-hp-700"
                }`}
              >
                {profileEditOpen ? "수정 취소" : "회원정보 수정"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoField label="닉네임" value={displayUser?.nickname || "미등록"} icon={<UserRound size={16} />}>
                {profileEditOpen ? (
                  <input
                    value={editNickname}
                    onChange={(event) => setEditNickname(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  />
                ) : null}
              </InfoField>
              <InfoField label="이메일" value={displayUser?.email || "미등록"} icon={<Mail size={16} />} />
              <InfoField label="성별" value={displayUser?.gender || "미등록"} icon={<UserRound size={16} />}>
                {profileEditOpen ? (
                  <select
                    value={editGender}
                    onChange={(event) => setEditGender(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  >
                    <option value="">성별 선택</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : null}
              </InfoField>
              <InfoField label="연령대" value={displayUser?.ageRange || "미등록"} icon={<Settings size={16} />}>
                {profileEditOpen ? (
                  <select
                    value={editAgeRange}
                    onChange={(event) => setEditAgeRange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  >
                    <option value="">연령대 선택</option>
                    {AGE_RANGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : null}
              </InfoField>
              <InfoField label="시 / 도" value={regionFromProfile.siDo || "미등록"} icon={<MapPin size={16} />}>
                {profileEditOpen ? (
                  <select
                    value={editSiDo}
                    onChange={(event) => {
                      setEditSiDo(event.target.value);
                      setEditGunGu("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  >
                    <option value="">시 / 도 선택</option>
                    {Object.keys(REGION_DATA).map((siDo) => (
                      <option key={siDo} value={siDo}>
                        {siDo}
                      </option>
                    ))}
                  </select>
                ) : null}
              </InfoField>
              <InfoField label="구 / 군" value={regionFromProfile.gunGu || "미등록"} icon={<MapPin size={16} />}>
                {profileEditOpen ? (
                  <select
                    value={editGunGu}
                    onChange={(event) => setEditGunGu(event.target.value)}
                    disabled={!editSiDo}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500 disabled:opacity-40"
                  >
                    <option value="">구 / 군 선택</option>
                    {(REGION_DATA[editSiDo] || []).map((gunGu) => (
                      <option key={gunGu} value={gunGu}>
                        {gunGu}
                      </option>
                    ))}
                  </select>
                ) : null}
              </InfoField>
            </div>
          </div>

          {profileEditOpen ? (
            <div className="mt-6 rounded-[24px] border border-hp-200 bg-hp-50/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">위 카드에서 바로 회원정보를 수정할 수 있습니다.</p>
                  <p className="mt-1 text-sm text-slate-500">수정이 끝나면 저장 버튼을 눌러 반영하세요.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetEditFields();
                      setProfileEditOpen(false);
                    }}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    수정 취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={profileSaving}
                    className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
                  >
                    {profileSaving ? "저장 중..." : "정보 저장"}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">New Password</p>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="새 비밀번호"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  />
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Confirm Password</p>
                  <input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(event) => setNewPasswordConfirm(event.target.value)}
                    placeholder="새 비밀번호 확인"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  />
                </div>
              </div>
              {profileSaveError ? <p className="mt-3 text-sm font-semibold text-red-500">{profileSaveError}</p> : null}
              {profileSaveSuccess ? <p className="mt-3 text-sm font-semibold text-emerald-600">{profileSaveSuccess}</p> : null}
            </div>
          ) : profileSaveSuccess ? (
            <p className="mt-6 text-sm font-semibold text-emerald-600">{profileSaveSuccess}</p>
          ) : profileSaveError ? (
            <p className="mt-6 text-sm font-semibold text-red-500">{profileSaveError}</p>
          ) : null}

          {false ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
                <div>
                  <h4 className="mt-2 text-xl font-black text-slate-950">프로필 수정</h4>
                  <p className="mt-2 text-sm text-slate-500">현재 비밀번호를 입력한 뒤 닉네임, 연령대, 성별, 지역을 수정할 수 있습니다.</p>
                </div>

                <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">비밀번호 확인</p>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  />
                  <p className="mt-2 text-xs text-amber-700">회원정보 수정과 비밀번호 변경 모두 현재 비밀번호 확인이 필요합니다.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Nickname</p>
                    <input
                      value={editNickname}
                      onChange={(event) => setEditNickname(event.target.value)}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                    />
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p className="mt-3 break-all text-base font-bold text-slate-900">{displayUser?.email || "미등록"}</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Age Range</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {AGE_RANGE_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setEditAgeRange(option)}
                          className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                            editAgeRange === option ? "bg-hp-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Gender</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {GENDER_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setEditGender(option)}
                          className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                            editGender === option ? "bg-hp-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">SiDo</p>
                    <select
                      value={editSiDo}
                      onChange={(event) => {
                        setEditSiDo(event.target.value);
                        setEditGunGu("");
                      }}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                    >
                      <option value="">시 / 도 선택</option>
                      {Object.keys(REGION_DATA).map((siDo) => (
                        <option key={siDo} value={siDo}>
                          {siDo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">GunGu</p>
                    <select
                      value={editGunGu}
                      onChange={(event) => setEditGunGu(event.target.value)}
                      disabled={!editSiDo}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500 disabled:opacity-40"
                    >
                      <option value="">구 / 군 선택</option>
                      {(REGION_DATA[editSiDo] || []).map((gunGu) => (
                        <option key={gunGu} value={gunGu}>
                          {gunGu}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    {profileSaveError ? <p className="text-sm font-semibold text-red-500">{profileSaveError}</p> : null}
                    {profileSaveSuccess ? <p className="text-sm font-semibold text-emerald-600">{profileSaveSuccess}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={profileSaving}
                    className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
                  >
                    {profileSaving ? "저장 중..." : "프로필 저장"}
                  </button>
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">SECURITY</p>
                  <h4 className="mt-2 text-xl font-black text-slate-950">비밀번호 변경</h4>
                  <p className="mt-2 text-sm text-slate-500">같은 현재 비밀번호 확인 후 새 비밀번호로 변경할 수 있습니다.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">New Password</p>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="새 비밀번호"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Confirm Password</p>
                    <input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(event) => setNewPasswordConfirm(event.target.value)}
                      placeholder="새 비밀번호 확인"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                    />
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-hp-600">
                      <KeyRound size={16} />
                    </span>
                    <div className="text-sm text-slate-500">
                      <p>현재 비밀번호 입력칸은 프로필 수정 영역 상단에 있습니다.</p>
                      <p className="mt-1">비밀번호를 변경하면 현재 비밀번호를 다시 입력한 뒤 추가 수정이 가능합니다.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    {passwordSaveError ? <p className="text-sm font-semibold text-red-500">{passwordSaveError}</p> : null}
                    {passwordSaveSuccess ? <p className="text-sm font-semibold text-emerald-600">{passwordSaveSuccess}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void savePassword()}
                    disabled={passwordSaving}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {passwordSaving ? "변경 중..." : "비밀번호 변경"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {false ? (
          <div className="mt-6">
            <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">SECURITY</p>
                <h4 className="mt-2 text-xl font-black text-slate-950">비밀번호 변경</h4>
                <p className="mt-2 text-sm text-slate-500">현재 비밀번호 확인 후 새 비밀번호로 변경할 수 있습니다.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current Password</p>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="현재 비밀번호"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">New Password</p>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="새 비밀번호"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Confirm Password</p>
                  <input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(event) => setNewPasswordConfirm(event.target.value)}
                    placeholder="새 비밀번호 확인"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
                  />
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-hp-600">
                    <KeyRound size={16} />
                  </span>
                  <div className="text-sm text-slate-500">
                    <p>현재 비밀번호가 확인되면 새 비밀번호로 변경됩니다.</p>
                    <p className="mt-1">회원정보 수정과 비밀번호 변경은 각각 저장 버튼을 눌러야 반영됩니다.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div>
                  {passwordSaveError ? <p className="text-sm font-semibold text-red-500">{passwordSaveError}</p> : null}
                  {passwordSaveSuccess ? <p className="text-sm font-semibold text-emerald-600">{passwordSaveSuccess}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => void savePassword()}
                  disabled={passwordSaving}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {passwordSaving ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            </div>
          </div>
          ) : null}
        </SectionCard>
      ) : null}

      {activeTab === "posts" ? (
        <SectionCard
          title="내 게시물"
          description={commentsLoading ? "게시물과 댓글 정보를 불러오는 중입니다." : "작성한 자유게시판 글과 스터디 모집 글을 확인합니다."}
        >
          <PostList posts={myPosts} onOpenPost={openBoardPost} />
        </SectionCard>
      ) : null}

      {activeTab === "comments" ? (
        <SectionCard
          title="내 댓글"
          description={commentsLoading ? "댓글 내역을 정리하는 중입니다." : "내가 작성한 댓글과 해당 게시물을 함께 확인합니다."}
        >
          <CommentList items={myComments} onOpenPost={openBoardPost} />
        </SectionCard>
      ) : null}

      {activeTab === "likes" ? (
        <SectionCard title="좋아요한 게시물" description="좋아요를 누른 게시물을 다시 모아봅니다.">
          <PostList posts={likedPosts} onOpenPost={openBoardPost} />
        </SectionCard>
      ) : null}

      {profilePasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">VERIFY</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">비밀번호 확인</h3>
              <p className="mt-2 text-sm text-slate-500">현재 비밀번호가 맞으면 기존 회원정보 카드가 바로 입력창으로 바뀝니다.</p>
            </div>

            <div className="mt-5">
              <input
                type="password"
                value={profilePasswordDraft}
                onChange={(event) => setProfilePasswordDraft(event.target.value)}
                placeholder="현재 비밀번호"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-hp-500"
              />
            </div>

            {profileSaveError ? <p className="mt-3 text-sm font-semibold text-red-500">{profileSaveError}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfilePasswordModalOpen(false);
                  setProfilePasswordDraft("");
                  setProfileSaveError("");
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmProfileEdit()}
                disabled={profilePasswordChecking}
                className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700 disabled:opacity-60"
              >
                {profilePasswordChecking ? "확인 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
