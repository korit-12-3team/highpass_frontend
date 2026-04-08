"use client";

import React, { useMemo, useState } from "react";
import { format, isSameDay, isSameYear } from "date-fns";
import { ArrowRight, Eye, Heart, MessageCircle, Trash2 } from "lucide-react";
import { BoardPost, PostComment, useApp } from "@/lib/AppContext";
import { deleteBoard, getBoard } from "@/lib/boards";

function formatBoardCreatedAt(value?: string) {
  if (!value) return "오늘";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  if (isSameDay(date, now)) return format(date, "HH:mm");
  if (isSameYear(date, now)) return format(date, "MM.dd");
  return format(date, "yyyy.MM.dd");
}

function formatBoardCreatedAtFull(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "yyyy.MM.dd HH:mm");
}

export default function FreeBoardPageClient() {
  const { boardData, setBoardData, currentUser, setProfileModal, setWriteModalOpen, setWriteType } =
    useApp();

  const freePosts = useMemo(() => {
    const getTime = (value?: string) => {
      if (!value) return 0;
      const t = new Date(value).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    return boardData
      .filter((item) => item.type === "free")
      .slice()
      .sort((a, b) => {
        const dt = getTime(b.createdAt) - getTime(a.createdAt);
        if (dt !== 0) return dt;
        // If createdAt is missing/invalid, fall back to numeric id when possible.
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

  const openPost = (post: BoardPost) => {
    // Open immediately for UI responsiveness, then re-fetch from server.
    // Backend increments viewCount on GET /api/boards/{freeBoardId}.
    setViewPost(post);
    setPostError("");

    void (async () => {
      try {
        const fresh = await getBoard(String(post.id));
        if (!fresh) return;
        setViewPost((prev) => (prev && prev.id === post.id ? fresh : prev));
        setBoardData((prev) => prev.map((p) => (p.id === post.id ? fresh : p)));
      } catch (e) {
        setPostError(e instanceof Error ? e.message : "게시글을 불러오지 못했습니다.");
      }
    })();
  };

  const addComment = () => {
    if (!viewPost) return;
    if (!commentText.trim()) return;

    const newComment: PostComment = {
      id: Date.now(),
      author: currentUser.nickname,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedPost: BoardPost = {
      ...viewPost,
      comments: [...(viewPost.comments || []), newComment],
    };

    setViewPost(updatedPost);
    setBoardData((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setCommentText("");
  };

  const deleteComment = (commentId: number) => {
    if (!viewPost) return;
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    const updatedPost: BoardPost = {
      ...viewPost,
      comments: (viewPost.comments || []).filter((c) => c.id !== commentId),
    };

    setViewPost(updatedPost);
    setBoardData((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  if (viewPost) {
    const createdAtLabel = formatBoardCreatedAt(viewPost.createdAt);
    const createdAtFull = formatBoardCreatedAtFull(viewPost.createdAt);

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
        <div className="bg-white border-x border-b rounded-b-2xl overflow-hidden">
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-4 z-10">
            <button
              onClick={() => setViewPost(null)}
              className="hover:bg-slate-100 p-2 rounded-full transition-colors"
              aria-label="뒤로"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>

            <span className="font-bold text-lg">게시글</span>

            <div className="ml-auto">
              {viewPost.authorId === currentUser.id && (
                <button
                  disabled={deletingPost}
                  onClick={async () => {
                    if (deletingPost) return;
                    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

                    try {
                      setDeletingPost(true);
                      setPostError("");
                      await deleteBoard(String(viewPost.id));
                      setBoardData((prev) => prev.filter((post) => post.id !== String(viewPost.id)));
                      setViewPost(null);
                    } catch (e) {
                      setPostError(e instanceof Error ? e.message : "게시글 삭제에 실패했습니다.");
                    } finally {
                      setDeletingPost(false);
                    }
                  }}
                  className="text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-60"
                >
                  {deletingPost ? "삭제 중..." : "삭제"}
                </button>
              )}
            </div>
          </div>

          {postError && <p className="px-4 pt-4 text-sm text-red-500">{postError}</p>}

          <div className="px-4 pt-4 pb-3 border-b">
            <div className="flex gap-3 mb-3">
              <div
                className="w-10 h-10 bg-hp-500 rounded-full flex items-center justify-center font-bold text-white shrink-0 cursor-pointer"
                onClick={() => setProfileModal(viewPost.authorId)}
                title="프로필 보기"
              >
                {viewPost.author.substring(0, 1)}
              </div>
              <div>
                <p
                  className="font-bold text-sm leading-tight cursor-pointer hover:underline"
                  onClick={() => setProfileModal(viewPost.authorId)}
                >
                  {viewPost.author}
                </p>
                <p className="text-slate-400 text-xs">@{viewPost.author.toLowerCase().replace(/\s/g, "_")}</p>
              </div>
            </div>

            {viewPost.title && <p className="font-bold text-base mb-1">{viewPost.title}</p>}
            <p className="text-slate-900 text-base leading-relaxed whitespace-pre-wrap mb-4">{viewPost.content}</p>

            <p className="text-slate-400 text-sm mb-4" title={createdAtFull}>
              {createdAtLabel} · <span className="font-bold text-slate-700">{viewPost.views}</span> 조회
            </p>

            <div className="border-t border-b py-3 flex gap-6 text-slate-500 text-sm">
              <span>
                <span className="font-bold text-slate-900">{viewPost.comments?.length || 0}</span> 댓글
              </span>
              <span>
                <span className="font-bold text-slate-900">{viewPost.likes}</span> 좋아요
              </span>
            </div>

            <div className="flex justify-around pt-1 text-slate-400">
              <button className="flex items-center gap-1.5 hover:text-hp-500 p-2 rounded-full hover:bg-hp-50 transition-colors text-sm">
                <MessageCircle size={20} />
              </button>
              <button className="flex items-center gap-1.5 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors text-sm">
                <Heart size={20} />
              </button>
            </div>
          </div>

          <div className="px-4 py-4">
            <h3 className="font-bold mb-3">댓글</h3>

            <div className="flex gap-2 mb-4">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="flex-1 border border-hp-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-hp-500"
              />
              <button
                onClick={addComment}
                className="bg-hp-600 hover:bg-hp-700 transition-colors text-white font-bold rounded-xl px-4"
              >
                등록
              </button>
            </div>

            {(viewPost.comments || []).length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">댓글이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {(viewPost.comments || []).map((comment) => (
                  <div key={comment.id} className="bg-hp-50 border border-hp-100 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{comment.author}</span>
                      <span className="text-slate-400 text-xs">
                        · {formatBoardCreatedAt(comment.createdAt)}
                      </span>
                      {comment.author === currentUser.nickname && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="ml-auto text-slate-400 hover:text-red-600 transition-colors"
                          aria-label="댓글 삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{comment.text}</p>
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
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white/80 border border-hp-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-hp-100 px-4 py-3 z-10">
          <h2 className="font-bold text-xl">자유게시판</h2>
        </div>

        <div className="border-b border-hp-100 px-4 py-3 flex justify-end">
          <button
            onClick={() => {
              setWriteType("free");
              setWriteModalOpen(true);
            }}
            className="bg-hp-600 text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-hp-700 transition-colors shadow-sm"
          >
            글쓰기
          </button>
        </div>

        <div className="p-3 md:p-4 bg-hp-50/60">
          {freePosts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-xl border border-hp-100">
              아직 게시글이 없습니다.
              <br />
              첫 번째 글을 작성해보세요!
            </div>
          ) : (
            <div className="space-y-3">
              {freePosts.map((post) => {
                const createdAtLabel = formatBoardCreatedAt(post.createdAt);
                const createdAtFull = formatBoardCreatedAtFull(post.createdAt);

                return (
                  <div
                    key={post.id}
                    className="group cursor-pointer rounded-2xl border border-hp-100 bg-white shadow-sm hover:shadow-md hover:border-hp-300 transition-all"
                    onClick={() => openPost(post)}
                  >
                    <div className="flex gap-3 p-4">
                      <div
                        className="w-10 h-10 bg-hp-100 rounded-full flex items-center justify-center font-bold text-hp-700 shrink-0 text-sm cursor-pointer group-hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileModal(post.authorId);
                        }}
                        title="프로필 보기"
                      >
                        {post.author.substring(0, 1)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-bold text-sm cursor-pointer hover:underline text-slate-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileModal(post.authorId);
                            }}
                          >
                            {post.author}
                          </span>
                          <span className="text-slate-400 text-sm">@{post.author.toLowerCase().replace(/\s/g, "_")}</span>
                          <span className="ml-auto text-slate-400 text-xs tabular-nums" title={createdAtFull}>
                            {createdAtLabel}
                          </span>
                        </div>

                        {post.title ? (
                          <p className="font-black text-base text-slate-900 mt-2 leading-snug line-clamp-1">
                            {post.title}
                          </p>
                        ) : (
                          <p className="font-black text-base text-slate-900 mt-2 leading-snug line-clamp-1">
                            (제목 없음)
                          </p>
                        )}

                        <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 mt-1">{post.content}</p>

                        <div className="mt-3 flex items-center gap-3 text-slate-500 text-xs">
                          <span className="flex items-center gap-1.5">
                            <MessageCircle size={14} />
                            <span className="tabular-nums">{post.comments?.length || 0}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Heart size={14} />
                            <span className="tabular-nums">{post.likes}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye size={14} />
                            <span className="tabular-nums">{post.views}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="h-1 w-full bg-gradient-to-r from-hp-600 via-hp-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
