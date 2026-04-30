"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "@/shared/components/common/ConfirmModal";
import { useRouter } from "next/navigation";
import { Eye, Heart, Loader2, MapPin, Pencil, Search, Trash2, X } from "lucide-react";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import KakaoMap from "@/shared/components/map/KakaoMap";
import { KAKAO_MAP_APPKEY } from "@/services/config/config";
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
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#comment-input") {
      setTimeout(() => {
        commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        commentInputRef.current?.focus();
      }, 300);
    }
  }, []);

  const [loadingKakao, errorKakao] = useKakaoLoader({
    appkey: KAKAO_MAP_APPKEY,
    libraries: ["services", "clusterer"],
  });

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

  const showMapPreview = true;
  const canManagePost = !!currentUser && currentUser.id === post?.authorId;

  const handleConfirmCancel = () => {
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

  const cancelPostEdit = () => {
  setCancelConfirmOpen(true);
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
  <div className="mx-auto max-w-4xl animate-in fade-in duration-500">
    <div className="overflow-hidden rounded-[30px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">

      {/* 상단 네비 */}
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

      {/* 본문 */}
      <div className="px-5 py-6 lg:px-7">

        {/* 제목 + 뱃지 + 수정/삭제 */}
        {!editingPost ? (
          <div className="mb-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                {post.title ? (
                  <h1 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-slate-950">
                    {post.title}
                  </h1>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 lg:max-w-[42%] lg:justify-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-hp-50 px-3 py-1.5 text-xs font-semibold text-hp-700">
                  <MapPin size={12} />
                  {post.location}
                </span>
                {post.cert && (
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    {post.cert}
                  </span>
                )}
              </div>
            </div>

            {/* 작성자 + 좋아요/조회수 + 수정/삭제 */}
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

              <div className="flex items-center gap-2">
                {canManagePost && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setEditingPost(true); setPostEditError(""); }}
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
            </div>
          </div>
        ) : null}

        

        {/* 본문 내용 / 수정 폼 */}
        <div className="pt-6 ">
          {editingPost ? (
            <div className="mx-auto space-y-4">
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
                      onChange={(event) => { setPostEditCertCategory(event.target.value); setPostEditCert(""); }}
                      className={`w-full rounded-2xl border border-hp-100 bg-white px-4 py-3 text-sm outline-none focus:border-hp-500 ${isCustomCert ? "font-bold text-slate-900" : "text-slate-700"}`}
                    >
                      <option value="">분류 선택</option>
                      {certificateCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
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
                          <option key={certificate} value={certificate}>{certificate}</option>
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
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">스터디 방식</p>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => { setPostEditLocation("online"); setSelectedEditPlace(null); setPlaceKeyword("online"); }}
                    className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${postEditLocation === "online" ? "bg-hp-600 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    온라인
                  </button>
                  <button
                    type="button"
                    onClick={() => { if(postEditLocation === "online") { setPostEditLocation(""); setPlaceKeyword(""); } }}
                    className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${postEditLocation !== "online" ? "bg-hp-600 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    오프라인
                  </button>
                </div>

                {postEditLocation !== "online" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        value={placeKeyword === "online" ? "" : placeKeyword}
                        onChange={(e) => setPlaceKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchPlacesOnKakao()}
                        placeholder="장소 검색 (예: 강남 카페)"
                        className="w-full rounded-2xl border border-hp-100 bg-slate-50 pl-4 pr-20 py-3 text-sm outline-none focus:border-hp-500"
                      />
                      {placeKeyword && placeKeyword !== "online" && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlaceKeyword("");
                            setPlaceResults([]);
                            setSelectedEditPlace(null);
                            setPostEditLocation("");
                          }}
                          className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                          aria-label="검색어 지우기"
                        >
                          <X size={15} />
                        </button>
                      )}
                      <button onClick={searchPlacesOnKakao} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-hp-600">
                        <Search size={18} />
                      </button>
                    </div>

                    {placeResults.length > 0 ? (
                      <div className="flex h-72 flex-col gap-3 md:flex-row">
                        <div className="w-full space-y-2 overflow-y-auto pr-1 md:w-1/2">
                          {placeResults.map((result) => (
                            <div
                              key={result.id}
                              onClick={() => {
                                setSelectedEditPlace(result);
                                setPostEditLocation(result.name);
                              }}
                              className={`cursor-pointer rounded-2xl border p-3 text-sm transition-all ${
                                selectedEditPlace?.id === result.id
                                  ? "border-hp-500 bg-hp-50 ring-1 ring-hp-400"
                                  : "border-hp-100 bg-white hover:border-hp-300 hover:bg-hp-50"
                              }`}
                            >
                              <p className="font-bold text-slate-800 truncate">{result.name}</p>
                              <p className="mt-0.5 text-xs text-slate-400 truncate">{result.address}</p>
                              {result.phone && <p className="mt-0.5 font-mono text-xs text-slate-400">{result.phone}</p>}
                            </div>
                          ))}
                        </div>
                        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-hp-100 shadow-inner md:w-1/2">
                          {loadingKakao ? (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <Loader2 className="animate-spin" size={20} />
                              <span className="text-xs">지도 로딩 중...</span>
                            </div>
                          ) : errorKakao ? (
                            <p className="p-4 text-center text-xs text-red-400">카카오 지도를 불러오지 못했습니다.</p>
                          ) : (
                            <KakaoMap
                              markers={placeResults.map((r) => ({ lat: r.lat, lng: r.lng, locationName: r.name }))}
                              center={
                                selectedEditPlace
                                  ? { lat: selectedEditPlace.lat, lng: selectedEditPlace.lng }
                                  : { lat: placeResults[0].lat, lng: placeResults[0].lng }
                              }
                              level={4}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[250px] overflow-hidden rounded-3xl border border-hp-100 shadow-inner">
                        <KakaoMap
                          center={
                            selectedEditPlace
                              ? { lat: selectedEditPlace.lat, lng: selectedEditPlace.lng }
                              : (post.lat && post.lng ? { lat: post.lat, lng: post.lng } : { lat: 37.56, lng: 126.97 })
                          }
                          markers={
                            selectedEditPlace
                              ? [{ lat: selectedEditPlace.lat, lng: selectedEditPlace.lng, locationName: selectedEditPlace.name }]
                              : (post.lat && post.lng && post.location ? [{ lat: post.lat, lng: post.lng, locationName: post.location }] : [])
                          }
                        />
                      </div>
                    )}

                    {selectedEditPlace && (
                      <div className="flex items-center justify-between rounded-2xl bg-hp-50 px-4 py-2.5">
                        <p className="text-sm font-bold text-hp-700">📍 {selectedEditPlace.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEditPlace(null);
                            setPlaceResults([]);
                            setPlaceKeyword("");
                            setPostEditLocation("");
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* 에러 메시지 표시 영역 */}
              {postEditError ? (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500 animate-in slide-in-from-top-1">
                  <span>⚠️</span> {postEditError}
                </div>
              ) : null}

              {/* 수정 중 버튼 - 본문 아래 */}
              <div className="flex justify-end gap-2 border-t border-hp-100 pt-4">
                <button
                  type="button"
                  onClick={cancelPostEdit}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void savePost()}
                  disabled={postSaving}
                  className="rounded-full bg-hp-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-hp-700 disabled:opacity-60"
                >
                  {postSaving ? "저장 중.." : "저장"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="min-h-[8rem] whitespace-pre-wrap text-[15px] leading-8 text-slate-700">
                {post.content}
              </p>

              {/* 좋아요 / 조회수 - 본문 우측 하단 */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => void handleToggleLike()}
                  disabled={likeSubmitting}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    post.likedByUser ? "bg-red-50 text-red-500" : "text-slate-400 hover:bg-slate-100"
                  } disabled:opacity-50`}
                >
                  <Heart size={13} className={post.likedByUser ? "fill-current" : ""} />
                  좋아요 {post.likes}
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400">
                  <Eye size={13} />
                  조회 {post.views}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 스터디 스팟 - 본문 아래 */}
        {!editingPost && (
          <div className="mt-8 border-t border-hp-100 pt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-hp-500 mb-4">Study Spot</div>
            {post.location === "online" ? (
              <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600">
                <span>🌐</span> 온라인 스터디입니다.
              </div>
            ) : !post.location || !post.lat || !post.lng ? (
              <div className="rounded-2xl border border-dashed border-hp-200 bg-hp-50 px-5 py-8 text-center text-sm text-slate-400">
                장소 미정
              </div>
            ) : (
              <>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-hp-50 px-3 py-1 text-sm font-semibold text-hp-700">
                  <MapPin size={14} />
                  {post.location}
                </div>
                <div className="overflow-hidden rounded-3xl border border-hp-100">
                  <KakaoMap
                    markers={[{ lat: post.lat, lng: post.lng, locationName: post.location }]}
                    center={{ lat: post.lat, lng: post.lng }}
                    level={3}
                  />
                </div>
              </>
            )}

            {/* 채팅방 입장 버튼 */}
            {post.id && (
              <button
                onClick={async () => {
                  if (!currentUser) { alert("로그인이 필요합니다."); return; }
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
                className="mt-4 w-full rounded-2xl bg-hp-600 py-3 font-bold text-white transition-colors hover:bg-hp-700"
              >
                스터디 채팅방 입장
              </button>
            )}

          </div>
        )}

        {/* 댓글 */}
        {!editingPost && (
          <div className="mt-8 border-t border-hp-100 pt-6">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-hp-500">
              Comments{post.comments?.length ? ` · ${post.comments.length}` : ""}
            </div>

            {post.comments && post.comments.length > 0 ? (
              <ul className="mb-6 space-y-3">
                {post.comments.map((comment) => (
                  <li key={comment.id} className="rounded-2xl border border-hp-100 bg-white px-4 py-3">
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-hp-100 px-3 py-2 text-sm outline-none focus:border-hp-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditingComment}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => void saveComment(comment.id)}
                            disabled={activeCommentId === comment.id}
                            className="rounded-full bg-hp-600 px-3 py-1 text-xs font-semibold text-white hover:bg-hp-700 disabled:opacity-60"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => comment.authorId && setProfileModal(comment.authorId)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-hp-100"
                            >
                              <span className="text-xs font-bold text-hp-700">{getInitial(comment.author)}</span>
                            </button>
                            <div>
                              <button
                                onClick={() => comment.authorId && setProfileModal(comment.authorId)}
                                className="text-xs font-semibold text-slate-700 hover:text-hp-600 hover:underline"
                              >
                                {comment.author}
                              </button>
                              {comment.createdAt && (
                                <p className="text-[10px] text-slate-400">{formatBoardCreatedAt(comment.createdAt)}</p>
                              )}
                            </div>
                          </div>
                          {currentUser?.id === comment.authorId && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }}
                                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="댓글 수정"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => void removeComment(comment.id)}
                                disabled={activeCommentId === comment.id}
                                className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-400 disabled:opacity-50"
                                aria-label="댓글 삭제"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.text}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mb-6 rounded-2xl border border-dashed border-hp-200 bg-hp-50 px-5 py-6 text-center text-sm text-slate-400">
                첫 댓글을 남겨보세요
              </div>
            )}

            {commentError && (
              <p className="mb-2 text-xs font-semibold text-red-500">{commentError}</p>
            )}
            <textarea
              ref={commentInputRef}
              id="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void addComment();
                }
              }}
              rows={3}
              placeholder="댓글을 입력하세요 (Shift+Enter로 줄바꿈)"
              className="w-full resize-none rounded-2xl border border-hp-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-hp-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => void addComment()}
                disabled={commentSubmitting || !commentText.trim()}
                className="rounded-full bg-hp-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-hp-700 disabled:opacity-50"
              >
                {commentSubmitting ? "등록 중..." : "댓글 등록"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    <ConfirmModal
      isOpen={cancelConfirmOpen}
      badge="Edit"
      title="수정을 취소하시겠습니까?"
      description="확인을 누르면 현재 변경사항이 저장되지 않고 이전 상태로 되돌아갑니다."
      confirmLabel="확인"
      onConfirm={() => { handleConfirmCancel(); setCancelConfirmOpen(false); }}
      onClose={() => setCancelConfirmOpen(false)}
    />
  </div>
);
}