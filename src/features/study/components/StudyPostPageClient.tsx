"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Heart, MapPin, Pencil, Search, Trash2, X } from "lucide-react";
import KakaoMap from "@/shared/components/map/KakaoMap";
import type { BoardPost, PostComment, SearchPlace } from "@/entities/common/types";
import { createComment, deleteComment as deleteCommentRequest, listComments, updateComment as updateCommentRequest } from "@/features/boards/api/comments";
import { isPostLiked, saveLikedPost, toggleBoardLike } from "@/features/boards/api/likes";
import { CERT_DATA } from "@/shared/constants";
import { deleteStudy, updateStudy } from "@/features/study/api/study-api";
import { formatBoardCreatedAt, getInitial } from "@/features/boards/utils/detail-utils";
import { useApp } from "@/shared/context/AppContext";
import { getMyChatRooms, joinStudyChatRoom } from "@/services/realtime/stomp";


const CUSTOM_CERT_FILTER = "기타";

export default function StudyPostPageClient({
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
  const { currentUser, setProfileModal, setChatRooms, setActiveChatRoomId } = useApp();
  const [post, setPost] = useState<BoardPost | null>(() =>
    initialPost ? { ...initialPost, comments: initialComments } : null,
  );
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingPost, setEditingPost] = useState(false);
  const [postEditTitle, setPostEditTitle] = useState("");
  const [postEditContent, setPostEditContent] = useState("");
  const [postEditCertCategory, setPostEditCertCategory] = useState("");
  const [postEditCert, setPostEditCert] = useState("");
  const [postEditLocation, setPostEditLocation] = useState("");
  const [placeKeyword, setPlaceKeyword] = useState("");
  const [placeResults, setPlaceResults] = useState<SearchPlace[]>([]);
  const [selectedEditPlace, setSelectedEditPlace] = useState<SearchPlace | null>(null);
  const [postEditError, setPostEditError] = useState("");
  const [postSaving, setPostSaving] = useState(false);
  const [postDeleting, setPostDeleting] = useState(false);

  const certificateCategories = useMemo(
    () => Object.keys(CERT_DATA).filter((category) => category !== CUSTOM_CERT_FILTER),
    [],
  );
  const certOptions = useMemo(
    () => (postEditCertCategory && postEditCertCategory !== CUSTOM_CERT_FILTER ? CERT_DATA[postEditCertCategory] || [] : []),
    [postEditCertCategory],
  );
  const isCustomCert = postEditCertCategory === CUSTOM_CERT_FILTER;

  useEffect(() => {
    setPost(initialPost ? { ...initialPost, comments: initialComments } : null);
  }, [initialComments, initialPost]);

  useEffect(() => {
    if (!currentUser) return;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            likedByUser: isPostLiked(currentUser.id, "STUDY", prev.id),
          }
        : prev,
    );
  }, [currentUser]);

  useEffect(() => {
    if (!post) return;

    const matchedCategory =
      Object.entries(CERT_DATA).find(([category, certificates]) => category !== CUSTOM_CERT_FILTER && certificates.includes(post.cert || ""))?.[0] ?? "";

    setPostEditTitle(post.title || "");
    setPostEditContent(post.content || "");
    setPostEditCertCategory(matchedCategory || ((post.cert || "").trim() ? CUSTOM_CERT_FILTER : ""));
    setPostEditCert(post.cert || "");
    setPostEditLocation(post.location || "");
    setPlaceKeyword(post.location || "");
    setSelectedEditPlace(
      post.location && typeof post.lat === "number" && typeof post.lng === "number"
        ? {
            id: `study-${post.id}`,
            name: post.location,
            address: post.location,
            lat: post.lat,
            lng: post.lng,
          }
        : null,
    );
  }, [post]);

  const syncComments = useCallback(
    (comments: BoardPost["comments"]) => {
      setPost((prev) => (prev ? { ...prev, comments } : prev));
    },
    [],
  );

  const loadComments = useCallback(async () => {
    const comments = await listComments("STUDY", postId);
    syncComments(comments);
  }, [postId, syncComments]);

  const updatePostLocally = useCallback(
    (updater: (current: BoardPost) => BoardPost) => {
      setPost((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  const handleToggleLike = async () => {
    if (!post || !currentUser || likeSubmitting) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);
    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) return;

    try {
      setLikeSubmitting(true);
      const nextLiked = !post.likedByUser;
      await toggleBoardLike("STUDY", targetId, userId);
      saveLikedPost(currentUser.id, "STUDY", post.id, nextLiked);
      updatePostLocally((currentPost) => ({
        ...currentPost,
        likes: nextLiked ? currentPost.likes + 1 : Math.max(0, currentPost.likes - 1),
        likedByUser: nextLiked,
      }));
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
        targetType: "STUDY",
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
        targetType: "STUDY",
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
    if (!Number.isFinite(userId)) return;

    try {
      setActiveCommentId(commentId);
      await deleteCommentRequest(commentId, userId);
      if (editingCommentId === commentId) cancelEditingComment();
      await loadComments();
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setActiveCommentId(null);
    }
  };

  const showMapPreview =
    typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
  const canManagePost = !!currentUser && currentUser.id === post?.authorId;

  const cancelPostEdit = () => {
    if (!post) return;
    setEditingPost(false);
    setPostEditTitle(post.title || "");
    setPostEditContent(post.content || "");
    const matchedCategory =
      Object.entries(CERT_DATA).find(([category, certificates]) => category !== CUSTOM_CERT_FILTER && certificates.includes(post.cert || ""))?.[0] ?? "";
    setPostEditCertCategory(matchedCategory || ((post.cert || "").trim() ? CUSTOM_CERT_FILTER : ""));
    setPostEditCert(post.cert || "");
    setPostEditLocation(post.location || "");
    setPlaceKeyword(post.location || "");
    setSelectedEditPlace(
      post.location && typeof post.lat === "number" && typeof post.lng === "number"
        ? {
            id: `study-${post.id}`,
            name: post.location,
            address: post.location,
            lat: post.lat,
            lng: post.lng,
          }
        : null,
    );
    setPostEditError("");
  };

  const searchPlacesOnKakao = () => {
    if (typeof window === "undefined") return;
    const keyword = placeKeyword.trim();
    if (!keyword) {
      setPlaceResults([]);
      return;
    }

    const kakaoMaps = window.kakao?.maps;
    const services = kakaoMaps?.services;

    if (!services) {
      setPostEditError("지도 스크립트가 아직 로드되지 않았습니다.");
      return;
    }

    const places = new services.Places();
    places.keywordSearch(keyword, (data, status) => {
      if (status !== services.Status.OK) {
        setPlaceResults([]);
        setPostEditError("장소 검색 결과가 없습니다.");
        return;
      }

      setPostEditError("");
      setPlaceResults(
        data.map(
          (item): SearchPlace => ({
            id: item.id,
            name: item.place_name,
            address: item.road_address_name || item.address_name,
            phone: item.phone,
            category: item.category_group_name || item.category_name?.split(">").pop()?.trim(),
            lat: parseFloat(item.y),
            lng: parseFloat(item.x),
          }),
        ),
      );
    });
  };

  const savePost = async () => {
    if (!post) return;

    const title = postEditTitle.trim();
    const content = postEditContent.trim();
    const cert = postEditCert.trim();
    const location = postEditLocation.trim();

    if (!title || !content || !location) {
      setPostEditError("제목, 본문, 장소를 모두 입력해 주세요.");
      return;
    }

    try {
      setPostSaving(true);
      setPostEditError("");
      const updated = await updateStudy(post.id, {
        title,
        content,
        cert: cert || null,
        locationName: selectedEditPlace?.name ?? location,
        address: selectedEditPlace?.address ?? location,
        latitude: selectedEditPlace?.lat ?? post.lat,
        longitude: selectedEditPlace?.lng ?? post.lng,
        placeId: selectedEditPlace?.id,
      });

      const hydrated = { ...updated, comments: post.comments };
      setPost(hydrated);
      setEditingPost(false);
    } catch (error) {
      setPostEditError(error instanceof Error ? error.message : "게시글 수정에 실패했습니다.");
    } finally {
      setPostSaving(false);
    }
  };

  const removePost = async () => {
    if (!post || postDeleting) return;
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

    try {
      setPostDeleting(true);
      await deleteStudy(post.id);
      router.push(returnTo ? decodeURIComponent(returnTo) : "/study");
    } catch (error) {
      setPostEditError(error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.");
    } finally {
      setPostDeleting(false);
    }
  };

  if (!post) {
    return (
      <div className="mx-auto max-w-5xl rounded-[28px] border border-hp-100 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        게시물을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in duration-500">
      <div className="overflow-hidden rounded-[30px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="sticky top-0 z-10 border-b border-hp-100 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-5 py-3">
            <button
              onClick={() => router.push(returnTo ? decodeURIComponent(returnTo) : "/study")}
              className="rounded-full p-2 transition hover:bg-slate-100"
              aria-label="뒤로"
            >
              ←
            </button>
            <div className="text-sm font-semibold text-slate-700">스터디 모집</div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_380px]">
          <div className="border-b border-hp-100 bg-white lg:border-b-0 lg:border-r">
            <div className="border-b border-hp-100 px-5 py-6 lg:px-7">
              {!editingPost ? (
                <div className="mb-5 pb-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      {post.title ? <h1 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-slate-950">{post.title}</h1> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:max-w-[42%] lg:justify-end">
                      <span className="inline-flex items-center gap-1 rounded-full bg-hp-50 px-3 py-1.5 text-xs font-semibold text-hp-700">
                        <MapPin size={12} />
                        {post.location}
                      </span>
                      {post.cert && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">{post.cert}</span>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        onClick={() => setProfileModal(post.authorId)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-hp-100 p-[2px]"
                      >
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-hp-700">
                          {getInitial(post.author)}
                        </span>
                      </button>
                      <div className="min-w-0 text-[11px] text-slate-400">
                        <button
                          className="block truncate text-left text-xs font-medium text-slate-600 hover:text-hp-700 hover:underline"
                          onClick={() => setProfileModal(post.authorId)}
                        >
                          {post.author}
                        </button>
                        <div>{formatBoardCreatedAt(post.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500">
                      <button
                        onClick={() => void handleToggleLike()}
                        disabled={likeSubmitting}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition ${
                          post.likedByUser ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        } disabled:opacity-50`}
                      >
                        <Heart size={13} className={post.likedByUser ? "fill-current" : ""} />
                        좋아요 {post.likes}
                      </button>
                      <span className="inline-flex items-center gap-1.5">
                        <Eye size={13} />
                        조회수 {post.views}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={`mb-4 flex items-center gap-3 ${editingPost ? "" : "hidden"}`}>
                <button
                  onClick={() => setProfileModal(post.authorId)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-hp-100 p-[2px]"
                >
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-hp-700">
                    {getInitial(post.author)}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <button className="block truncate text-left text-sm font-semibold text-slate-900 hover:underline" onClick={() => setProfileModal(post.authorId)}>
                    {post.author}
                  </button>
                  <div className="text-xs text-slate-400">{formatBoardCreatedAt(post.createdAt)}</div>
                </div>
                {canManagePost ? (
                  <div className="ml-auto flex items-center gap-2">
                    {editingPost ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelPostEdit}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => void savePost()}
                          disabled={postSaving}
                          className="rounded-full bg-hp-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-hp-700 disabled:opacity-60"
                        >
                          {postSaving ? "저장 중.." : "저장"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(true);
                            setPostEditError("");
                          }}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                          aria-label="게시글 수정"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removePost()}
                          disabled={postDeleting}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
                          aria-label="게시글 삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-hp-100 pt-6 lg:pt-7">
                {editingPost ? (
                  <div className="mx-auto max-w-3xl space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">제목</p>
                      <input
                        value={postEditTitle}
                        onChange={(event) => setPostEditTitle(event.target.value)}
                        placeholder="제목"
                        className="w-full rounded-2xl border border-hp-100 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-hp-500"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">자격증 선택</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-semibold text-slate-500">분류</p>
                          <select
                            value={postEditCertCategory}
                            onChange={(event) => {
                              setPostEditCertCategory(event.target.value);
                              setPostEditCert("");
                            }}
                            className={`w-full rounded-2xl border border-hp-100 bg-white px-4 py-3 text-sm outline-none focus:border-hp-500 ${
                              isCustomCert ? "font-bold text-slate-900" : "text-slate-700"
                            }`}
                          >
                            <option value="">분류 선택</option>
                            {certificateCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                            <option value={CUSTOM_CERT_FILTER}>기타</option>
                          </select>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold text-slate-500">
                            {isCustomCert ? "자격증명 직접 입력" : "자격증 종류"}
                          </p>
                          {isCustomCert ? (
                            <input
                              value={postEditCert}
                              onChange={(event) => setPostEditCert(event.target.value)}
                              placeholder="예: 한국사, 컴활 1급"
                              className="w-full rounded-2xl border border-hp-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-hp-500"
                            />
                          ) : (
                            <select
                              value={postEditCert}
                              onChange={(event) => setPostEditCert(event.target.value)}
                              disabled={!postEditCertCategory}
                              className="w-full rounded-2xl border border-hp-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-hp-500 disabled:opacity-40"
                            >
                              <option value="">{postEditCertCategory ? "자격증 선택" : "먼저 분류를 선택해 주세요"}</option>
                              {certOptions.map((certificate) => (
                                <option key={certificate} value={certificate}>
                                  {certificate}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">본문</p>
                      <textarea
                        value={postEditContent}
                        onChange={(event) => setPostEditContent(event.target.value)}
                        rows={12}
                        placeholder="본문"
                        className="w-full resize-y rounded-2xl border border-hp-100 bg-white px-4 py-4 text-[15px] leading-7 text-slate-700 outline-none focus:border-hp-500"
                      />
                    </div>
                    {postEditError ? <p className="text-sm text-red-500">{postEditError}</p> : null}
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl">
                    <p className="min-h-[20rem] whitespace-pre-wrap text-[15px] leading-8 text-slate-700">{post.content}</p>
                  </div>
                )}
              </div>

              <div className="hidden">
                <button
                  onClick={() => void handleToggleLike()}
                  disabled={likeSubmitting}
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
              </div>
            </div>

            <div className="px-5 py-6 lg:px-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-lg font-bold text-slate-950">댓글</div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-slate-400">{(post.comments || []).length}개</div>
                  {!editingPost && canManagePost ? (
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(true);
                          setPostEditError("");
                        }}
                        className="text-slate-500 transition hover:text-slate-800"
                      >
                        수정
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => void removePost()}
                        disabled={postDeleting}
                        className="text-slate-500 transition hover:text-red-500 disabled:opacity-60"
                      >
                        삭제
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
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
                  className="text-sm font-semibold text-hp-600 transition hover:text-hp-700 disabled:text-slate-300"
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
                            {comment.authorId ? (
                              <button
                                type="button"
                                className="text-sm font-semibold text-slate-900 transition hover:underline"
                                onClick={() => setProfileModal(comment.authorId!)}
                              >
                                {comment.author}
                              </button>
                            ) : (
                              <span className="text-sm font-semibold text-slate-900">{comment.author}</span>
                            )}
                            <span className="text-xs text-slate-400">{formatBoardCreatedAt(comment.createdAt)}</span>
                            {comment.author === currentUser?.nickname && (
                              <div className="ml-auto flex items-center gap-1">
                                {editingCommentId === comment.id ? (
                                  <button onClick={cancelEditingComment} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
                                    <X size={14} />
                                  </button>
                                ) : (
                                  <button onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingCommentText(comment.text);
                                    setCommentError("");
                                  }} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
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

          <aside className="bg-hp-50/40 px-5 py-6">
            <div className="lg:sticky lg:top-24">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-hp-500">Study Spot</div>
              {editingPost ? (
                <>
                  <div className="mt-4 flex gap-2">
                    <input
                      value={placeKeyword}
                      onChange={(event) => setPlaceKeyword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          searchPlacesOnKakao();
                        }
                      }}
                      placeholder="장소 검색"
                      className="min-w-0 flex-1 rounded-2xl border border-hp-100 bg-hp-50/40 px-4 py-3 text-sm text-slate-700 outline-none focus:border-hp-500"
                    />
                    <button
                      type="button"
                      onClick={searchPlacesOnKakao}
                      className="inline-flex items-center gap-2 rounded-2xl bg-hp-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-hp-700"
                    >
                      <Search size={15} />
                      검색
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-hp-100 bg-hp-50/40 px-4 py-3">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">선택한 장소</div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-hp-700">
                      <MapPin size={14} />
                      {postEditLocation || "아직 선택하지 않았습니다."}
                    </div>
                  </div>

                  {placeResults.length > 0 ? (
                    <div className="mt-4 flex h-72 flex-col gap-4 lg:h-auto lg:flex-row">
                      <div className="max-h-56 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-72">
                      {placeResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => {
                            setSelectedEditPlace(result);
                            setPostEditLocation(result.name);
                            setPlaceKeyword(result.name);
                            setPostEditError("");
                          }}
                          className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            selectedEditPlace?.id === result.id
                              ? "border-hp-300 bg-hp-50 text-slate-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-hp-200 hover:bg-hp-50/40"
                          }`}
                        >
                          <div className="font-semibold">{result.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{result.address}</div>
                        </button>
                      ))}
                      </div>

                      <div className="flex min-h-56 flex-1 items-center justify-center overflow-hidden rounded-3xl border border-hp-100 bg-hp-50/40">
                        {selectedEditPlace && showMapPreview ? (
                          <KakaoMap
                            markers={[{ lat: selectedEditPlace.lat, lng: selectedEditPlace.lng, locationName: selectedEditPlace.name }]}
                            center={{ lat: selectedEditPlace.lat, lng: selectedEditPlace.lng }}
                            level={3}
                          />
                        ) : (
                          <div className="px-5 text-center text-sm text-slate-400">오른쪽에서 선택한 장소 지도가 여기에 표시됩니다.</div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {placeResults.length === 0 ? (
                    <div className="mt-4 rounded-3xl border border-dashed border-hp-200 bg-hp-50 px-5 py-10 text-center text-sm text-slate-400">
                      검색 후 장소를 선택해 주세요.
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-hp-50 px-3 py-1 text-sm font-semibold text-hp-700">
                    <MapPin size={14} />
                    {post.location || "장소 미정"}
                  </div>

                  {post.lat && post.lng ? (
                    showMapPreview ? (
                      <div className="mt-4 overflow-hidden rounded-3xl border border-hp-100">
                        <KakaoMap
                          markers={[{ lat: post.lat, lng: post.lng, locationName: post.location || "스터디 장소" }]}
                          center={{ lat: post.lat, lng: post.lng }}
                          level={3}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-3xl border border-dashed border-hp-200 bg-hp-50 px-5 py-10 text-center text-sm text-slate-500">
                        localhost 환경에서는 지도를 숨깁니다.
                        <div className="mt-2 font-semibold text-slate-700">{post.location}</div>
                      </div>
                    )
                  ) : (
                    <div className="mt-4 rounded-3xl border border-dashed border-hp-200 bg-hp-50 px-5 py-10 text-center text-sm text-slate-400">
                      아직 장소 정보가 등록되지 않았습니다.
                    </div>
                  )}
                </>
              )}
              {!editingPost && post.id && (
              <button
                onClick={async () => {
                  if (!currentUser) {
                    alert("로그인이 필요합니다.");
                    return;
                  }
                  try {
                    const result = await joinStudyChatRoom(post.id);
                    const rooms = await getMyChatRooms();
                    setChatRooms(rooms);
                    setActiveChatRoomId(String(result.roomId));
                    router.push("/chat");
                  } catch (error) {
                    console.error("Join error:", error);
                    alert("채팅방 입장에 실패했습니다.");
                  }
                }}
                className="mt-4 w-full rounded-2xl bg-hp-600 py-3 font-bold text-white hover:bg-hp-700 transition-colors"
              >
                스터디 채팅방 입장
              </button>
            )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
