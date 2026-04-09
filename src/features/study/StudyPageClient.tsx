"use client";

import React, { useMemo, useState } from "react";
import { format, isSameDay, isSameYear } from "date-fns";
import { ArrowLeft, Eye, Heart, MapPin, MessageCircle, Pencil, Trash2, X, Zap } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";
import { BoardPost, useApp } from "@/lib/AppContext";
import { createComment, deleteComment as deleteCommentRequest, listComments, updateComment as updateCommentRequest } from "@/lib/comments";
import { saveLikedPost, toggleBoardLike } from "@/lib/likes";
import { getStudy } from "@/lib/study-api";
import { CERT_DATA, REGION_DATA } from "@/lib/constants";

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

export default function StudyPageClient() {
  const { boardData, setBoardData, currentUser, setProfileModal, setWriteModalOpen, setWriteType } = useApp();

  const studyPosts = useMemo(() => {
    const getTime = (value?: string) => {
      if (!value) return 0;
      const t = new Date(value).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    return boardData
      .filter((post) => post.type === "study")
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
  const [commentError, setCommentError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likeSubmittingPostId, setLikeSubmittingPostId] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [certFilter, setCertFilter] = useState("");
  const [locationFilterSido, setLocationFilterSido] = useState("");
  const [locationFilterSigungu, setLocationFilterSigungu] = useState("");

  const filteredPosts = useMemo(() => {
    return studyPosts.filter((post) => {
      if (certFilter && post.cert !== certFilter) return false;
      if (locationFilterSigungu && !post.location?.includes(locationFilterSigungu)) return false;
      if (locationFilterSido && !locationFilterSigungu && !post.location?.includes(locationFilterSido)) return false;
      return true;
    });
  }, [certFilter, locationFilterSido, locationFilterSigungu, studyPosts]);

  const syncPostComments = (postId: string, comments: BoardPost["comments"]) => {
    setViewPost((prev) => (prev && prev.id === postId ? { ...prev, comments } : prev));
    setBoardData((prev) => prev.map((post) => (post.type === "study" && post.id === postId ? { ...post, comments } : post)));
  };

  const loadComments = async (postId: string) => {
    const comments = await listComments("STUDY", postId);
    syncPostComments(postId, comments);
  };

  const openPost = (post: BoardPost) => {
    setViewPost(post);
    setCommentError("");
    setEditingCommentId(null);
    setEditingCommentText("");

    void (async () => {
      try {
        const [fresh, comments] = await Promise.all([getStudy(post.id, currentUser?.id), listComments("STUDY", post.id)]);
        if (!fresh) return;
        const hydrated = { ...fresh, comments, cert: post.cert };
        setViewPost((prev) => (prev && prev.id === post.id ? hydrated : prev));
        setBoardData((prev) => prev.map((item) => (item.type === "study" && item.id === post.id ? hydrated : item)));
      } catch {
        // Keep current modal data if refresh fails.
      }
    })();
  };

  const updatePostLocally = (postId: string, updater: (post: BoardPost) => BoardPost) => {
    setBoardData((prev) => prev.map((post) => (post.type === "study" && post.id === postId ? updater(post) : post)));
    setViewPost((prev) => (prev && prev.id === postId ? updater(prev) : prev));
  };

  const handleToggleLike = async (post: BoardPost) => {
    if (!currentUser || likeSubmittingPostId === post.id) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);
    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) return;

    try {
      setLikeSubmittingPostId(post.id);
      const nextLiked = !post.likedByUser;
      await toggleBoardLike("STUDY", targetId, userId);
      saveLikedPost(currentUser.id, "STUDY", post.id, nextLiked);
      updatePostLocally(post.id, (currentPost) => ({
        ...currentPost,
        likes: nextLiked ? currentPost.likes + 1 : Math.max(0, currentPost.likes - 1),
        likedByUser: nextLiked,
      }));
    } finally {
      setLikeSubmittingPostId(null);
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
        targetType: "STUDY",
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
        targetType: "STUDY",
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
    if (!Number.isFinite(userId)) return;

    try {
      setActiveCommentId(commentId);
      await deleteCommentRequest(commentId, userId);
      if (editingCommentId === commentId) cancelEditingComment();
      await loadComments(viewPost.id);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setActiveCommentId(null);
    }
  };

  const showMapPreview =
    typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

  if (viewPost) {
    return (
      <div className="mx-auto max-w-5xl animate-in fade-in duration-500">
        <div className="overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="sticky top-0 z-10 border-b border-hp-100 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => setViewPost(null)} className="rounded-full p-2 transition hover:bg-slate-100" aria-label="뒤로">
                <ArrowLeft size={20} />
              </button>
              <div className="text-sm font-semibold text-slate-700">스터디 모집</div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_360px]">
            <div className="border-b border-hp-100 lg:border-b-0 lg:border-r">
              <div className="border-b border-hp-100 px-5 py-5">
                <div className="mb-4 flex items-center gap-3">
                  <button
                    onClick={() => setProfileModal(viewPost.authorId)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-hp-100 p-[2px]"
                  >
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-hp-700">
                      {getInitial(viewPost.author)}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <button className="block truncate text-left text-sm font-semibold text-slate-900 hover:underline" onClick={() => setProfileModal(viewPost.authorId)}>
                      {viewPost.author}
                    </button>
                    <div className="text-xs text-slate-400">{formatBoardCreatedAt(viewPost.createdAt)}</div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-hp-100 bg-gradient-to-br from-white via-hp-50/30 to-white p-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-hp-50 px-3 py-1 text-xs font-semibold text-hp-700">
                      <MapPin size={12} />
                      {viewPost.location || "?μ냼 誘몄젙"}
                    </span>
                    {viewPost.cert && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{viewPost.cert}</span>}
                  </div>
                  {viewPost.title ? <h1 className="text-2xl font-bold leading-tight text-slate-950">{viewPost.title}</h1> : null}
                  <p className={`whitespace-pre-wrap text-[15px] leading-7 text-slate-700 ${viewPost.title ? "mt-3" : ""}`}>
                    {viewPost.content}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => void handleToggleLike(viewPost)}
                    disabled={likeSubmittingPostId === viewPost.id}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                      viewPost.likedByUser ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } disabled:opacity-50`}
                  >
                    <Heart size={16} className={viewPost.likedByUser ? "fill-current" : ""} />
                    좋아요 {viewPost.likes}
                  </button>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Eye size={16} />
                    {viewPost.views}
                  </span>
                </div>
              </div>

              <div className="px-5 py-5">
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
                                    <button onClick={cancelEditingComment} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
                                      <X size={14} />
                                    </button>
                                  ) : (
                                    <button onClick={() => startEditingComment(comment.id, comment.text)} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
                                      <Pencil size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => void removeComment(comment.id)}
                                    disabled={activeCommentId === comment.id}
                                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-red-500 disabled:opacity-50"
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

            <aside className="bg-hp-50/40 px-5 py-5">
              <div className="rounded-3xl border border-hp-100 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-hp-500">Study Spot</div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-hp-50 px-3 py-1 text-sm font-semibold text-hp-700">
                  <MapPin size={14} />
                  {viewPost.location || "장소 미정"}
                </div>

                {viewPost.lat && viewPost.lng ? (
                  showMapPreview ? (
                    <div className="mt-4">
                      <KakaoMap
                        apiKey="894423a9ffcffb29a1e5d50427ded82e"
                        markers={[{ lat: viewPost.lat, lng: viewPost.lng, locationName: viewPost.location || "스터디 장소" }]}
                        center={{ lat: viewPost.lat, lng: viewPost.lng }}
                        level={3}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-dashed border-hp-200 bg-hp-50 px-5 py-10 text-center text-sm text-slate-500">
                      localhost 환경에서는 지도 미리보기를 생략했습니다.
                      <div className="mt-2 font-semibold text-slate-700">{viewPost.location}</div>
                    </div>
                  )
                ) : (
                  <div className="mt-4 rounded-3xl border border-dashed border-hp-200 bg-hp-50 px-5 py-10 text-center text-sm text-slate-400">
                    아직 장소 정보가 등록되지 않았습니다.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in duration-500">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">스터디 모집</h2>
          <p className="mt-1 text-sm text-slate-500">장소와 관심 분야를 보고 바로 합류할 스터디를 찾습니다.</p>
        </div>
        <button
          onClick={() => {
            setWriteType("study");
            setWriteModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-hp-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-hp-700"
        >
          <Zap size={16} />
          모집글 작성
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <select value={certFilter} onChange={(e) => setCertFilter(e.target.value)} className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500">
          <option value="">전체 자격증</option>
          {Object.entries(CERT_DATA).map(([category, certificates]) => (
            <optgroup key={category} label={category}>
              {certificates.map((certificate) => (
                <option key={certificate} value={certificate}>
                  {certificate}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          value={locationFilterSido}
          onChange={(e) => {
            setLocationFilterSido(e.target.value);
            setLocationFilterSigungu("");
          }}
          className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500"
        >
          <option value="">전체 지역</option>
          {Object.keys(REGION_DATA).map((sido) => (
            <option key={sido} value={sido}>
              {sido}
            </option>
          ))}
        </select>
        <select
          value={locationFilterSigungu}
          onChange={(e) => setLocationFilterSigungu(e.target.value)}
          disabled={!locationFilterSido}
          className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500 disabled:opacity-40"
        >
          <option value="">전체 구/군</option>
          {(REGION_DATA[locationFilterSido] || []).map((sigungu) => (
            <option key={sigungu} value={sigungu}>
              {sigungu}
            </option>
          ))}
        </select>
        {(certFilter || locationFilterSido) && (
          <button
            onClick={() => {
              setCertFilter("");
              setLocationFilterSido("");
              setLocationFilterSigungu("");
            }}
            className="rounded-xl border px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-50"
          >
            필터 초기화
          </button>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-[28px] border border-hp-100 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          조건에 맞는 스터디가 없습니다.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredPosts.map((post) => (
            <article key={`study-${post.id}`} className="overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="border-b border-hp-100 px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setProfileModal(post.authorId)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-hp-100 text-sm font-bold text-hp-700"
                  >
                    {getInitial(post.author)}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button className="block truncate text-left text-sm font-semibold text-slate-900 hover:underline" onClick={() => setProfileModal(post.authorId)}>
                      {post.author}
                    </button>
                    <div className="mt-1 text-xs text-slate-400">{formatBoardCreatedAt(post.createdAt)}</div>
                  </div>
                </div>
              </div>

              <button onClick={() => openPost(post)} className="block w-full text-left">
                <div className="px-5 py-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-hp-50 px-3 py-1 text-xs font-semibold text-hp-700">
                      <MapPin size={12} />
                      {post.location || "장소 미정"}
                    </span>
                    {post.cert && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{post.cert}</span>}
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-slate-950">{post.title}</h3>
                  <p className="mt-3 line-clamp-4 text-[15px] leading-7 text-slate-700">{post.content}</p>
                </div>
              </button>

              <div className="border-t border-hp-100 px-5 py-4">
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
                  <button onClick={() => openPost(post)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
                    <MessageCircle size={16} />
                    댓글 {post.comments?.length || 0}
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
