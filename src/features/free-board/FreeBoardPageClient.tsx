"use client";

import React, { useMemo, useState } from "react";
import { format, isSameDay, isSameYear } from "date-fns";
import { ArrowLeft, Eye, Heart, MessageCircle, Pencil, Trash2, X } from "lucide-react";
import { BoardPost, useApp } from "@/lib/AppContext";
import { deleteBoard, getBoard } from "@/lib/boards";
import {
  createComment,
  deleteComment as deleteCommentRequest,
  listComments,
  updateComment as updateCommentRequest,
} from "@/lib/comments";
import { saveLikedPost, toggleBoardLike } from "@/lib/likes";

function formatBoardCreatedAt(value?: string) {
  if (!value) return "오늘";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  if (isSameDay(date, now)) return format(date, "HH:mm");
  if (isSameYear(date, now)) return format(date, "MM.dd");
  return format(date, "yyyy.MM.dd");
}

function getInitial(name: string) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export default function FreeBoardPageClient() {
  const { boardData, setBoardData, currentUser, setProfileModal, setWriteModalOpen, setWriteType } = useApp();

  const freePosts = useMemo(() => {
    const getTime = (value?: string) => {
      if (!value) return 0;
      const t = new Date(value).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    return Array.from(
      boardData
        .filter((item) => item.type === "free")
        .reduce((map, item) => {
          map.set(item.id, item);
          return map;
        }, new Map<string, BoardPost>())
        .values(),
    )
      .slice()
      .sort((a, b) => {
        const dt = getTime(b.createdAt) - getTime(a.createdAt);
        if (dt !== 0) return dt;
        const ai = Number(a.id);
        const bi = Number(b.id);
        if (Number.isFinite(ai) && Number.isFinite(bi)) return bi - ai;
        return String(b.id).localeCompare(String(a.id));
      });
  }, [boardData]);

  const [viewPost, setViewPost] = useState<BoardPost | null>(null);
  const [commentText, setCommentText] = useState("");
  const [postError, setPostError] = useState("");
  const [deletingPost, setDeletingPost] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [likeSubmittingPostId, setLikeSubmittingPostId] = useState<string | null>(null);
  const [inlineCommentDrafts, setInlineCommentDrafts] = useState<Record<string, string>>({});
  const [inlineCommentSubmittingPostId, setInlineCommentSubmittingPostId] = useState<string | null>(null);

  const syncPostComments = (postId: string, comments: BoardPost["comments"]) => {
    setViewPost((prev) => (prev && prev.id === postId ? { ...prev, comments } : prev));
    setBoardData((prev) => prev.map((post) => (post.type === "free" && post.id === postId ? { ...post, comments } : post)));
  };

  const loadComments = async (postId: string) => {
    const comments = await listComments("FREE", postId);
    syncPostComments(postId, comments);
  };

  const openPost = (post: BoardPost) => {
    setViewPost(post);
    setPostError("");
    setCommentError("");
    setEditingCommentId(null);
    setEditingCommentText("");

    void (async () => {
      try {
        const [fresh, comments] = await Promise.all([
          getBoard(String(post.id), currentUser?.id),
          listComments("FREE", String(post.id)),
        ]);
        if (!fresh) return;
        const hydrated = { ...fresh, comments };
        setViewPost((prev) => (prev && prev.id === post.id ? hydrated : prev));
        setBoardData((prev) => prev.map((p) => (p.type === "free" && p.id === post.id ? hydrated : p)));
      } catch (e) {
        setPostError(e instanceof Error ? e.message : "게시글을 불러오지 못했습니다.");
      }
    })();
  };

  const updatePostLocally = (postId: string, updater: (post: BoardPost) => BoardPost) => {
    setBoardData((prev) => prev.map((post) => (post.type === "free" && post.id === postId ? updater(post) : post)));
    setViewPost((prev) => (prev && prev.id === postId ? updater(prev) : prev));
  };

  const handleToggleLike = async (post: BoardPost) => {
    if (!currentUser || likeSubmittingPostId === post.id) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);

    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) {
      if (viewPost?.id === post.id) {
        setPostError("좋아요 요청에 필요한 사용자 또는 게시글 ID가 올바르지 않습니다.");
      }
      return;
    }

    try {
      setLikeSubmittingPostId(post.id);
      const nextLiked = !post.likedByUser;
      await toggleBoardLike("FREE", targetId, userId);
      saveLikedPost(currentUser.id, "FREE", post.id, nextLiked);
      updatePostLocally(post.id, (currentPost) => ({
        ...currentPost,
        likes: nextLiked ? currentPost.likes + 1 : Math.max(0, currentPost.likes - 1),
        likedByUser: nextLiked,
      }));
    } catch (e) {
      if (viewPost?.id === post.id) {
        setPostError(e instanceof Error ? e.message : "좋아요 처리에 실패했습니다.");
      }
    } finally {
      setLikeSubmittingPostId(null);
    }
  };

  const submitInlineComment = async (post: BoardPost) => {
    if (!currentUser || inlineCommentSubmittingPostId === post.id) return;

    const draft = (inlineCommentDrafts[post.id] || "").trim();
    if (!draft) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);

    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) return;

    try {
      setInlineCommentSubmittingPostId(post.id);
      await createComment({
        content: draft,
        targetType: "FREE",
        targetId,
        userId,
      });
      const comments = await listComments("FREE", post.id);
      updatePostLocally(post.id, (currentPost) => ({ ...currentPost, comments }));
      setInlineCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));
    } finally {
      setInlineCommentSubmittingPostId(null);
    }
  };

  const addComment = async () => {
    if (!viewPost || !currentUser) return;
    if (!commentText.trim()) return;

    const userId = Number(currentUser.id);
    const targetId = Number(viewPost.id);

    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) {
      setCommentError("댓글 요청에 필요한 사용자 또는 게시글 ID가 올바르지 않습니다.");
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentError("");
      await createComment({
        content: commentText.trim(),
        targetType: "FREE",
        targetId,
        userId,
      });
      setCommentText("");
      await loadComments(viewPost.id);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 등록에 실패했습니다.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const startEditingComment = (commentId: number, text: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
    setCommentError("");
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveComment = async (commentId: number) => {
    if (!viewPost || !currentUser) return;
    if (!editingCommentText.trim()) return;

    const userId = Number(currentUser.id);
    const targetId = Number(viewPost.id);

    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) {
      setCommentError("댓글 요청에 필요한 사용자 또는 게시글 ID가 올바르지 않습니다.");
      return;
    }

    try {
      setActiveCommentId(commentId);
      setCommentError("");
      await updateCommentRequest(commentId, userId, {
        content: editingCommentText.trim(),
        targetType: "FREE",
        targetId,
        userId,
      });
      cancelEditingComment();
      await loadComments(viewPost.id);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 수정에 실패했습니다.");
    } finally {
      setActiveCommentId(null);
    }
  };

  const removeComment = async (commentId: number) => {
    if (!viewPost || !currentUser) return;
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    const userId = Number(currentUser.id);
    if (!Number.isFinite(userId)) {
      setCommentError("댓글 삭제에 필요한 사용자 ID가 올바르지 않습니다.");
      return;
    }

    try {
      setActiveCommentId(commentId);
      setCommentError("");
      await deleteCommentRequest(commentId, userId);
      if (editingCommentId === commentId) cancelEditingComment();
      await loadComments(viewPost.id);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setActiveCommentId(null);
    }
  };

  if (viewPost) {
    return (
      <div className="mx-auto max-w-xl animate-in fade-in duration-500">
        <div className="overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="sticky top-0 z-10 border-b border-hp-100 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => setViewPost(null)}
                className="rounded-full p-2 transition hover:bg-slate-100"
                aria-label="뒤로"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="text-sm font-semibold text-slate-700">게시글</div>
            </div>
          </div>

          {postError && <p className="px-4 pt-4 text-sm text-red-500">{postError}</p>}

          <div className="border-b border-hp-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setProfileModal(viewPost.authorId)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-hp-100 p-[2px]"
                title="프로필 보기"
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-hp-700">
                  {getInitial(viewPost.author)}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <button
                  className="block truncate text-left text-sm font-semibold text-slate-900 hover:underline"
                  onClick={() => setProfileModal(viewPost.authorId)}
                >
                  {viewPost.author}
                </button>
                <div className="text-xs text-slate-400">{formatBoardCreatedAt(viewPost.createdAt)}</div>
              </div>
              {viewPost.authorId === currentUser?.id && (
                <button
                  disabled={deletingPost}
                  onClick={async () => {
                    if (deletingPost) return;
                    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

                    try {
                      setDeletingPost(true);
                      setPostError("");
                      await deleteBoard(String(viewPost.id));
                      setBoardData((prev) => prev.filter((post) => !(post.type === "free" && post.id === String(viewPost.id))));
                      setViewPost(null);
                    } catch (e) {
                      setPostError(e instanceof Error ? e.message : "게시글 삭제에 실패했습니다.");
                    } finally {
                      setDeletingPost(false);
                    }
                  }}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-500 disabled:opacity-50"
                  aria-label="게시글 삭제"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="px-4 pb-5 pt-4">
            <div className="overflow-hidden rounded-[24px] border border-hp-100 bg-gradient-to-br from-white via-hp-50/30 to-white p-6">
              {viewPost.title ? <h1 className="text-xl font-bold leading-tight text-slate-950">{viewPost.title}</h1> : null}
              <p className={`whitespace-pre-wrap text-[15px] leading-7 text-slate-700 ${viewPost.title ? "mt-3" : ""}`}>
                {viewPost.content}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => void handleToggleLike(viewPost)}
                disabled={likeSubmittingPostId === viewPost.id}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  viewPost.likedByUser ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                } disabled:opacity-50`}
                aria-label="좋아요"
              >
                <Heart size={18} className={viewPost.likedByUser ? "fill-current" : ""} />
                좋아요 {viewPost.likes}
              </button>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Eye size={16} />
                {viewPost.views}
              </span>
            </div>
          </div>

          <div className="border-t border-hp-100 px-4 py-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">댓글</div>

            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {getInitial(currentUser?.nickname || "U")}
              </div>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => void addComment()}
                disabled={commentSubmitting || !commentText.trim()}
                className="text-sm font-semibold text-hp-600 disabled:text-slate-300"
              >
                등록
              </button>
            </div>

            {commentError && <p className="mb-4 text-sm text-red-500">{commentError}</p>}

            {(viewPost.comments || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                아직 댓글이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {(viewPost.comments || []).map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                      {getInitial(comment.author)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{comment.author}</span>
                          <span className="text-xs text-slate-400">{formatBoardCreatedAt(comment.createdAt)}</span>
                          {comment.author === currentUser?.nickname && (
                            <div className="ml-auto flex items-center gap-1">
                              {editingCommentId === comment.id ? (
                                <button
                                  onClick={cancelEditingComment}
                                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="댓글 수정 취소"
                                >
                                  <X size={14} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => startEditingComment(comment.id, comment.text)}
                                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="댓글 수정"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => void removeComment(comment.id)}
                                disabled={activeCommentId === comment.id}
                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-red-500 disabled:opacity-50"
                                aria-label="댓글 삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <div>
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              rows={3}
                              className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                            />
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => void saveComment(comment.id)}
                                disabled={activeCommentId === comment.id || !editingCommentText.trim()}
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {activeCommentId === comment.id ? "저장 중" : "저장"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl animate-in fade-in duration-500">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-black/5 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">자유게시판</h2>
              <p className="mt-1 text-sm text-slate-500">가볍게 공유하고 바로 반응을 확인하는 공간</p>
            </div>
            <button
              onClick={() => {
                setWriteType("free");
                setWriteModalOpen(true);
              }}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              새 게시물
            </button>
          </div>
        </div>
      </div>

      {freePosts.length === 0 ? (
        <div className="rounded-[28px] border border-black/10 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          아직 게시글이 없습니다.
          <br />
          첫 번째 피드를 올려보세요.
        </div>
      ) : (
        <div className="space-y-6">
          {freePosts.map((post) => (
            <article
              key={`free-${post.id}`}
              className="overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center gap-3 border-b border-hp-100 px-4 py-3">
                <button
                  onClick={() => setProfileModal(post.authorId)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-hp-100 p-[2px]"
                  title="프로필 보기"
                >
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-hp-700">
                    {getInitial(post.author)}
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    className="block truncate text-left text-sm font-semibold text-slate-900 hover:underline"
                    onClick={() => setProfileModal(post.authorId)}
                  >
                    {post.author}
                  </button>
                  <div className="text-xs text-slate-400">{formatBoardCreatedAt(post.createdAt)}</div>
                </div>
              </div>

              <button onClick={() => openPost(post)} className="block w-full text-left">
                <div className="border-b border-hp-100 bg-gradient-to-br from-white via-hp-50/30 to-white px-5 py-6">
                  {post.title ? <h3 className="text-xl font-bold leading-tight text-slate-950">{post.title}</h3> : null}
                  <p className={`text-[15px] leading-7 text-slate-700 ${post.title ? "mt-3" : ""}`}>{post.content}</p>
                </div>
              </button>

              <div className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => void handleToggleLike(post)}
                    disabled={likeSubmittingPostId === post.id}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                      post.likedByUser ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } disabled:opacity-50`}
                  >
                    <Heart size={16} className={post.likedByUser ? "fill-current" : ""} />
                    좋아요 {post.likes}
                  </button>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Eye size={16} />
                    {post.views}
                  </span>
                  <button
                    onClick={() => openPost(post)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                  >
                    <MessageCircle size={16} />
                    댓글 {post.comments?.length || 0}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                    {getInitial(currentUser?.nickname || "U")}
                  </div>
                  <input
                    value={inlineCommentDrafts[post.id] || ""}
                    onChange={(e) => setInlineCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitInlineComment(post);
                      }
                    }}
                    placeholder="이 게시물에 댓글 달기"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => void submitInlineComment(post)}
                    disabled={inlineCommentSubmittingPostId === post.id || !(inlineCommentDrafts[post.id] || "").trim()}
                    className="text-sm font-semibold text-hp-600 disabled:text-slate-300"
                  >
                    등록
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
