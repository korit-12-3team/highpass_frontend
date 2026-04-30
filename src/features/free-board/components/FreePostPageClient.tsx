"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, Heart, Pencil, Trash2, X } from "lucide-react";
import type { BoardPost, PostComment } from "@/entities/common/types";
import {
  createComment,
  deleteComment as deleteCommentRequest,
  listComments,
  updateComment as updateCommentRequest,
} from "@/features/boards/api/comments";
import { isPostLiked, saveLikedPost, toggleBoardLike } from "@/features/boards/api/likes";
import { formatBoardCreatedAt, getInitial } from "@/features/boards/utils/detail-utils";
import { deleteBoard } from "@/features/free-board/api/boards";
import ReportDialog from "@/features/reports/components/ReportDialog";
import { useApp } from "@/shared/context/AppContext";
import { updateBoard } from "@/features/free-board/api/boards";
const TAGS = {
  "분위기": ["잡담", "일상", "유머"],
  "공부": ["질문", "정보공유", "꿀팁", "자격증"],
  "후기": ["합격후기", "스터디후기", "취업"],
};


export default function FreePostPageClient({
  postId,
  initialPost,
  initialComments,
  returnTo,
}: {
  postId: string;
  initialPost: BoardPost | null;
  initialComments: PostComment[];
  returnTo: string | null;
}) {
  const router = useRouter();
  const { currentUser, setProfileModal } = useApp();
  const [post, setPost] = useState<BoardPost | null>(() => (initialPost ? { ...initialPost, comments: initialComments } : null));
  const [commentText, setCommentText] = useState("");
  const [postError, setPostError] = useState("");
  const [deletingPost, setDeletingPost] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [postEditTags, setPostEditTags] = useState<string[]>([]);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [postEditTitle, setPostEditTitle] = useState("");
  const [postEditContent, setPostEditContent] = useState("");
  const [postSaving, setPostSaving] = useState(false);
  const [postEditError, setPostEditError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [reportTarget, setReportTarget] = useState<null | {
    targetType: "post" | "comment";
    targetId: string;
    title: string;
    subtitle: string;
  }>(null);

  useEffect(() => {
    setPost(initialPost ? { ...initialPost, comments: initialComments } : null);
  }, [initialComments, initialPost]);

  useEffect(() => {
    if (!currentUser) return;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            likedByUser: isPostLiked(currentUser.id, "FREE", prev.id),
          }
        : prev,
    );
  }, [currentUser]);

  const syncComments = useCallback((comments: BoardPost["comments"]) => {
    setPost((prev) => (prev ? { ...prev, comments } : prev));
  }, []);

  const loadComments = useCallback(async () => {
    const comments = await listComments("FREE", postId);
    syncComments(comments);
  }, [postId, syncComments]);

  const updatePostLocally = useCallback((updater: (current: BoardPost) => BoardPost) => {
    setPost((prev) => (prev ? updater(prev) : prev));
  }, []);

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
      setCommentError("댓글 요청에 필요한 사용자 ID가 올바르지 않습니다.");
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


const saveBoardPost = async () => {
  if (!post) return;
  const title = postEditTitle.trim() || post.title;
  const content = postEditContent.trim() || post.content;

  try {
    setPostSaving(true);
    const updated = await updateBoard(post.id, {
      title,
      content,
      tags: postEditTags,
    });

    setPost({ ...updated, comments: post.comments || [] });
    setIsEditingPost(false);
  } catch (error: any) {
    setPostEditError(error.response?.data?.message || "수정에 실패했습니다.");
  } finally {
    setPostSaving(false);
  }
}

const addTag = () => {
  const trimmed = tagInput.trim().replace(/^#/, "");
  if (trimmed && !postEditTags.includes(trimmed)) {
    setPostEditTags([...postEditTags, trimmed]);
  }
  setTagInput("");
};

const removeTag = (tagToRemove: string) => {
  setPostEditTags(postEditTags.filter((t) => t !== tagToRemove));
};

const toggleTag = (tag: string) => {
  setPostEditTags((prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
  );
};



return (
  <div className="mx-auto max-w-xl animate-in fade-in duration-500">
    {reportTarget ? (
      <ReportDialog
        isOpen={!!reportTarget}
        targetType={reportTarget.targetType}
        targetId={reportTarget.targetId}
        title={reportTarget.title}
        subtitle={reportTarget.subtitle}
        onClose={() => setReportTarget(null)}
        onSubmitted={() => setReportTarget(null)}
      />
    ) : null}

    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(15,23,42,0.10)]">

      {/* 상단 네비 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-5 py-3.5">
          <button
            onClick={() => router.push(returnTo ? decodeURIComponent(returnTo) : "/free")}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="뒤로"
          >
            ← 자유게시판
          </button>
        </div>
        <div className="h-px bg-slate-100" />
      </div>

      {postError && <p className="px-6 pt-4 text-sm text-red-500">{postError}</p>}

      {/* 제목 */}
      {post.title && (
        <div className="px-6 pt-6">
          <h1 className="text-xl font-black leading-tight tracking-tight text-slate-950">
            {post.title}
          </h1>
        </div>
      )}

      {/* 작성자 (크기 축소) */}
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={() => setProfileModal(post.authorId)}
          className="flex items-center gap-2 rounded-full transition hover:opacity-80"
        >
          {/* 아이콘 및 텍스트 크기 축소: h-8->h-7, w-8->w-7, text-sm->text-xs 등 */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
            {getInitial(post.author)}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800">{post.author}</p>
            <p className="text-[10px] text-slate-400">{formatBoardCreatedAt(post.createdAt)}</p>
          </div>
        </button>

        {post.authorId === currentUser?.id ? (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <button
              onClick={() => {
                setPostEditTitle(post.title);
                setPostEditContent(post.content);
                setPostEditTags(post.tags || []);
                setIsEditingPost(true);
              }}
            >
              수정
          </button>
            <span className="text-slate-200">|</span>
            <button
              disabled={deletingPost}
              onClick={async () => {
                if (deletingPost || !window.confirm("게시글을 삭제하시겠습니까?")) return;
                try {
                  setDeletingPost(true);
                  setPostError("");
                  await deleteBoard(String(post.id));
                  router.push(returnTo ? decodeURIComponent(returnTo) : "/free");
                } catch (e) {
                  setPostError(e instanceof Error ? e.message : "게시글 삭제에 실패했습니다.");
                } finally {
                  setDeletingPost(false);
                }
              }}
              className="transition hover:text-red-500 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              setReportTarget({
                targetType: "post",
                targetId: `free-${post.id}`,
                title: "이 게시글을 신고할까요?",
                subtitle: "자유게시판 게시글에 대한 신고 사유를 선택해 주세요.",
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-500 transition hover:bg-rose-100"
          >
            <AlertTriangle size={12} />
            신고
          </button>
        )}
      </div>

      <div className="px-6 pb-2">
  <div className="mb-4 h-px bg-slate-100" />
  
  {isEditingPost ? (
    <div className="animate-in fade-in slide-in-from-top-1">
      <input
        value={postEditTitle}
        onChange={(e) => setPostEditTitle(e.target.value)}
        className="mb-3 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-lg font-bold outline-none focus:border-hp-500 focus:bg-white"
      />
      <textarea
        value={postEditContent}
        onChange={(e) => setPostEditContent(e.target.value)}
        rows={8}
        className="w-full resize-none rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-[15px] leading-7 outline-none focus:border-hp-500 focus:bg-white"
      />

      <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        {Object.entries(TAGS).map(([category, tagList]) => (
          <div key={category}>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tagList.map((tagName) => {
                const isSelected = postEditTags.includes(tagName);
                return (
                  <button
                    key={tagName}
                    type="button"
                    onClick={() => toggleTag(tagName)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-hp-600 text-white shadow-md scale-105"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-hp-300"
                    }`}
                  >
                    #{tagName}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {postEditError && <p className="mt-2 text-xs text-red-500">{postEditError}</p>}
      
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={() => setIsEditingPost(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
          취소
        </button>
        <button 
          onClick={saveBoardPost} 
          disabled={postSaving} 
          className="rounded-lg bg-hp-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-hp-700 disabled:opacity-50"
        >
          {postSaving ? "저장 중..." : "저장 완료"}
        </button>
      </div>
    </div>
  ) : (
    <>
      <div className="min-h-[250px]">
        <p className="whitespace-pre-wrap text-[15px] leading-8 text-slate-700">{post.content}</p>
      </div>
      {post.tags && post.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">#{tag}</span>
          ))}
        </div>
      )}
    </>
  )}
</div>

      {/* 좋아요 / 조회수 */}
      <div className="flex items-center gap-3 px-6 py-5">
        <button
          onClick={() => void handleToggleLike()}
          disabled={likeSubmitting}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
            post.likedByUser
              ? "bg-red-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          } disabled:opacity-50`}
        >
          <Heart size={13} className={post.likedByUser ? "fill-current" : ""} />
          좋아요 {post.likes}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Eye size={13} />
          {post.views}
        </span>
      </div>

      {/* 댓글 영역 (기존과 동일) */}
      <div className="border-t border-slate-100 px-6 py-5">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
          댓글 {(post.comments || []).length}
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); void addComment(); }}
          className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition focus-within:bg-slate-100"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
            {getInitial(currentUser?.nickname || "U")}
          </div>
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 남겨보세요"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={commentSubmitting || !commentText.trim()}
            className="text-xs font-black text-hp-600 transition hover:text-hp-700 disabled:text-slate-300"
          >
            등록
          </button>
        </form>

        {commentError && <p className="mb-4 text-sm text-red-500">{commentError}</p>}

        {(post.comments || []).length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
            아직 댓글이 없어요. 첫 댓글을 남겨보세요!
          </div>
        ) : (
          <div className="space-y-3">
            {(post.comments || []).map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">
                  {getInitial(comment.author)}
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    {comment.authorId ? (
                      <button
                        type="button"
                        className="text-xs font-black text-slate-800 transition hover:text-hp-600"
                        onClick={() => setProfileModal(comment.authorId!)}
                      >
                        {comment.author}
                      </button>
                    ) : (
                      <span className="text-xs font-black text-slate-800">{comment.author}</span>
                    )}
                    <span className="text-[10px] text-slate-400">{formatBoardCreatedAt(comment.createdAt)}</span>

                    {comment.authorId === currentUser?.id ||
                    (!comment.authorId && comment.author === currentUser?.nickname) ? (
                      <div className="ml-auto flex items-center gap-1">
                        {editingCommentId === comment.id ? (
                          <button
                            onClick={cancelEditingComment}
                            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200"
                          >
                            <X size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.text);
                              setCommentError("");
                            }}
                            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => void removeComment(comment.id)}
                          disabled={activeCommentId === comment.id}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            targetType: "comment",
                            targetId: String(comment.id),
                            title: "이 댓글을 신고할까요?",
                            subtitle: `${comment.author}님의 댓글에 대한 신고 사유를 선택해 주세요.`,
                          })
                        }
                        className="ml-auto inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-500 transition hover:bg-rose-100"
                      >
                        <AlertTriangle size={10} />
                        신고
                      </button>
                    )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <div>
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => void saveComment(comment.id)}
                          disabled={activeCommentId === comment.id || !editingCommentText.trim()}
                          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {activeCommentId === comment.id ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.text}</p>
                  )}
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
