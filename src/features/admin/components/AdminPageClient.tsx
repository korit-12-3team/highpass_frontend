"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  FileText,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  loadAdminSection,
  updateAdminPostStatus,
  updateAdminReportStatus,
  updateAdminUserStatus,
} from "@/features/admin/api/admin-api";
import {
  AdminStat,
  ApiNotice,
  postStatusLabel,
} from "@/features/admin/components/AdminCommon";
import { AdminPostsSection } from "@/features/admin/components/AdminPostsSection";
import { AdminReportsSection } from "@/features/admin/components/AdminReportsSection";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminUsersSection } from "@/features/admin/components/AdminUsersSection";
import { listComments } from "@/features/boards/api/comments";
import type { PostComment } from "@/entities/common/types";
import type {
  AdminPost,
  AdminReport,
  AdminSection,
  AdminUser,
  ApiStatus,
  AuthStatus,
  PostStatus,
  PostType,
  ReportStatus,
  UserStatus,
} from "@/features/admin/types";
import { fetchCurrentUserProfile, logoutSession } from "@/services/auth/auth";

const userStatusOrder: Record<UserStatus, number> = {
  active: 0,
  suspended: 1,
  deleted: 2,
};

const ADMIN_SECTION_STORAGE_KEY = "highpass-admin-section";
const ADMIN_SELECTED_USER_STORAGE_KEY = "highpass-admin-selected-user";
const ADMIN_SELECTED_POST_STORAGE_KEY = "highpass-admin-selected-post";
const ADMIN_PREVIEW_POST_STORAGE_KEY = "highpass-admin-preview-post";

function isAdminSection(value: unknown): value is AdminSection {
  return value === "users" || value === "posts" || value === "reports";
}

function getStoredAdminSection(): AdminSection {
  if (typeof window === "undefined") return "users";
  const storedSection = window.localStorage.getItem(ADMIN_SECTION_STORAGE_KEY);
  return isAdminSection(storedSection) ? storedSection : "users";
}

function getStoredText(key: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) ?? "";
}

function syncStoredText(key: string, value: string) {
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

export default function AdminPageClient() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [apiStatus, setApiStatus] = useState<Record<AdminSection, ApiStatus>>({
    users: "idle",
    posts: "idle",
    reports: "idle",
  });
  const [activeSection, setActiveSection] =
    useState<AdminSection>(getStoredAdminSection);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(() =>
    getStoredText(ADMIN_SELECTED_USER_STORAGE_KEY),
  );
  const [selectedPostId, setSelectedPostId] = useState(() =>
    getStoredText(ADMIN_SELECTED_POST_STORAGE_KEY),
  );
  const [previewPostId, setPreviewPostId] = useState(() =>
    getStoredText(ADMIN_PREVIEW_POST_STORAGE_KEY),
  );
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | UserStatus>("all");
  const [postFilter, setPostFilter] = useState<"all" | PostStatus>("all");
  const [postTypeFilter, setPostTypeFilter] = useState<"all" | PostType>("all");
  const [reportFilter, setReportFilter] = useState<"all" | ReportStatus>("all");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const currentUser = await fetchCurrentUserProfile().catch(() => null);
      if (!cancelled) {
        setAuthStatus(
          currentUser?.role === "ADMIN" ? "authenticated" : "unauthorized",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    let cancelled = false;

    const loadSection = async <T,>(
      section: AdminSection,
      applyData: (items: T[]) => void,
    ) => {
      setApiStatus((prev) => ({ ...prev, [section]: "loading" }));

      try {
        const items = await loadAdminSection<T>(section);
        if (cancelled) return;

        applyData(items);
        setApiStatus((prev) => ({ ...prev, [section]: "ready" }));
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (!cancelled && status === 401) setAuthStatus("unauthorized");
        if (!cancelled) {
          setApiStatus((prev) => ({ ...prev, [section]: "unavailable" }));
        }
      }
    };

    void loadSection<AdminUser>("users", setUsers);
    void loadSection<AdminPost>("posts", setPosts);
    void loadSection<AdminReport>("reports", setReports);

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_SECTION_STORAGE_KEY, activeSection);
  }, [activeSection]);

  useEffect(() => {
    syncStoredText(ADMIN_SELECTED_USER_STORAGE_KEY, selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    syncStoredText(ADMIN_SELECTED_POST_STORAGE_KEY, selectedPostId);
  }, [selectedPostId]);

  useEffect(() => {
    syncStoredText(ADMIN_PREVIEW_POST_STORAGE_KEY, previewPostId);
  }, [previewPostId]);

  const visibleUsers = useMemo(
    () => users.filter((user) => user.role !== "ADMIN"),
    [users],
  );
  const selectedUser = selectedUserId
    ? visibleUsers.find((user) => user.id === selectedUserId) ?? null
    : null;
  const selectedPost = selectedPostId
    ? posts.find((post) => post.id === selectedPostId) ?? null
    : null;
  const previewPost = previewPostId
    ? posts.find((post) => post.id === previewPostId) ?? null
    : null;
  const userPosts = selectedUser
    ? posts.filter((post) => post.authorId === selectedUser.id)
    : [];
  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(
    () =>
      visibleUsers
        .filter((user) => {
          const matchesStatus =
            userFilter === "all" || user.status === userFilter;
          const matchesQuery =
            !normalizedQuery ||
            [user.email, user.nickname, user.name, user.region].some((value) =>
              value.toLowerCase().includes(normalizedQuery),
            );
          return matchesStatus && matchesQuery;
        })
        .toSorted((a, b) => {
          const statusDiff = userStatusOrder[a.status] - userStatusOrder[b.status];
          if (statusDiff !== 0) return statusDiff;
          if (Boolean(a.online) !== Boolean(b.online)) return a.online ? -1 : 1;
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        }),
    [normalizedQuery, userFilter, visibleUsers],
  );

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesStatus =
          postFilter === "all" || post.status === postFilter;
        const matchesType =
          postTypeFilter === "all" || post.type === postTypeFilter;
        const matchesQuery =
          !normalizedQuery ||
          [post.title, post.author].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );
        return matchesStatus && matchesType && matchesQuery;
      }),
    [normalizedQuery, postFilter, postTypeFilter, posts],
  );

  const filteredReports = useMemo(
    () =>
      reports.filter((report) => {
        const matchesStatus =
          reportFilter === "all" || report.status === reportFilter;
        const matchesQuery =
          !normalizedQuery ||
          [report.targetLabel, report.reason, report.reporter].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          );
        return matchesStatus && matchesQuery;
      }),
    [normalizedQuery, reportFilter, reports],
  );

  const reportCount = reports.filter((report) => report.status === "pending").length;

  const sectionTitle =
    activeSection === "users"
      ? "회원 관리"
      : activeSection === "posts"
        ? "게시글 관리"
        : "신고처리";

  const searchPlaceholder =
    activeSection === "users"
      ? "회원 이름, 이메일 검색"
      : activeSection === "posts"
        ? "게시글 제목, 작성자 검색"
        : "신고 대상, 내용, 작성자 검색";

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    try {
      const updatedUser = await updateAdminUserStatus(userId, status);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updatedUser : user)),
      );
      setApiStatus((prev) => ({ ...prev, users: "ready" }));
    } catch (error) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status;
      if (statusCode === 401 || statusCode === 403) {
        setAuthStatus("unauthorized");
      }
      setApiStatus((prev) => ({ ...prev, users: "unavailable" }));
    }
  };

  const updatePostStatus = async (postId: string, status: PostStatus) => {
    try {
      const updatedPost = await updateAdminPostStatus(postId, status);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updatedPost : post)),
      );
      setApiStatus((prev) => ({ ...prev, posts: "ready" }));
    } catch (error) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status;
      if (statusCode === 401 || statusCode === 403) {
        setAuthStatus("unauthorized");
      }
      setApiStatus((prev) => ({ ...prev, posts: "unavailable" }));
    }
  };

  const updateReportStatus = async (reportId: string, status: ReportStatus) => {
    try {
      const updatedReport = await updateAdminReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? updatedReport : report,
        ),
      );
      setApiStatus((prev) => ({ ...prev, reports: "ready" }));
    } catch (error) {
      const statusCode = (error as { response?: { status?: number } })?.response?.status;
      if (statusCode === 401 || statusCode === 403) {
        setAuthStatus("unauthorized");
      }
      setApiStatus((prev) => ({ ...prev, reports: "unavailable" }));
    }
  };

  const handleAdminLogout = async () => {
    await logoutSession();
    router.replace("/login");
  };

  const resetDetailViews = () => {
    setSelectedUserId("");
    setSelectedPostId("");
    setPreviewPostId("");
  };

  const openPostDetail = (post: AdminPost) => {
    setPreviewPostId("");
    setSelectedUserId("");
    setSelectedPostId(post.id);
    setActiveSection("posts");
  };

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-800">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm font-black text-hp-700">관리자 인증 확인 중</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            로그인 세션을 확인하고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-800">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
          <ShieldCheck size={34} className="mx-auto text-hp-600" />
          <h2 className="mt-3 text-xl font-black text-slate-950">
            관리자 권한이 필요합니다
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            관리자 계정으로 로그인해야 관리자 API를 확인할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            로그인으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-800 md:flex-row">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          resetDetailViews();
        }}
        onLogout={() => void handleAdminLogout()}
      />

      <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-hp-700">
              관리자 콘솔
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              {sectionTitle}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              운영에 필요한 회원, 게시글, 신고 상태를 확인합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            <AdminStat
              icon={<Users size={18} />}
              label="회원"
              value={visibleUsers.filter((user) => user.status !== "deleted").length}
            />
            <AdminStat
              icon={<Ban size={18} />}
              label="정지"
              value={visibleUsers.filter((user) => user.status === "suspended").length}
            />
            <AdminStat
              icon={<FileText size={18} />}
              label="게시글"
              value={posts.filter((post) => post.status !== "deleted").length}
            />
            <AdminStat
              icon={<MessageSquareWarning size={18} />}
              label="대기"
              value={reportCount}
            />
          </div>
        </header>

        {!selectedUser && !selectedPost ? (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-hp-300 focus-within:bg-white">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            {activeSection === "users" ? (
              <select
                value={userFilter}
                onChange={(event) =>
                  setUserFilter(event.target.value as "all" | UserStatus)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="all">전체 상태</option>
                <option value="active">정상</option>
                <option value="suspended">정지</option>
                <option value="deleted">탈퇴</option>
              </select>
            ) : null}

            {activeSection === "posts" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={postTypeFilter}
                  onChange={(event) =>
                    setPostTypeFilter(event.target.value as "all" | PostType)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="all">전체 종류</option>
                  <option value="free">자유게시판</option>
                  <option value="study">스터디 모집</option>
                </select>
                <select
                  value={postFilter}
                  onChange={(event) =>
                    setPostFilter(event.target.value as "all" | PostStatus)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="all">전체 상태</option>
                  <option value="visible">공개</option>
                  <option value="hidden">숨김</option>
                  <option value="deleted">삭제</option>
                </select>
              </div>
            ) : null}

            {activeSection === "reports" ? (
              <select
                value={reportFilter}
                onChange={(event) =>
                  setReportFilter(event.target.value as "all" | ReportStatus)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기</option>
                <option value="resolved">처리</option>
                <option value="dismissed">반려</option>
              </select>
            ) : null}
          </div>
        ) : null}

        <ApiNotice status={apiStatus[activeSection]} label={sectionTitle} />

        {activeSection === "users" ? (
          <AdminUsersSection
            users={filteredUsers}
            selectedUser={selectedUser}
            userPosts={userPosts}
            onOpenUser={setSelectedUserId}
            onBack={() => setSelectedUserId("")}
            onOpenPost={(post) => setPreviewPostId(post.id)}
            onUpdateUserStatus={(userId, status) =>
              void updateUserStatus(userId, status)
            }
          />
        ) : null}

        {activeSection === "posts" ? (
          <AdminPostsSection
            posts={filteredPosts}
            selectedPost={selectedPost}
            onOpenPost={(post) => setSelectedPostId(post.id)}
            onBack={() => setSelectedPostId("")}
            onUpdatePostStatus={(postId, status) =>
              void updatePostStatus(postId, status)
            }
          />
        ) : null}

        {activeSection === "reports" ? (
          <AdminReportsSection
            reports={filteredReports}
            onUpdateReportStatus={(reportId, status) =>
              void updateReportStatus(reportId, status)
            }
            onUpdatePostStatus={(postId, status) =>
              void updatePostStatus(postId, status)
            }
            onUpdateUserStatus={(userId, status) =>
              void updateUserStatus(userId, status)
            }
          />
        ) : null}
      </main>

      {previewPost ? (
        <AdminPostPreviewModal
          post={previewPost}
          onClose={() => setPreviewPostId("")}
          onOpenDetail={() => openPostDetail(previewPost)}
        />
      ) : null}
    </div>
  );
}

function AdminPostPreviewModal({
  post,
  onClose,
  onOpenDetail,
}: {
  post: AdminPost;
  onClose: () => void;
  onOpenDetail: () => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsStatus, setCommentsStatus] = useState<"loading" | "ready" | "error">("loading");
  const targetId = post.id.includes("-")
    ? post.id.split("-").at(-1) ?? post.id
    : post.id;
  const targetType = post.type === "study" ? "STUDY" : "FREE";

  useEffect(() => {
    let cancelled = false;

    setCommentsStatus("loading");
    void listComments(targetType, targetId)
      .then((items) => {
        if (cancelled) return;
        setComments(items);
        setCommentsStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setComments([]);
        setCommentsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [targetId, targetType]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-hp-50 px-2.5 py-1 text-xs font-black text-hp-700">
                {post.type === "study" ? "스터디 모집" : "자유 게시글"}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                {postStatusLabel[post.status]}
              </span>
            </div>
            <h3 className="mt-3 break-words text-2xl font-black text-slate-950">
              {post.title}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {post.author} · {formatAdminPreviewDate(post.createdAt)} · 조회 {post.views}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
          >
            닫기
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="min-h-36 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {post.content || "내용이 없습니다."}
            </p>
          </article>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h4 className="text-sm font-black text-slate-950">댓글</h4>
              <span className="text-xs font-black text-slate-400">
                {comments.length}개
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto p-4">
              {commentsStatus === "loading" ? (
                <p className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
                  댓글을 불러오는 중입니다.
                </p>
              ) : commentsStatus === "error" ? (
                <p className="rounded-lg bg-rose-50 p-5 text-center text-sm font-semibold text-rose-500">
                  댓글을 불러오지 못했습니다.
                </p>
              ) : comments.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
                  아직 댓글이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
                        {comment.author.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {comment.author}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {formatAdminPreviewDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onOpenDetail}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
          >
            게시글 상세로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAdminPreviewDate(value?: string) {
  if (!value) return "날짜 없음";
  return value.replace("T", " ").slice(0, 16);
}
