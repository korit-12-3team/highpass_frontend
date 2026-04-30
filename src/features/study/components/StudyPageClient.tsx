"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Heart, MapPin, MessageCircle, Zap } from "lucide-react";
import type { BoardPost } from "@/entities/common/types";
import { listComments } from "@/features/boards/api/comments";
import { isPostLiked, saveLikedPost, toggleBoardLike } from "@/features/boards/api/likes";
import { formatBoardCreatedAt, getBoardCreatedAtTime, getInitial } from "@/features/boards/utils/detail-utils";
import { CERT_DATA, REGION_DATA } from "@/shared/constants";
import { useApp } from "@/shared/context/AppContext";

const CUSTOM_CERT_FILTER = "기타";

function sortPosts(posts: BoardPost[]) {
  return posts.slice().sort((a, b) => {
    const dt = getBoardCreatedAtTime(b.createdAt) - getBoardCreatedAtTime(a.createdAt);
    if (dt !== 0) return dt;
    return Number(b.id) - Number(a.id);
  });
}

export default function StudyPageClient({ initialPosts }: { initialPosts: BoardPost[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, setProfileModal, setWriteModalOpen, setWriteType } = useApp();
  const requestedCertCategory = searchParams.get("certCategory") ?? "";
  const requestedCertFilter = searchParams.get("cert") ?? "";
  const requestedLocationSiDo = searchParams.get("siDo") ?? "";
  const requestedLocationGunGu = searchParams.get("gunGu") ?? "";

  const [posts, setPosts] = useState<BoardPost[]>(() => sortPosts(initialPosts));
  const [certCategoryFilter, setCertCategoryFilter] = useState(requestedCertCategory);
  const [certFilter, setCertFilter] = useState(requestedCertFilter);
  const [locationFilterSiDo, setLocationFilterSiDo] = useState(requestedLocationSiDo);
  const [locationFilterGunGu, setLocationFilterGunGu] = useState(requestedLocationGunGu);
  const [likeSubmittingPostId, setLikeSubmittingPostId] = useState<string | null>(null);

  const certificateCategories = useMemo(
    () => [...Object.keys(CERT_DATA).filter((category) => category !== CUSTOM_CERT_FILTER), CUSTOM_CERT_FILTER],
    [],
  );
  const certificateOptionSet = useMemo(() => new Set(Object.values(CERT_DATA).flat()), []);
  const certOptions = useMemo(
    () => (certCategoryFilter && certCategoryFilter !== CUSTOM_CERT_FILTER ? CERT_DATA[certCategoryFilter] || [] : []),
    [certCategoryFilter],
  );

  useEffect(() => {
    setPosts(sortPosts(initialPosts));
  }, [initialPosts]);

  useEffect(() => {
    if (!currentUser) return;
    setPosts((prev) =>
      prev.map((post) => ({
        ...post,
        likedByUser: isPostLiked(currentUser.id, "STUDY", post.id),
      })),
    );
  }, [currentUser]);

  useEffect(() => {
    setCertCategoryFilter(requestedCertCategory);
  }, [requestedCertCategory]);

  useEffect(() => {
    setCertFilter(requestedCertFilter);
  }, [requestedCertFilter]);

  useEffect(() => {
    setLocationFilterSiDo(requestedLocationSiDo);
  }, [requestedLocationSiDo]);

  useEffect(() => {
    setLocationFilterGunGu(requestedLocationGunGu);
  }, [requestedLocationGunGu]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (certCategoryFilter) params.set("certCategory", certCategoryFilter);
    else params.delete("certCategory");

    if (certCategoryFilter && certFilter) params.set("cert", certFilter);
    else params.delete("cert");

    if (locationFilterSiDo) params.set("siDo", locationFilterSiDo);
    else {
      params.delete("siDo");
      params.delete("gunGu");
    }

    if (locationFilterSiDo && locationFilterGunGu) params.set("gunGu", locationFilterGunGu);
    else params.delete("gunGu");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [certCategoryFilter, certFilter, locationFilterGunGu, locationFilterSiDo, pathname, router, searchParams]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (certCategoryFilter === CUSTOM_CERT_FILTER) {
        if (!post.cert || certificateOptionSet.has(post.cert)) return false;
        if (certFilter && !post.cert.toLowerCase().includes(certFilter.toLowerCase())) return false;
      } else if (certCategoryFilter) {
        const categoryCertificates = CERT_DATA[certCategoryFilter] || [];
        if (!post.cert || !categoryCertificates.includes(post.cert)) return false;
        if (certFilter && post.cert !== certFilter) return false;
      } else if (certFilter) {
        return false;
      }

      if (locationFilterGunGu && !post.location?.includes(locationFilterGunGu)) return false;
      if (locationFilterSiDo && !locationFilterGunGu && !post.location?.includes(locationFilterSiDo)) return false;
      return true;
    });
  }, [certCategoryFilter, certFilter, certificateOptionSet, locationFilterGunGu, locationFilterSiDo, posts]);

  const updatePostLocally = (postId: string, updater: (post: BoardPost) => BoardPost) => {
    setPosts((prev) => sortPosts(prev.map((post) => (post.id === postId ? updater(post) : post))));
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUser || likeSubmittingPostId === postId) return;
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);
    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) return;

    try {
      setLikeSubmittingPostId(post.id);
      const nextLiked = !post.likedByUser;
      await toggleBoardLike("STUDY", targetId, userId);
      saveLikedPost(currentUser.id, "STUDY", post.id, nextLiked);
      const comments = post.comments.length === 0 ? await listComments("STUDY", post.id) : post.comments;
      updatePostLocally(post.id, (currentPost) => ({
        ...currentPost,
        comments,
        likes: nextLiked ? currentPost.likes + 1 : Math.max(0, currentPost.likes - 1),
        likedByUser: nextLiked,
      }));
    } finally {
      setLikeSubmittingPostId(null);
    }
  };

  const openPost = (postId: string) => {
    const currentQuery = searchParams.toString();
    const returnTo = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    router.push(`/study/${postId}?returnTo=${encodeURIComponent(returnTo)}`);
  };


return (
    <div className="mx-auto max-w-5xl animate-in fade-in duration-500 px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">스터디 모집</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">자격증과 지역 필터로 원하는 스터디를 찾을 수 있습니다.</p>
        </div>
        <button
          onClick={() => {
            setWriteType("study");
            setWriteModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-hp-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-hp-700 hover:shadow-md active:scale-95"
        >
          <Zap size={16} />
          모집글 작성
        </button>
      </div>

      {/* Filter Section: No Borders, Only Shadow */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_1fr_120px]">
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <p className="mb-3 ml-1 text-[10px] font-black uppercase tracking-wider text-slate-400">자격증 영역</p>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={certCategoryFilter}
              onChange={(e) => {
                setCertCategoryFilter(e.target.value);
                setCertFilter("");
              }}
              className="rounded-xl border-none bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-hp-100"
            >
              <option value="">전체 자격증</option>
              {certificateCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {certCategoryFilter === CUSTOM_CERT_FILTER ? (
              <input
                value={certFilter}
                onChange={(e) => setCertFilter(e.target.value)}
                placeholder="기타 자격증명 입력"
                className="rounded-xl border-none bg-slate-50 px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-hp-100"
              />
            ) : (
              <select
                value={certFilter}
                onChange={(e) => setCertFilter(e.target.value)}
                disabled={!certCategoryFilter}
                className="rounded-xl border-none bg-slate-50 px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-hp-100 disabled:opacity-40"
              >
                <option value="">{ !certCategoryFilter ? "분류 선택" : "자격증 선택" }</option>
                {certOptions.map((cert) => (
                  <option key={cert} value={cert}>{cert}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <p className="mb-3 ml-1 text-[10px] font-black uppercase tracking-wider text-slate-400">지역 영역</p>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={locationFilterSiDo}
              onChange={(e) => {
                setLocationFilterSiDo(e.target.value);
                setLocationFilterGunGu("");
              }}
              className="rounded-xl border-none bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-hp-100"
            >
              <option value="">전체 지역</option>
              {Object.keys(REGION_DATA).map((siDo) => (
                <option key={siDo} value={siDo}>{siDo}</option>
              ))}
            </select>
            <select
              value={locationFilterGunGu}
              onChange={(e) => setLocationFilterGunGu(e.target.value)}
              disabled={!locationFilterSiDo}
              className="rounded-xl border-none bg-slate-50 px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-hp-100 disabled:opacity-40"
            >
              <option value="">전체 구/군</option>
              {(REGION_DATA[locationFilterSiDo] || []).map((gunGu) => (
                <option key={gunGu} value={gunGu}>{gunGu}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setCertCategoryFilter("");
            setCertFilter("");
            setLocationFilterSiDo("");
            setLocationFilterGunGu("");
          }}
          className="flex h-full items-center justify-center rounded-2xl bg-white text-xs font-bold text-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:bg-slate-50 hover:text-slate-600 active:scale-95"
        >
          초기화
        </button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white py-20 text-center text-sm font-medium text-slate-400">
          조건에 맞는 스터디가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => openPost(post.id)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white px-6 py-5 transition hover:bg-slate-50/50 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-hp-600 transition-colors">
                  {post.title}
                </h3>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
                  {post.cert || "자유 주제"}
                </span>
                {post.location === "online" ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
                    온라인
                  </span>
                ) : !post.location ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-400">
                    장소 미정
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-600">
                    <MapPin size={12} />
                    {post.location}
                  </span>
                )}
              </div>
              
              <p className="line-clamp-1 text-sm leading-relaxed text-slate-500 font-medium">
                {post.content}
              </p>

                <div className="mt-4 flex items-center border-t border-slate-50 pt-3">
                  <div className="flex flex-1 items-center gap-2" 
                  onClick={(e) => {
                        e.stopPropagation();
                        setProfileModal(post.authorId);
                      }}>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-hp-100 text-[10px] font-bold text-hp-700">
                      {getInitial(post.author)}
                    </div>
                    <span className="text-[12px] font-bold text-slate-700">{post.author}</span>
                    <span className="text-[11px] font-medium text-slate-400">· {formatBoardCreatedAt(post.createdAt)}</span>
                  </div>
                                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleToggleLike(post.id);
                  }}
                  disabled={likeSubmittingPostId === post.id}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold transition ${
                    post.likedByUser
                      ? "bg-red-50 text-red-500"
                      : "text-slate-400 hover:bg-slate-100"
                  } disabled:opacity-50`}
                >
                  <Heart size={13} className={post.likedByUser ? "fill-current" : ""} />
                  좋아요 {post.likes}
                </button>
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-bold text-slate-400">
                  <MessageCircle size={13} />
                  댓글 {post.comments?.length || 0}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-bold text-slate-400">
                  <Eye size={13} />
                  조회 {post.views}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}