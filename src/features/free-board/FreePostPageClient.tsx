"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Eye, Heart, Pencil, Trash2, X } from "lucide-react";
import { useApp, type BoardPost } from "@/lib/AppContext";
import { deleteBoard, getBoard } from "@/lib/boards";
import { createComment, deleteComment as deleteCommentRequest, listComments, updateComment as updateCommentRequest } from "@/lib/comments";
import { saveLikedPost, toggleBoardLike } from "@/lib/likes";
import { formatBoardCreatedAt, getInitial } from "@/features/boards/detail-utils";

export default function FreePostPageClient() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { boardData, setBoardData, currentUser, setProfileModal } = useApp();
  const postId = String(params.postId ?? "");
  const returnTo = searchParams.get("returnTo");

  const basePost = useMemo(
    () => boardData.find((post) => post.type === "free" && post.id === postId) ?? null,
    [boardData, postId],
  );

  const [post, setPost] = useState<BoardPost | null>(basePost);
  const [commentText, setCommentText] = useState("");
  const [postError, setPostError] = useState("");
  const [deletingPost, setDeletingPost] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [likeSubmitting, setLikeSubmitting] = useState(false);

  useEffect(() => {
    if (basePost) {
      setPost(basePost);
    }
  }, [basePost]);

  useEffect(() => {
    if (!postId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [fresh, comments] = await Promise.all([getBoard(postId, currentUser?.id), listComments("FREE", postId)]);
          if (cancelled || !fresh) return;

          const hydrated = { ...fresh, comments };
          setPost(hydrated);
          setBoardData((prev) => prev.map((item) => (item.type === "free" && item.id === postId ? hydrated : item)));
        } catch (e) {
          if (!cancelled) {
            setPostError(e instanceof Error ? e.message : "게시글을 불러오지 못했습니다.");
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentUser?.id, postId, setBoardData]);

  const syncComments = useCallback(
    (comments: BoardPost["comments"]) => {
      setPost((prev) => (prev ? { ...prev, comments } : prev));
      setBoardData((prev) => prev.map((item) => (item.type === "free" && item.id === postId ? { ...item, comments } : item)));
    },
    [postId, setBoardData],
  );

  const loadComments = useCallback(async () => {
    const comments = await listComments("FREE", postId);
    syncComments(comments);
  }, [postId, syncComments]);

  const updatePostLocally = useCallback(
    (updater: (current: BoardPost) => BoardPost) => {
      setPost((prev) => (prev ? updater(prev) : prev));
      setBoardData((prev) =>
        prev.map((item) => (item.type === "free" && item.id === postId ? updater(item) : item)),
      );
    },
    [postId, setBoardData],
  );

  const handleToggleLike = async () => {
    if (!post || !currentUser || likeSubmitting) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);

    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) {
      setPostError("좋아요 요청에 필요한 사용자 또는 게시글 ID가 올바르지 않습니다.");
      return;
    }

    try {
      setLikeSubmitting(true);
      const nextLiked = !post.likedByUser;
      await toggleBoardLike("FREE", targetId, userId);
      saveLikedPost(currentUser.id, "FREE", post.id, nextLiked);
      updatePostLocally((currentPost) => ({
        ...currentPost,
        likes: nextLiked ? currentPost.likes + 1 : Math.max(0, currentPost.likes - 1),
        likedByUser: nextLiked,
      }));
    } catch (e) {
      setPostError(e instanceof Error ? e.message : "좋아요 처리에 실패했습니다.");
    } finally {
      setLikeSubmitting(false);
    }
  };

  const addComment = async () => {
    if (!post || !currentUser || !commentText.trim()) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);

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
      await loadComments();
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 등록에 실패했습니다.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveComment = async (commentId: number) => {
    if (!post || !currentUser || !editingCommentText.trim()) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);

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
      await loadComments();
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 수정에 실패했습니다.");
    } finally {
      setActiveCommentId(null);
    }
  };

  const removeComment = async (commentId: number) => {
    if (!currentUser || !window.confirm("댓글을 삭제하시겠습니까?")) return;

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
      await loadComments();
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setActiveCommentId(null);
    }
  };

  if (!post) {
    return (
      <div className="mx-auto max-w-xl rounded-[28px] border border-hp-100 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        게시글을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl animate-in fade-in duration-500">
      <div className="overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="sticky top-0 z-10 border-b border-hp-100 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => router.push(returnTo ? decodeURIComponent(returnTo) : "/free")}
              className="rounded-full p-2 transition hover:bg-slate-100"
              aria-label="뒤로"
            >
              ←
            </button>
            <div className="text-sm font-semibold text-slate-700">게시글</div>
          </div>
        </div>

        {postError && <p className="px-4 pt-4 text-sm text-red-500">{postError}</p>}

        <div className="border-b border-hp-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileModal(post.authorId)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-hp-100 p-[2px]"
              title="프로필 보기"
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-hp-700">
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
            {post.authorId === currentUser?.id && (
              <button
                disabled={deletingPost}
                onClick={async () => {
                  if (deletingPost || !window.confirm("게시글을 삭제하시겠습니까?")) return;

                  try {
                    setDeletingPost(true);
                    setPostError("");
                    await deleteBoard(String(post.id));
                    setBoardData((prev) => prev.filter((item) => !(item.type === "free" && item.id === String(post.id))));
                    router.push(returnTo ? decodeURIComponent(returnTo) : "/free");
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
            {post.title ? <h1 className="text-xl font-bold leading-tight text-slate-950">{post.title}</h1> : null}
            <p className={`whitespace-pre-wrap text-[15px] leading-7 text-slate-700 ${post.title ? "mt-3" : ""}`}>{post.content}</p>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => void handleToggleLike()}
              disabled={likeSubmitting}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                post.likedByUser ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              } disabled:opacity-50`}
            >
              <Heart size={18} className={post.likedByUser ? "fill-current" : ""} />
              좋아요 {post.likes}
            </button>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Eye size={16} />
              {post.views}
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

          {(post.comments || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
              아직 댓글이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {(post.comments || []).map((comment) => (
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
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentText(comment.text);
                                  setCommentError("");
                                }}
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
                              {activeCommentId === comment.id ? "저장 중.." : "저장"}
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
