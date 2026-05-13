"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Heart, MapPin, MessageCircle, Search, ChevronUp, ChevronDown, X } from "lucide-react";
import type { BoardPost } from "@/entities/common/types";
import { listComments } from "@/shared/boards/api/comments";
import { isPostLiked, saveLikedPost, toggleBoardLike } from "@/shared/boards/api/likes";
import { formatBoardCreatedAt, getBoardCreatedAtTime } from "@/shared/boards/utils/detail-utils";
import { CERT_DATA, REGION_DATA } from "@/shared/constants";
import { useApp } from "@/shared/context/AppContext";
import Avatar from "@/shared/components/common/Avatar";
import { getStudyRegionBadge } from "@/features/study/utils/region";

const CUSTOM_CERT_FILTER = "기타";

function normalizeRegionText(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function getPostRegionText(post: BoardPost) {
  return normalizeRegionText([post.address, post.location].filter(Boolean).join(" "));
}

function matchesSiDo(regionText: string, siDo: string) {
  if (!siDo) return true;
  const normalizedSiDo = normalizeRegionText(siDo);
  const shortName = normalizedSiDo
    .replace(/특별자치시|특별자치도|특별시|광역시|자치도|도$/g, "")
    .replace(/^충청북$/, "충북")
    .replace(/^충청남$/, "충남")
    .replace(/^전라북$/, "전북")
    .replace(/^전라남$/, "전남")
    .replace(/^경상북$/, "경북")
    .replace(/^경상남$/, "경남");
  return regionText.includes(normalizedSiDo) || (!!shortName && regionText.includes(shortName));
}

function sortPosts(posts: BoardPost[]) {
  return posts.slice().sort((a, b) => {
    const dt = getBoardCreatedAtTime(b.createdAt) - getBoardCreatedAtTime(a.createdAt);
    if (dt !== 0) return dt;
    return Number(b.id) - Number(a.id);
  });
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

type ActivePanel = "cert" | "location" | "search" | null;
type StudyMode = "all" | "online" | "offline";

const STUDY_MODE_OPTIONS: { value: StudyMode; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "online", label: "온라인스터디" },
  { value: "offline", label: "오프라인스터디" },
];

export default function StudyPageClient({ initialPosts }: { initialPosts: BoardPost[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, setProfileModal, setWriteModalOpen, setWriteType } = useApp();

  const [posts, setPosts] = useState<BoardPost[]>(() => sortPosts(initialPosts));
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedCertCategory, setSelectedCertCategory] = useState("");
  const [selectedSiDos, setSelectedSiDos] = useState<string[]>([]);
  const [selectedGunGus, setSelectedGunGus] = useState<string[]>([]);
  const [studyMode, setStudyMode] = useState<StudyMode>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [likeSubmittingPostId, setLikeSubmittingPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const isCertActive = selectedCerts.length > 0 || !!selectedCertCategory;
  const isLocationActive = selectedSiDos.length > 0;
  const isStudyModeActive = studyMode !== "all";
  const isSearchActive = !!searchKeyword;

  const certificateCategories = useMemo(
    () => [...Object.keys(CERT_DATA).filter((c) => c !== CUSTOM_CERT_FILTER), CUSTOM_CERT_FILTER],
    [],
  );

  const certOptions = useMemo(
    () => (selectedCertCategory && selectedCertCategory !== CUSTOM_CERT_FILTER ? CERT_DATA[selectedCertCategory] || [] : []),
    [selectedCertCategory],
  );

  const certLabel = selectedCerts.length > 0
    ? selectedCerts.length === 1 ? selectedCerts[0] : `${selectedCerts[0]} 외 ${selectedCerts.length - 1}개`
    : "자격증";

  const locationLabel = selectedSiDos.length > 0
    ? selectedSiDos.length === 1
      ? selectedGunGus.length > 0
        ? `${selectedSiDos[0]} · ${selectedGunGus.length}개 구`
        : selectedSiDos[0]
      : `${selectedSiDos[0]} 외 ${selectedSiDos.length - 1}개`
    : "지역";

  useEffect(() => { setPosts(sortPosts(initialPosts)); }, [initialPosts]);

  useEffect(() => {
    if (!currentUser) return;
    setPosts((prev) => prev.map((post) => ({ ...post, likedByUser: isPostLiked(currentUser.id, "STUDY", post.id) })));
  }, [currentUser]);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCerts, selectedSiDos, selectedGunGus, studyMode, searchKeyword]);

  useEffect(() => {
    if (activePanel === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [activePanel]);

  // 시/도 변경 시 해당 시/도에 속하지 않는 군/구 제거
  useEffect(() => {
    setSelectedGunGus((prev) =>
      prev.filter((gunGu) =>
        selectedSiDos.some((siDo) => (REGION_DATA[siDo] || []).includes(gunGu))
      )
    );
  }, [selectedSiDos]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // 자격증 필터 (OR)
      if (selectedCerts.length > 0) {
        if (!post.cert || !selectedCerts.includes(post.cert)) return false;
      }

      const isOnline = post.location === "online";
      if (studyMode === "online" && !isOnline) return false;
      if (studyMode === "offline" && isOnline) return false;

      // 지역 필터는 오프라인 스터디에만 적용
      if (selectedSiDos.length > 0) {
        if (isOnline) return false;
        const regionText = getPostRegionText(post);
        if (!regionText) return false;

        const matchesSiDoAny = selectedSiDos.some((siDo) => matchesSiDo(regionText, siDo));
        if (!matchesSiDoAny) return false;

        if (selectedGunGus.length > 0) {
          const normalizedRegion = normalizeRegionText(regionText);
          const matchesGunGuAny = selectedGunGus.some((gunGu) =>
            normalizedRegion.includes(normalizeRegionText(gunGu))
          );
          if (!matchesGunGuAny) return false;
        }
      }

      // 검색 필터
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        if (
          !post.title?.toLowerCase().includes(kw) &&
          !post.content?.toLowerCase().includes(kw) &&
          !post.cert?.toLowerCase().includes(kw) &&
          !post.author?.toLowerCase().includes(kw)
        ) return false;
      }

      return true;
    });
  }, [selectedCerts, selectedSiDos, selectedGunGus, studyMode, searchKeyword, posts]);

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

  const PAGE_SIZE = 5;
  const paginatedPosts = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, currentPage]);
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const resetAll = () => {
    setSelectedCerts([]);
    setSelectedCertCategory("");
    setSelectedSiDos([]);
    setSelectedGunGus([]);
    setStudyMode("all");
    setSearchKeyword("");
  };

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in duration-500 px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">스터디 모집</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">자격증과 지역 필터로 원하는 스터디를 찾을 수 있습니다</p>
        </div>
        <button
          onClick={() => { setWriteType("study"); setWriteModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-full bg-hp-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-hp-700 hover:shadow-md active:scale-95"
        >
          모집글 작성
        </button>
      </div>

      {/* 스터디 방식 필터 */}
      <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
        {STUDY_MODE_OPTIONS.map((option) => {
          const active = studyMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setStudyMode(option.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-hp-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* 필터 바 */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* 헤더 탭 */}
        <div className="grid grid-cols-3 divide-x divide-slate-200">
          <button
            onClick={() => togglePanel("cert")}
            className={`flex items-center justify-between px-5 py-3.5 text-left transition hover:bg-slate-50 ${activePanel === "cert" ? "bg-slate-50" : ""}`}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">자격증</p>
              <p className={`mt-0.5 truncate text-sm font-bold ${isCertActive ? "text-hp-600" : "text-slate-400"}`}>
                {certLabel}
              </p>
            </div>
            {activePanel === "cert" ? <ChevronUp size={15} className="ml-2 shrink-0 text-slate-400" /> : <ChevronDown size={15} className="ml-2 shrink-0 text-slate-400" />}
          </button>

          <button
            onClick={() => togglePanel("location")}
            className={`flex items-center justify-between px-5 py-3.5 text-left transition hover:bg-slate-50 ${activePanel === "location" ? "bg-slate-50" : ""}`}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">지역</p>
              <p className={`mt-0.5 truncate text-sm font-bold ${isLocationActive ? "text-hp-600" : "text-slate-400"}`}>
                {locationLabel}
              </p>
            </div>
            {activePanel === "location" ? <ChevronUp size={15} className="ml-2 shrink-0 text-slate-400" /> : <ChevronDown size={15} className="ml-2 shrink-0 text-slate-400" />}
          </button>

          {activePanel === "search" ? (
            <div className="flex items-center gap-2 px-5 py-3.5">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                ref={searchInputRef}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="제목, 내용, 자격증명, 작성자 검색"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-xs placeholder:text-slate-400"
                autoFocus
              />
              {searchKeyword && (
                <button onClick={() => setSearchKeyword("")} className="shrink-0 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => togglePanel("search")}
              className={`flex items-center justify-between px-5 py-3.5 text-left transition hover:bg-slate-50`}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">검색</p>
                <p className={`mt-0.5 truncate text-sm font-bold ${isSearchActive ? "text-hp-600" : "text-slate-400"}`}>
                  {searchKeyword || "검색어 입력"}
                </p>
              </div>
              <Search size={15} className="ml-2 shrink-0 text-slate-400" />
            </button>
          )}
        </div>

        {/* 자격증 패널 */}
        {activePanel === "cert" && (
          <div className="border-t border-slate-200 p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {certificateCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCertCategory(selectedCertCategory === cat ? "" : cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    selectedCertCategory === cat ? "bg-hp-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {selectedCertCategory && selectedCertCategory !== CUSTOM_CERT_FILTER && certOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {certOptions.map((cert) => (
                  <button
                    key={cert}
                    onClick={() => setSelectedCerts((prev) => toggle(prev, cert))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      selectedCerts.includes(cert)
                        ? "bg-hp-600 text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {cert}
                  </button>
                ))}
              </div>
            )}

            {selectedCertCategory === CUSTOM_CERT_FILTER && (
              <div className="border-t border-slate-100 pt-4">
                <input
                  placeholder="자격증명 직접 입력 후 Enter"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-hp-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) { setSelectedCerts((prev) => toggle(prev, val)); (e.target as HTMLInputElement).value = ""; }
                    }
                  }}
                />
              </div>
            )}

            {isCertActive && (
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                <button onClick={() => { setSelectedCerts([]); setSelectedCertCategory(""); }} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                  초기화
                </button>
              </div>
            )}
          </div>
        )}

        {/* 지역 패널 */}
        {activePanel === "location" && (
          <div className="border-t border-slate-200 p-5">
            <div className="flex flex-wrap gap-2">
              {Object.keys(REGION_DATA).map((siDo) => (
                <button
                  key={siDo}
                  onClick={() => setSelectedSiDos((prev) => toggle(prev, siDo))}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    selectedSiDos.includes(siDo) ? "bg-hp-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {siDo}
                </button>
              ))}
            </div>

            {selectedSiDos.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {selectedSiDos.map((siDo) => (
                  (REGION_DATA[siDo] || []).length > 0 && (
                    <div key={siDo} className="mb-3">
                      <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400">{siDo}</p>
                      <div className="flex flex-wrap gap-2">
                        {(REGION_DATA[siDo] || []).map((gunGu) => (
                          <button
                            key={gunGu}
                            onClick={() => setSelectedGunGus((prev) => toggle(prev, gunGu))}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              selectedGunGus.includes(gunGu)
                                ? "bg-hp-600 text-white"
                                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {gunGu}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {isLocationActive && (
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                <button onClick={() => { setSelectedSiDos([]); setSelectedGunGus([]); }} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                  초기화
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 활성 필터 태그 */}
      {(isCertActive || isLocationActive || isStudyModeActive || isSearchActive) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {isStudyModeActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              {studyMode === "online" ? "온라인스터디" : "오프라인스터디"}
              <button onClick={() => setStudyMode("all")}><X size={11} /></button>
            </span>
          )}
          {selectedCerts.map((cert) => (
            <span key={cert} className="inline-flex items-center gap-1.5 rounded-full bg-hp-50 px-3 py-1 text-xs font-bold text-hp-700">
              {cert}
              <button onClick={() => setSelectedCerts((prev) => prev.filter((c) => c !== cert))}><X size={11} /></button>
            </span>
          ))}
          {selectedSiDos.map((siDo) => (
            <span key={siDo} className="inline-flex items-center gap-1.5 rounded-full bg-hp-50 px-3 py-1 text-xs font-bold text-hp-700">
              {siDo}
              <button onClick={() => {
                setSelectedSiDos((prev) => prev.filter((s) => s !== siDo));
                setSelectedGunGus((prev) => prev.filter((g) => !(REGION_DATA[siDo] || []).includes(g)));
              }}><X size={11} /></button>
            </span>
          ))}
          {selectedGunGus.map((gunGu) => (
            <span key={gunGu} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {gunGu}
              <button onClick={() => setSelectedGunGus((prev) => prev.filter((g) => g !== gunGu))}><X size={11} /></button>
            </span>
          ))}
          {isSearchActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-hp-50 px-3 py-1 text-xs font-bold text-hp-700">
              "{searchKeyword}"
              <button onClick={() => setSearchKeyword("")}><X size={11} /></button>
            </span>
          )}
          <button onClick={resetAll} className="text-xs font-bold text-slate-400 hover:text-slate-600">
            전체 초기화
          </button>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white py-20 text-center text-sm font-medium text-slate-400">
          조건에 맞는 스터디가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => openPost(post.id)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white px-6 py-4 transition hover:bg-slate-50/50 hover:shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-hp-600">
                  {post.title}
                </h3>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
                  {post.cert || "기타"}
                </span>
                {post.location === "online" ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">온라인</span>
                ) : getStudyRegionBadge(post) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-600">
                    <MapPin size={12} />
                    {getStudyRegionBadge(post)}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-300">장소 미정</span>
                )}
              </div>

              <p className="line-clamp-2 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-500">
                {post.content}
              </p>

              <div className="mt-2 flex items-center border-t border-slate-50 pt-2">
                <div className="flex flex-1 items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setProfileModal(post.authorId); }}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    <Avatar
                      name={post.author}
                      customVisualClassName={post.authorAvatarVisualClassName ?? undefined}
                      className="h-5 w-5 rounded-full text-[10px]"
                    />
                    {post.author}
                  </button>
                  <span className="text-[11px] font-medium text-slate-400">{formatBoardCreatedAt(post.createdAt)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); void handleToggleLike(post.id); }}
                  disabled={likeSubmittingPostId === post.id}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold transition ${post.likedByUser ? "text-red-400" : "text-slate-400 hover:bg-slate-100"} disabled:opacity-50`}
                >
                  <Heart size={13} className={post.likedByUser ? "fill-current" : ""} />
                  좋아요 {post.likes}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentQuery = searchParams.toString();
                    const returnTo = currentQuery ? `${pathname}?${currentQuery}` : pathname;
                    router.push(`/study/${post.id}?returnTo=${encodeURIComponent(returnTo)}#comment-input`);
                  }}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold text-slate-400 transition hover:bg-slate-200"
                >
                  <MessageCircle size={13} />
                  댓글 {post.comments?.length || 0}
                </button>
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-bold text-slate-400">
                  <Eye size={13} />
                  조회 {post.views}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`h-9 w-9 rounded-full text-sm font-bold transition ${currentPage === i ? "bg-hp-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
