"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Heart, MapPin, MessageCircle, Zap } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { listComments } from "@/lib/comments";
import { saveLikedPost, toggleBoardLike } from "@/lib/likes";
import { CERT_DATA, REGION_DATA } from "@/lib/constants";
import { formatBoardCreatedAt, getInitial } from "@/features/boards/detail-utils";

const CUSTOM_CERT_FILTER = "기타";

export default function StudyPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { boardData, setBoardData, currentUser, setProfileModal, setWriteModalOpen, setWriteType } = useApp();
  const requestedCertCategory = searchParams.get("certCategory") ?? "";
  const requestedCertFilter = searchParams.get("cert") ?? "";
  const requestedLocationSiDo = searchParams.get("siDo") ?? "";
  const requestedLocationGunGu = searchParams.get("gunGu") ?? "";

  const certificateCategories = useMemo(
    () => Object.keys(CERT_DATA).filter((category) => category !== CUSTOM_CERT_FILTER),
    [],
  );
  const certificateOptionSet = useMemo(() => new Set(Object.values(CERT_DATA).flat()), []);

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
        return Number(b.id) - Number(a.id);
      });
  }, [boardData]);

  const [certCategoryFilter, setCertCategoryFilter] = useState(requestedCertCategory);
  const [certFilter, setCertFilter] = useState(requestedCertFilter);
  const [locationFilterSiDo, setLocationFilterSiDo] = useState(requestedLocationSiDo);
  const [locationFilterGunGu, setLocationFilterGunGu] = useState(requestedLocationGunGu);
  const [hydratedCommentPostIds, setHydratedCommentPostIds] = useState<string[]>([]);
  const [likeSubmittingPostId, setLikeSubmittingPostId] = useState<string | null>(null);

  const certOptions = useMemo(
    () => (certCategoryFilter && certCategoryFilter !== CUSTOM_CERT_FILTER ? CERT_DATA[certCategoryFilter] || [] : []),
    [certCategoryFilter],
  );

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
    return studyPosts.filter((post) => {
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
  }, [certCategoryFilter, certFilter, certificateOptionSet, locationFilterGunGu, locationFilterSiDo, studyPosts]);

  useEffect(() => {
    const targetPostIds = studyPosts.map((post) => post.id).filter((postId) => !hydratedCommentPostIds.includes(postId));
    if (targetPostIds.length === 0) return;

    let cancelled = false;

    void (async () => {
      try {
        const loaded = await Promise.all(
          targetPostIds.map(async (postId) => ({
            postId,
            comments: await listComments("STUDY", postId),
          })),
        );

        if (cancelled) return;

        setBoardData((prev) =>
          prev.map((post) => {
            if (post.type !== "study") return post;
            const matched = loaded.find((item) => item.postId === post.id);
            return matched ? { ...post, comments: matched.comments } : post;
          }),
        );
      } finally {
        if (!cancelled) {
          setHydratedCommentPostIds((prev) => [...prev, ...targetPostIds.filter((postId) => !prev.includes(postId))]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydratedCommentPostIds, setBoardData, studyPosts]);

  const updatePostLocally = (postId: string, updater: (post: (typeof studyPosts)[number]) => (typeof studyPosts)[number]) => {
    setBoardData((prev) => prev.map((post) => (post.type === "study" && post.id === postId ? updater(post) : post)));
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUser || likeSubmittingPostId === postId) return;
    const post = studyPosts.find((item) => item.id === postId);
    if (!post) return;

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

  const openPost = (postId: string) => {
    const currentQuery = searchParams.toString();
    const returnTo = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    router.push(`/study/${encodeURIComponent(postId)}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in duration-500">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">스터디 모집</h2>
          <p className="mt-1 text-sm text-slate-500">장소와 관련 분야를 보고 바로 합류할 스터디를 찾습니다.</p>
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

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">자격증 영역</p>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={certCategoryFilter}
              onChange={(e) => {
                setCertCategoryFilter(e.target.value);
                setCertFilter("");
              }}
              className={`rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500 ${
                certCategoryFilter === CUSTOM_CERT_FILTER ? "font-bold text-slate-900" : ""
              }`}
            >
              <option value="">전체 자격증</option>
              {certificateCategories.map((category) => (
                <option key={`category-${category}`} value={category} style={{ fontWeight: 700 }}>
                  {category}
                </option>
              ))}
              <option value={CUSTOM_CERT_FILTER} style={{ fontWeight: 700 }}>
                기타
              </option>
            </select>
            {certCategoryFilter === CUSTOM_CERT_FILTER ? (
              <input
                value={certFilter}
                onChange={(e) => setCertFilter(e.target.value)}
                placeholder="기타 자격증명을 입력하세요"
                className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500"
              />
            ) : (
              <select
                value={certFilter}
                onChange={(e) => setCertFilter(e.target.value)}
                disabled={!certCategoryFilter}
                className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500 disabled:opacity-40"
              >
                <option value="">{!certCategoryFilter ? "먼저 분류를 선택해 주세요" : "자격증 선택"}</option>
                {certOptions.map((certificate) => (
                  <option key={certificate} value={certificate}>
                    {certificate}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">지역 영역</p>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={locationFilterSiDo}
              onChange={(e) => {
                setLocationFilterSiDo(e.target.value);
                setLocationFilterGunGu("");
              }}
              className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500"
            >
              <option value="">전체 지역</option>
              {Object.keys(REGION_DATA).map((siDo) => (
                <option key={siDo} value={siDo}>
                  {siDo}
                </option>
              ))}
            </select>
            <select
              value={locationFilterGunGu}
              onChange={(e) => setLocationFilterGunGu(e.target.value)}
              disabled={!locationFilterSiDo}
              className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-hp-500 disabled:opacity-40"
            >
              <option value="">전체 구/군</option>
              {(REGION_DATA[locationFilterSiDo] || []).map((gunGu) => (
                <option key={gunGu} value={gunGu}>
                  {gunGu}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-stretch">
          <button
            onClick={() => {
              setCertCategoryFilter("");
              setCertFilter("");
              setLocationFilterSiDo("");
              setLocationFilterGunGu("");
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-[28px] border border-hp-100 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          조건에 맞는 스터디가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
          {filteredPosts.map((post, index) => (
            <article
              key={`study-${post.id}`}
              className={`px-5 py-5 pb-2 ${index !== filteredPosts.length - 1 ? "border-b border-slate-200" : ""}`}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => openPost(post.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPost(post.id);
                  }
                }}
                className="block w-full cursor-pointer text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 flex-wrap text-lg font-bold leading-tight text-slate-950">{post.title}</h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    {post.cert || "자격증 미정"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    <MapPin size={12} />
                    {post.location || "장소 미정"}
                  </span>
                </div>

              </div>

              <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProfileModal(post.authorId)}
                      className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-hp-700"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hp-100 text-[11px] font-bold text-hp-700">
                        {getInitial(post.author)}
                      </span>
                      <span>{post.author}</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <span>{formatBoardCreatedAt(post.createdAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[12px]">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                      <button
                      type="button"
                      onClick={() => void handleToggleLike(post.id)}
                      disabled={likeSubmittingPostId === post.id}
                      className={`inline-flex items-center gap-1.5 font-medium transition ${
                        post.likedByUser ? "text-red-500" : "text-slate-500 hover:text-slate-700"
                      } disabled:opacity-50`}
                      >
                        <Heart size={14} className={post.likedByUser ? "fill-current" : ""} />
                        좋아요 {post.likes}
                      </button>
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                      <Eye size={14} />
                      조회수 {post.views}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                      <MessageCircle size={14} />
                      댓글 {post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
