"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Bell, MessageCircle, ThumbsUp } from "lucide-react";
import type { BoardPost, PostComment, UserProfile } from "@/entities/common/types";
import { listComments } from "@/features/boards/api/comments";
import { isPostLiked } from "@/features/boards/api/likes";
import { listBoards } from "@/features/free-board/api/boards";
import { REGION_DATA } from "@/shared/constants";
import { getUserProfile, updateUserPassword, updateUserProfile, verifyUserPassword, withdrawUser, updateNotificationSettings } from "@/features/mypage/api/profile";
import { listStudies } from "@/features/study/api/study-api";
import { useApp } from "@/shared/context/AppContext";
import { MyPageHeader, MyPageTabNav } from "@/features/mypage/components/MyPageHeader";
import { PostList, CommentList } from "@/features/mypage/components/MyPageActivityList";
import { SectionCard } from "@/features/mypage/components/MyPageCommon";
import { MyPagePasswordModal } from "@/features/mypage/components/MyPagePasswordModal";
import { MyPageProfileSection } from "@/features/mypage/components/MyPageProfileSection";
import { MyPageBoardFilterTabs } from "@/features/mypage/components/MyPageBoardFilterTabs";
import { MyPageWithdrawModal } from "@/features/mypage/components/MyPageWithdrawModal";
import { SupportInquiryModal } from "@/features/support/components/SupportInquiryModal";
import { logoutSession } from "@/services/auth/auth";

type ProfileEditState = {
  nickname: string;
  ageRange: string;
  gender: string;
  siDo: string;
  gunGu: string;
  newPassword: string;
  newPasswordConfirm: string;
};

type MyPageTab = "profile" | "posts" | "comments" | "likes" | "settings";

function NotificationSwitch({
  label,
  description,
  icon,
  isOn,
  onToggle,
  disabled = false,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[22px] border border-slate-200 p-5 transition-all ${
        disabled ? "bg-slate-100 opacity-70" : "bg-slate-50 hover:border-hp-200 hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isOn ? 'bg-hp-100 text-hp-600' : 'bg-slate-200 text-slate-500'}`}>
          {icon}
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">{label}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full px-1 transition-colors duration-200 ease-in-out focus:outline-none ${
          isOn ? "bg-hp-600" : "bg-slate-300"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isOn ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

type MyPageBoardFilter = "all" | "study" | "free";
type MyCommentItem = {
  comment: PostComment;
  post: BoardPost;
};

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

const PROFILE_TABS: MyPageTab[] = ["profile", "posts", "comments", "likes", "settings"];

function isMyPageTab(value: string | null): value is MyPageTab {
  return value != null && PROFILE_TABS.includes(value as MyPageTab);
}

function matchesBoardFilter(type: BoardPost["type"], filter: MyPageBoardFilter) {
  return filter === "all" || type === filter;
}

export default function MyPageClient({
  initialPosts,
  initialProfile,
}: {
  initialPosts: BoardPost[];
  initialProfile: UserProfile | null;
}) {
  const { currentUser, setCurrentUser } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<MyPageTab>("profile");
  const [hydratedPosts, setHydratedPosts] = useState<BoardPost[]>(initialPosts);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [boardFilter, setBoardFilter] = useState<MyPageBoardFilter>("all");
  const [profileUser, setProfileUser] = useState(initialProfile ?? currentUser);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profilePasswordModalOpen, setProfilePasswordModalOpen] = useState(false);
  const [profilePasswordDraft, setProfilePasswordDraft] = useState("");
  const [profilePasswordChecking, setProfilePasswordChecking] = useState(false);
  const [profilePasswordError, setProfilePasswordError] = useState("");
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [withdrawDraft, setWithdrawDraft] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [likeNotification, setLikeNotification] = useState(initialProfile?.isLikeNotiOn ?? true );
  const [commentNotification, setCommentNotification] = useState(initialProfile?.isCommentNotiOn ?? true);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [editState, setEditState] = useState<ProfileEditState>({
    nickname: "",
    ageRange: "",
    gender: "",
    siDo: "",
    gunGu: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  const handleNotificationToggle = async (type: "COMMENT" | "LIKE", currentIsOn: boolean) => {
    if (!profileUser?.id || notificationSaving) return;

    const nextIsOn = !currentIsOn;

    setNotificationSaving(true);
    if (type === "COMMENT") setCommentNotification(nextIsOn);
    else setLikeNotification(nextIsOn);

    try {
      await updateNotificationSettings(String(profileUser.id), { 
        type, 
        isOn: nextIsOn 
      });
      console.log(`${type} 알림 저장 성공!`);
    } catch (error) {
      if (type === "COMMENT") setCommentNotification(currentIsOn);
      else setLikeNotification(currentIsOn);
      alert("설정 저장에 실패했습니다.");
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleAllNotificationToggle = async () => {
    if (!profileUser?.id || notificationSaving) return;

    const nextIsOn = !(commentNotification && likeNotification);
    const prevComment = commentNotification;
    const prevLike = likeNotification;

    setNotificationSaving(true);
    setCommentNotification(nextIsOn);
    setLikeNotification(nextIsOn);

    try {
      await updateNotificationSettings(String(profileUser.id), { type: "COMMENT", isOn: nextIsOn });
      await updateNotificationSettings(String(profileUser.id), { type: "LIKE", isOn: nextIsOn });
      toast.success(nextIsOn ? "전체 알림을 켰습니다." : "전체 알림을 껐습니다.");
    } catch {
      setCommentNotification(prevComment);
      setLikeNotification(prevLike);
      alert("알림 설정 저장에 실패했습니다.");
    } finally {
      setNotificationSaving(false);
    }
  };

  useEffect(() => {
    if (isMyPageTab(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    setBoardFilter("all");
  }, [activeTab]);

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

    setProfileUser(initialProfile ?? currentUser);
    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser, initialProfile]);

  useEffect(() => {
    if (!currentUser?.id) {
      setHydratedPosts(initialPosts);
      return;
    }

    let cancelled = false;

    const loadPosts = async () => {
      setCommentsLoading(true);

      try {
        const [freeBoards, studies] = await Promise.all([listBoards(currentUser.id), listStudies(currentUser.id)]);
        const posts = [...freeBoards, ...studies].map((post) => ({
          ...post,
          likedByUser:
            typeof post.likedByUser === "boolean"
              ? post.likedByUser
              : isPostLiked(currentUser.id, post.type === "free" ? "FREE" : "STUDY", post.id),
        }));

        const postsWithComments = await Promise.all(
          posts.map(async (post) => {
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

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [currentUser, initialPosts]);

  const displayUser = profileUser ?? currentUser;
  const visiblePosts = hydratedPosts;
  const regionFromProfile = useMemo(() => inferRegionFromLocation(displayUser?.location), [displayUser?.location]);

    useEffect(() => {
    if (displayUser) {
      setCommentNotification(displayUser.isCommentNotiOn ?? true);
      setLikeNotification(displayUser.isLikeNotiOn ?? true);
    }
  }, [displayUser]);

  useEffect(() => {
    if (!displayUser) return;

    setEditState({
      nickname: displayUser.nickname || "",
      ageRange: displayUser.ageRange || "",
      gender: displayUser.gender || "",
      siDo: regionFromProfile.siDo,
      gunGu: regionFromProfile.gunGu,
      newPassword: "",
      newPasswordConfirm: "",
    });
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

  const myComments = useMemo<MyCommentItem[]>(() => {
    if (!displayUser) return [];

    return visiblePosts
      .flatMap((post) =>
        post.comments
          .filter((comment) => comment.author === displayUser.nickname)
          .map((comment) => ({ comment, post })),
      )
      .sort((a, b) => String(b.comment.createdAt).localeCompare(String(a.comment.createdAt)));
  }, [displayUser, visiblePosts]);

  const filteredMyPosts = useMemo(
    () => myPosts.filter((post) => matchesBoardFilter(post.type, boardFilter)),
    [boardFilter, myPosts],
  );

  const filteredLikedPosts = useMemo(
    () => likedPosts.filter((post) => matchesBoardFilter(post.type, boardFilter)),
    [boardFilter, likedPosts],
  );

  const filteredMyComments = useMemo(
    () => myComments.filter(({ post }) => matchesBoardFilter(post.type, boardFilter)),
    [boardFilter, myComments],
  );

  const myPostCounts = useMemo(
    () => ({
      all: myPosts.length,
      study: myPosts.filter((post) => post.type === "study").length,
      free: myPosts.filter((post) => post.type === "free").length,
    }),
    [myPosts],
  );

  const myCommentCounts = useMemo(
    () => ({
      all: myComments.length,
      study: myComments.filter(({ post }) => post.type === "study").length,
      free: myComments.filter(({ post }) => post.type === "free").length,
    }),
    [myComments],
  );

  const likedPostCounts = useMemo(
    () => ({
      all: likedPosts.length,
      study: likedPosts.filter((post) => post.type === "study").length,
      free: likedPosts.filter((post) => post.type === "free").length,
    }),
    [likedPosts],
  );

  if (!currentUser || !displayUser) return null;
  const isSocialAccount = displayUser.loginType !== "local";

  const resetEditState = () => {
    setEditState({
      nickname: displayUser.nickname || "",
      ageRange: displayUser.ageRange || "",
      gender: displayUser.gender || "",
      siDo: regionFromProfile.siDo,
      gunGu: regionFromProfile.gunGu,
      newPassword: "",
      newPasswordConfirm: "",
    });
    setCurrentPassword("");
    setProfilePasswordDraft("");
    setProfilePasswordError("");
    setProfileSaveError("");
    setProfileSaveSuccess("");
  };

  const openBoardPost = (post: BoardPost) => {
    const boardPath = post.type === "study" ? "/study" : "/free";
    const returnTo = activeTab === "profile" ? pathname : `${pathname}?tab=${encodeURIComponent(activeTab)}`;
    router.push(`${boardPath}/${post.id}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const saveProfile = async () => {
    const password = currentPassword.trim();
    const nickname = editState.nickname.trim();
    const ageRange = editState.ageRange.trim();
    const gender = editState.gender.trim();
    const siDo = editState.siDo.trim();
    const gunGu = editState.gunGu.trim();
    const nextPassword = editState.newPassword.trim();
    const confirmPassword = editState.newPasswordConfirm.trim();

    if (!isSocialAccount && !password) {
      setProfileSaveError("현재 비밀번호를 입력해 주세요.");
      setProfileSaveSuccess("");
      return;
    }

    if (!nickname || !ageRange || !gender || !siDo || !gunGu) {
      setProfileSaveError("닉네임, 연령대, 성별, 지역 정보를 모두 입력해 주세요.");
      setProfileSaveSuccess("");
      return;
    }

    if (!isSocialAccount && (nextPassword || confirmPassword) && nextPassword !== confirmPassword) {
      setProfileSaveError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      setProfileSaveSuccess("");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileSaveError("");
      setProfileSaveSuccess("");

      const updated = await updateUserProfile(currentUser.id, {
        currentPassword: isSocialAccount ? undefined : password,
        nickname,
        ageRange,
        gender,
        siDo,
        gunGu,
      });

      if (!isSocialAccount && nextPassword) {
        await updateUserPassword(currentUser.id, {
          currentPassword: password,
          newPassword: nextPassword,
        });
      }

      setCurrentUser((prev) => (prev ? { ...prev, ...updated, name: updated.name || prev.name } : prev));
      setProfileUser(updated);
      setProfileEditOpen(false);
      setCurrentPassword("");
      setEditState((prev) => ({ ...prev, newPassword: "", newPasswordConfirm: "" }));
      setProfileSaveSuccess("회원정보가 업데이트되었습니다.");
      toast.success("회원정보가 업데이트되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "회원정보 수정에 실패했습니다.";
      setProfileSaveError(message);
      toast.error(message);
      setProfileSaveSuccess("");
    } finally {
      setProfileSaving(false);
    }
  };

  const confirmProfileEdit = async () => {
    const password = profilePasswordDraft.trim();
    if (!password) {
      setProfilePasswordError("비밀번호를 입력해 주세요.");
      return;
    }

    try {
      setProfilePasswordChecking(true);
      setProfilePasswordError("");
      setProfileSaveSuccess("");

      await verifyUserPassword(currentUser.id, {
        currentPassword: password,
      });

      setCurrentPassword(password);
      setProfilePasswordDraft("");
      setProfilePasswordError("");
      setProfilePasswordModalOpen(false);
      setProfileEditOpen(true);
    } catch (error) {
      setProfilePasswordError(error instanceof Error ? error.message : "비밀번호 확인에 실패했습니다.");
    } finally {
      setProfilePasswordChecking(false);
    }
  };

  const confirmWithdraw = async () => {
    if (withdrawDraft !== "회원탈퇴") {
      setWithdrawError("회원탈퇴를 정확히 입력해 주세요.");
      return;
    }

    try {
      setWithdrawSubmitting(true);
      setWithdrawError("");
      await withdrawUser(currentUser.id);
      await logoutSession();
      setCurrentUser(null);
      toast.success("회원 탈퇴가 처리되었습니다.");
      router.replace("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "회원 탈퇴 처리에 실패했습니다.";
      setWithdrawError(message);
      toast.error(message);
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const accountTypeLabel =
    displayUser.loginType === "local"
      ? "일반 회원"
      : displayUser.socialProvider === "KAKAO"
        ? "카카오 회원"
        : displayUser.socialProvider === "GOOGLE"
          ? "구글 회원"
          : "소셜 회원";

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in space-y-6 duration-500">
      <MyPageHeader
        user={displayUser}
        accountTypeLabel={accountTypeLabel}
        postCount={myPosts.length}
        commentCount={myComments.length}
      />

      <MyPageTabNav
        activeTab={activeTab}
        counts={{ posts: myPosts.length, comments: myComments.length, likes: likedPosts.length, settings: 0 }}
        onChange={setActiveTab}
      />

      {activeTab === "profile" ? (
        <MyPageProfileSection
          user={displayUser}
          accountTypeLabel={accountTypeLabel}
          region={profileEditOpen ? { siDo: editState.siDo, gunGu: editState.gunGu } : regionFromProfile}
          editOpen={profileEditOpen}
          verifying={profilePasswordChecking}
          editState={editState}
          saveError={profileSaveError}
          saveSuccess={profileSaveSuccess}
          saving={profileSaving}
          isSocialAccount={isSocialAccount}
          onStartEdit={() => {
            resetEditState();
            if (isSocialAccount) {
              setProfileEditOpen(true);
            } else {
              setProfilePasswordModalOpen(true);
            }
          }}
          onCancelEdit={() => {
            resetEditState();
            setProfilePasswordModalOpen(false);
            setProfileEditOpen(false);
          }}
          onSave={() => void saveProfile()}
          onStartWithdraw={() => {
            setWithdrawDraft("");
            setWithdrawError("");
            setWithdrawOpen(true);
          }}
          onOpenInquiry={() => {
            setInquirySubmitting(false);
            setInquiryOpen(true);
          }}
          onChange={(next) => setEditState((prev) => ({ ...prev, ...next }))}
        />
      ) : null}

      {activeTab === "posts" ? (
        <SectionCard
          title="내 게시물"
          description={commentsLoading ? "게시물과 댓글 정보를 불러오는 중입니다." : "작성한 자유 게시글과 스터디 모집 글을 확인할 수 있습니다."}
        >
          <MyPageBoardFilterTabs value={boardFilter} counts={myPostCounts} onChange={setBoardFilter} />
          <PostList posts={filteredMyPosts} onOpenPost={openBoardPost} />
        </SectionCard>
      ) : null}

      {activeTab === "comments" ? (
        <SectionCard
          title="내 댓글"
          description={commentsLoading ? "댓글 내역을 불러오는 중입니다." : "내가 작성한 댓글과 해당 게시글을 함께 확인할 수 있습니다."}
        >
          <MyPageBoardFilterTabs value={boardFilter} counts={myCommentCounts} onChange={setBoardFilter} />
          <CommentList items={filteredMyComments} onOpenPost={openBoardPost} />
        </SectionCard>
      ) : null}

      {activeTab === "likes" ? (
        <SectionCard title="좋아요한 게시물" description="좋아요를 누른 게시물을 다시 모아볼 수 있습니다.">
          <MyPageBoardFilterTabs value={boardFilter} counts={likedPostCounts} onChange={setBoardFilter} />
          <PostList posts={filteredLikedPosts} onOpenPost={openBoardPost} />
        </SectionCard>
      ) : null}

      {activeTab === "settings" ? (
        <SectionCard
          title="알림 설정"
          description="댓글이나 좋아요 등 주요 활동에 대한 알림 수신 여부를 설정할 수 있습니다."
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4">
            <NotificationSwitch
              label="전체 알림"
              description="댓글 알림과 좋아요 알림을 한 번에 켜거나 끕니다."
              icon={<Bell size={24} />}
              isOn={commentNotification && likeNotification}
              onToggle={handleAllNotificationToggle}
              disabled={notificationSaving}
            />
            </div>
            <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4">
            <NotificationSwitch
              label="댓글 알림"
              description="내 게시글에 새로운 댓글이 달리면 알림을 받습니다."
              icon={<MessageCircle size={24} />}
              isOn={commentNotification}
              onToggle={() => handleNotificationToggle("COMMENT", commentNotification)}
              disabled={notificationSaving}
            />
            <NotificationSwitch
              label="좋아요 알림"
              description="내 게시글이 좋아요를 받으면 알림을 받습니다."
              icon={<ThumbsUp size={24} />}
              isOn={likeNotification}
              onToggle={() => handleNotificationToggle("LIKE", likeNotification)}
              disabled={notificationSaving}
            />
            </div>
          </div>
        </SectionCard>
      ) : null}

      <MyPagePasswordModal
        open={profilePasswordModalOpen}
        password={profilePasswordDraft}
        error={profilePasswordError}
        checking={profilePasswordChecking}
        onChangePassword={setProfilePasswordDraft}
        onClose={() => {
          setProfilePasswordModalOpen(false);
          setProfilePasswordDraft("");
          setProfilePasswordError("");
        }}
        onConfirm={() => void confirmProfileEdit()}
      />
      <MyPageWithdrawModal
        open={withdrawOpen}
        value={withdrawDraft}
        error={withdrawError}
        submitting={withdrawSubmitting}
        onChange={setWithdrawDraft}
        onClose={() => {
          if (withdrawSubmitting) return;
          setWithdrawOpen(false);
          setWithdrawDraft("");
          setWithdrawError("");
        }}
        onConfirm={() => void confirmWithdraw()}
      />
      <SupportInquiryModal
        open={inquiryOpen}
        submitting={inquirySubmitting}
        onSubmittingChange={setInquirySubmitting}
        onClose={() => {
          if (inquirySubmitting) return;
          setInquiryOpen(false);
          setInquirySubmitting(false);
        }}
      />
    </div>
  );
}
