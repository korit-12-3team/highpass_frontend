"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Heart, MessageCircle, ExternalLink } from "lucide-react";
import type { BoardPost } from "@/entities/common/types";
import { createComment } from "@/shared/boards/api/comments";
import { isPostLiked, saveLikedPost, toggleBoardLike } from "@/shared/boards/api/likes";
import { formatBoardCreatedAt, getBoardCreatedAtTime } from "@/shared/boards/utils/detail-utils";
import { useApp } from "@/shared/context/AppContext";
import Avatar from "@/shared/components/common/Avatar";

function sortPosts(posts: BoardPost[]) {
  return Array.from(
    posts.reduce((map, item) => {
      map.set(item.id, item);
      return map;
    }, new Map<string, BoardPost>()).values(),
  )
    .slice()
    .sort((a, b) => {
      const dt = getBoardCreatedAtTime(b.createdAt) - getBoardCreatedAtTime(a.createdAt);
      if (dt !== 0) return dt;
      return Number(b.id) - Number(a.id);
    });
}

export default function FreeBoardPageClient({ initialPosts }: { initialPosts: BoardPost[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, setProfileModal, setWriteModalOpen, setWriteType } = useApp();
  const [posts, setPosts] = useState<BoardPost[]>(() => sortPosts(initialPosts));
  const [likeSubmittingPostId, setLikeSubmittingPostId] = useState<string | null>(null);
  const [inlineCommentDrafts, setInlineCommentDrafts] = useState<Record<string, string>>({});
  const [inlineCommentSubmittingPostId, setInlineCommentSubmittingPostId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState(() => searchParams.get("tag") ?? "");

  useEffect(() => {
    setPosts(sortPosts(initialPosts));
  }, [initialPosts]);

  useEffect(() => {
    if (!currentUser) return;
    setPosts((prev) =>
      sortPosts(
        prev.map((post) => ({
          ...post,
          likedByUser: isPostLiked(currentUser.id, "FREE", post.id),
        })),
      ),
    );
  }, [currentUser]);

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
      await toggleBoardLike("FREE", targetId, userId);
      saveLikedPost(currentUser.id, "FREE", post.id, nextLiked);
      updatePostLocally(post.id, (currentPost) => ({
        ...currentPost,
        likes: nextLiked ? currentPost.likes + 1 : Math.max(0, currentPost.likes - 1),
        likedByUser: nextLiked,
      }));
    } finally {
      setLikeSubmittingPostId(null);
    }
  };

  const submitInlineComment = async (postId: string) => {
    if (!currentUser || inlineCommentSubmittingPostId === postId) return;
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const draft = (inlineCommentDrafts[post.id] || "").trim();
    if (!draft) return;

    const userId = Number(currentUser.id);
    const targetId = Number(post.id);
    if (!Number.isFinite(userId) || !Number.isFinite(targetId)) return;

    try {
      setInlineCommentSubmittingPostId(post.id);
      const created = await createComment({
        content: draft,
        targetType: "FREE",
        targetId,
        userId,
      });
      updatePostLocally(post.id, (currentPost) => ({
        ...currentPost,
        comments: [...currentPost.comments, created],
      }));
      setInlineCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));
    } finally {
      setInlineCommentSubmittingPostId(null);
    }
  };

  const openPost = (postId: string) => {
    const currentQuery = searchParams.toString();
    const returnTo = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    router.push(`/free/${postId}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const filteredPosts = useMemo(() => {
    if (!tagFilter) return posts;
    return posts.filter((post) => post.tags?.includes(tagFilter));
  }, [posts, tagFilter]);

  useEffect(() => {
    setTagFilter(searchParams.get("tag") ?? "");
  }, [searchParams]);


  const handleTagClick = (tag: string) => {
    const next = tag === "전체" ? "" : (tagFilter === tag ? "" : tag);
    setTagFilter(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("tag", next);
    else params.delete("tag");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-[550px] animate-in fade-in duration-500">
      <div className="mb-4 rounded-2xl border border-sky-300/40 bg-white/50 px-6 py-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
  <div className="mb-6 flex items-end justify-between gap-10">
    <div>
      <h2 className="text-2xl font-bold text-slate-900">자유게시판</h2>
      <p className="mt-1 text-sm text-slate-500">당신의 이야기를 공유해주세요</p>
    </div>
    <button
      onClick={() => { setWriteType("free"); setWriteModalOpen(true); }}
      className="rounded-full bg-sky-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
    >
      새 게시물
    </button>
  </div>
  <div className="flex flex-wrap gap-2">
    {["전체", "취업", "합격후기", "스터디후기", "정보공유", "자격증", "꿀팁", "질문", "일상", "유머", "잡담"].map((tag) => (
      <button
        key={tag}
        onClick={() => handleTagClick(tag)}
        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
          (tag === "전체" && tagFilter === "") || tagFilter === tag
            ? "bg-sky-600 text-white shadow-md"
            : "bg-white/30 text-slate-600 hover:bg-white/50"
        }`}
      >
        {tag === "전체" ? tag : `#${tag}`}
      </button>
    ))}
  </div>

  {tagFilter === "취업" && (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-3 text-xs font-bold text-slate-500">채용 플랫폼 바로가기</p>
      <div className="grid grid-cols-6 gap-3">
        {[
          { name: "고용24", url: "https://www.work24.go.kr", favicon: "https://www.google.com/s2/favicons?domain=work24.go.kr&sz=32" },
          { name: "사람인", url: "https://www.saramin.co.kr", favicon: "https://www.saramin.co.kr/favicon.ico" },
          { name: "잡코리아", url: "https://www.jobkorea.co.kr", favicon: "https://www.jobkorea.co.kr/favicon.ico" },
          { name: "원티드", url: "https://www.wanted.co.kr", favicon: "https://www.wanted.co.kr/favicon.ico" },
          { name: "잡플래닛", url: "https://www.jobplanet.co.kr", favicon: "https://www.jobplanet.co.kr/favicon.ico" },
          { name: "링크드인", url: "https://www.linkedin.com", favicon: "https://www.linkedin.com/favicon.ico" },
        ].map((site) => (
          <a
            key={site.name}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <img
              src={site.favicon}
              alt={site.name}
              className="h-7 w-7 rounded-md object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-[11px] text-slate-500">{site.name}</span>
          </a>
        ))}
      </div>
    </div>
  )}

  {tagFilter === "자격증" && (
    <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
      <a
        href="/search"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        🔍 자격증 정보 보러가기
      </a>
    </div>
  )}
</div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-[28px] border border-black/10 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          아직 게시글이 없습니다.
          <br />
          첫 번째 글을 남겨보세요.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <article
              key={`free-${post.id}`}
              className="overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-hp-200 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center gap-3 bg-gradient-to-r from-white to-hp-50/40 px-4 py-3">
                <button
                  onClick={() => setProfileModal(post.authorId)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-hp-100 p-[2px] transition hover:scale-105 hover:bg-hp-200"
                  title="프로필 보기"
                >
                  <Avatar
                    name={post.author}
                    customVisualClassName={post.authorAvatarVisualClassName ?? undefined}
                    className="h-full w-full rounded-full text-xs"
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    className="block truncate text-left text-sm font-semibold text-slate-900 transition hover:text-hp-700 hover:underline"
                    onClick={() => setProfileModal(post.authorId)}
                  >
                    {post.author}
                  </button>
                  <div className="text-xs text-slate-400">{formatBoardCreatedAt(post.createdAt)}</div>
                </div>
              </div>

              <div onClick={() => openPost(post.id)} className="group block w-full text-left">
                <div className="bg-gradient-to-br from-white via-hp-50/30 to-white px-5 py-6 transition group-hover:from-hp-50/50 group-hover:via-white group-hover:to-hp-50/20">
                  {post.title ? <h3 className="text-xl font-bold leading-tight text-slate-950 transition group-hover:text-hp-800">{post.title}</h3> : null}
                  <p className={`whitespace-pre-wrap text-[15px] leading-7 text-slate-700 ${post.title ? "mt-3" : ""}`}>
                    {post.content}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                     {post.tags.filter(Boolean).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagClick(tag);
                          }}
                          className="rounded-full bg-hp-50 px-2.5 py-1 text-[11px] font-bold text-hp-600 transition hover:bg-hp-100"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => void handleToggleLike(post.id)}
                    disabled={likeSubmittingPostId === post.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      post.likedByUser ? "text-red-400" : "text-slate-400 hover:bg-slate-100"
                    } disabled:opacity-50`}
                  >
                    <Heart size={14} className={post.likedByUser ? "fill-current" : ""} />
                    좋아요 {post.likes}
                  </button>
                  <button
                    onClick={() => openPost(post.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-hp-700"
                  >
                    <MessageCircle size={13} />
                    댓글 {post.comments?.length || 0}
                  </button>
                </div>

                {post.comments.length > 0 && (
                  <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 px-4 py-3">
                    {post.comments.slice(-2).map((comment) => (
                      <div key={comment.id} className="flex items-center gap-1 text-xs text-slate-600">
                        <button
                          type="button"
                          onClick={() => comment.authorId && setProfileModal(comment.authorId)}
                          className="shrink-0"
                        >
                          <Avatar
                            name={comment.author}
                            customVisualClassName={comment.avatarVisualClassName ?? undefined}
                            className="h-5 w-5 rounded-full text-[9px]"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => comment.authorId && setProfileModal(comment.authorId)}
                          className="shrink-0 font-semibold text-slate-800 hover:text-hp-600 hover:underline"
                        >
                          {comment.author}
                        </button>
                        <span className="text-slate-300">·</span>
                        <span className="min-w-0 flex-1 truncate">{comment.text}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-slate-400">{formatBoardCreatedAt(comment.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-slate-50 px-4 py-2 transition focus-within:border-hp-300 focus-within:bg-white focus-within:shadow-sm">
                  <Avatar
                    name={currentUser?.nickname}
                    customVisualClassName={currentUser?.avatarVisualClassName ?? undefined}
                    className="h-6 w-6 rounded-full text-[11px]"
                  />
                  <input
                    value={inlineCommentDrafts[post.id] || ""}
                    onChange={(e) => setInlineCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitInlineComment(post.id);
                      }
                    }}
                    placeholder="이 게시물에 댓글 달기"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => void submitInlineComment(post.id)}
                    disabled={inlineCommentSubmittingPostId === post.id || !(inlineCommentDrafts[post.id] || "").trim()}
                    className="text-sm font-semibold text-hp-600 transition hover:text-hp-700 disabled:text-slate-300"
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