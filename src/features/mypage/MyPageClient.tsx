"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp, type BoardPost, type PostComment } from "@/lib/AppContext";
import { listComments } from "@/lib/comments";
import { REGION_DATA } from "@/lib/constants";
import { getUserProfile, updateUserPassword, updateUserProfile, verifyUserPassword } from "@/lib/profile";
import { MyPageHeader, MyPageTabNav } from "@/features/mypage/components/MyPageHeader";
import { PostList, CommentList } from "@/features/mypage/components/MyPageActivityList";
import { SectionCard } from "@/features/mypage/components/MyPageCommon";
import { MyPagePasswordModal } from "@/features/mypage/components/MyPagePasswordModal";
import { MyPageProfileSection } from "@/features/mypage/components/MyPageProfileSection";
import { MyPageBoardFilterTabs } from "@/features/mypage/components/MyPageBoardFilterTabs";
import { createPostViewRef } from "@/lib/post-view-session";

type ProfileEditState = {
  nickname: string;
  ageRange: string;
  gender: string;
  siDo: string;
  gunGu: string;
  newPassword: string;
  newPasswordConfirm: string;
};

type MyPageTab = "profile" | "posts" | "comments" | "likes";
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

const PROFILE_TABS: MyPageTab[] = ["profile", "posts", "comments", "likes"];

function isMyPageTab(value: string | null): value is MyPageTab {
  return value != null && PROFILE_TABS.includes(value as MyPageTab);
}

function matchesBoardFilter(type: BoardPost["type"], filter: MyPageBoardFilter) {
  return filter === "all" || type === filter;
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
  const [boardFilter, setBoardFilter] = useState<MyPageBoardFilter>("all");
  const [profileUser, setProfileUser] = useState(currentUser);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profilePasswordModalOpen, setProfilePasswordModalOpen] = useState(false);
  const [profilePasswordDraft, setProfilePasswordDraft] = useState("");
  const [profilePasswordChecking, setProfilePasswordChecking] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
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
    setProfileSaveError("");
    setProfileSaveSuccess("");
  };

  const openBoardPost = (post: BoardPost) => {
    const boardPath = post.type === "study" ? "/study" : "/free";
    const returnTo = activeTab === "profile" ? pathname : `${pathname}?tab=${encodeURIComponent(activeTab)}`;
    const ref = createPostViewRef(post.type, post.id);
    router.push(`${boardPath}/post?ref=${encodeURIComponent(ref)}&returnTo=${encodeURIComponent(returnTo)}`);
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

    if (!password) {
      setProfileSaveError("현재 비밀번호를 입력해 주세요.");
      setProfileSaveSuccess("");
      return;
    }

    if (!nickname || !ageRange || !gender || !siDo || !gunGu) {
      setProfileSaveError("닉네임, 연령대, 성별, 지역 정보를 모두 입력해 주세요.");
      setProfileSaveSuccess("");
      return;
    }

    if ((nextPassword || confirmPassword) && nextPassword !== confirmPassword) {
      setProfileSaveError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
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
      setEditState((prev) => ({ ...prev, newPassword: "", newPasswordConfirm: "" }));
      setProfileSaveSuccess("회원정보가 업데이트되었습니다.");
    } catch (error) {
      setProfileSaveError(error instanceof Error ? error.message : "회원정보 수정에 실패했습니다.");
      setProfileSaveSuccess("");
    } finally {
      setProfileSaving(false);
    }
  };

  const confirmProfileEdit = async () => {
    const password = profilePasswordDraft.trim();
    if (!password) {
      setProfileSaveError("비밀번호를 입력해 주세요.");
      return;
    }

    try {
      setProfilePasswordChecking(true);
      setProfileSaveError("");
      setProfileSaveSuccess("");

      await verifyUserPassword(currentUser.id, {
        currentPassword: password,
      });

      setCurrentPassword(password);
      setProfilePasswordDraft("");
      setProfilePasswordModalOpen(false);
      setProfileEditOpen(true);
    } catch (error) {
      setProfileSaveError(error instanceof Error ? error.message : "비밀번호 확인에 실패했습니다.");
    } finally {
      setProfilePasswordChecking(false);
    }
  };

  const accountTypeLabel = displayUser.loginType === "local" ? "일반 회원" : "소셜 회원";

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
        counts={{ posts: myPosts.length, comments: myComments.length, likes: likedPosts.length }}
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
          onStartEdit={() => {
            resetEditState();
            setProfilePasswordModalOpen(true);
          }}
          onCancelEdit={() => {
            resetEditState();
            setProfilePasswordModalOpen(false);
            setProfileEditOpen(false);
          }}
          onSave={() => void saveProfile()}
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

      <MyPagePasswordModal
        open={profilePasswordModalOpen}
        password={profilePasswordDraft}
        error={profileSaveError}
        checking={profilePasswordChecking}
        onChangePassword={setProfilePasswordDraft}
        onClose={() => {
          setProfilePasswordModalOpen(false);
          setProfilePasswordDraft("");
          setProfileSaveError("");
        }}
        onConfirm={() => void confirmProfileEdit()}
      />
    </div>
  );
}
