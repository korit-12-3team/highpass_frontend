"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Heart, MessageCircle } from "lucide-react";
import type { BoardPost } from "@/entities/common/types";
import { createComment } from "@/features/boards/api/comments";
import { isPostLiked, saveLikedPost, toggleBoardLike } from "@/features/boards/api/likes";
import { formatBoardCreatedAt, getBoardCreatedAtTime, getInitial } from "@/features/boards/utils/detail-utils";
import { useApp } from "@/shared/context/AppContext";

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

  return (
    <div className="mx-auto max-w-xl animate-in fade-in duration-500">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-black/5 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">자유게시판</h2>
              <p className="mt-1 text-sm text-slate-500">가볍게 공유하고 바로 반응을 확인하는 공간</p>
            </div>
            <button
              onClick={() => {
                setWriteType("free");
                setWriteModalOpen(true);
              }}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
            >
              새 게시물
            </button>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-[28px] border border-black/10 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          아직 게시글이 없습니다.
          <br />
          첫 번째 글을 남겨보세요.
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={`free-${post.id}`}
              className="overflow-hidden rounded-[28px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-hp-200 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center gap-3 border-b border-hp-100 bg-gradient-to-r from-white to-hp-50/40 px-4 py-3">
                <button
                  onClick={() => setProfileModal(post.authorId)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-hp-100 p-[2px] transition hover:scale-105 hover:bg-hp-200"
                  title="프로필 보기"
                >
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-hp-700">
                    {getInitial(post.author)}
                  </span>
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

              <button onClick={() => openPost(post.id)} className="group block w-full text-left">
                <div className="border-b border-hp-100 bg-gradient-to-br from-white via-hp-50/30 to-white px-5 py-6 transition group-hover:from-hp-50/50 group-hover:via-white group-hover:to-hp-50/20">
                  {post.title ? <h3 className="text-xl font-bold leading-tight text-slate-950 transition group-hover:text-hp-800">{post.title}</h3> : null}
                  <p className={`text-[15px] leading-7 text-slate-700 ${post.title ? "mt-3" : ""}`}>{post.content}</p>
                </div>
              </button>

              <div className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => void handleToggleLike(post.id)}
                    disabled={likeSubmittingPostId === post.id}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                      post.likedByUser ? "bg-red-50 text-red-500 shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    } disabled:opacity-50`}
                  >
                    <Heart size={16} className={post.likedByUser ? "fill-current" : ""} />
                    좋아요 {post.likes}
                  </button>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Eye size={16} />
                    {post.views}
                  </span>
                  <button
                    onClick={() => openPost(post.id)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-hp-700"
                  >
                    <MessageCircle size={16} />
                    댓글 {post.comments?.length || 0}
                  </button>
                </div>

                {post.comments.length > 0 && (
                  <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 px-4 py-3">
                    {post.comments.slice(-2).map((comment) => (
                      <div key={comment.id} className="flex items-center gap-1 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{comment.author}</span>
                        <span className="text-slate-300">·</span>
                        <span className="truncate">{comment.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 transition focus-within:border-hp-300 focus-within:bg-white focus-within:shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                    {getInitial(currentUser?.nickname || "U")}
                  </div>
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
