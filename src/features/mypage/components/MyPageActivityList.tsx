import React from "react";
import { Clock3, FileText, MessageSquare } from "lucide-react";
import type { BoardPost, PostComment } from "@/entities/common/types";
import { formatBoardDate } from "@/features/boards/utils/detail-utils";
import { EmptyState } from "@/features/mypage/components/MyPageCommon";

type MyCommentItem = {
  comment: PostComment;
  post: BoardPost;
};

function PostTypeBadge({ type }: { type: BoardPost["type"] }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        type === "study" ? "bg-hp-100 text-hp-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      {type === "study" ? "스터디 모집" : "자유 게시판"}
    </span>
  );
}

export function PostList({ posts, onOpenPost }: { posts: BoardPost[]; onOpenPost: (post: BoardPost) => void }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={24} />}
        title="작성한 게시물이 없습니다"
        description="자유 게시판과 스터디 모집 게시글을 작성하면 여기에서 모아볼 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <button
          key={`${post.type}-${post.id}`}
          type="button"
          onClick={() => onOpenPost(post)}
          className="block w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-hp-300 hover:shadow-md"
        >
          <div className="flex flex-wrap items-center gap-2">
            <PostTypeBadge type={post.type} />
            {post.cert ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{post.cert}</span> : null}
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock3 size={12} />
              {formatBoardDate(post.createdAt)}
            </span>
          </div>

          <h4 className="mt-3 text-lg font-black text-slate-950">{post.title}</h4>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{post.content}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
            <span>조회수 {post.views}</span>
            <span>좋아요 {post.likes}</span>
            <span>댓글 {post.comments.length}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function CommentList({ items, onOpenPost }: { items: MyCommentItem[]; onOpenPost: (post: BoardPost) => void }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={24} />}
        title="작성한 댓글이 없습니다"
        description="게시글에 댓글을 남기면 어떤 글에 참여했는지 여기에서 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map(({ comment, post }) => (
        <button
          key={`${post.type}-${post.id}-${comment.id}`}
          type="button"
          onClick={() => onOpenPost(post)}
          className="block w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-hp-300 hover:shadow-md"
        >
          <div className="flex flex-wrap items-center gap-2">
            <PostTypeBadge type={post.type} />
            <span className="text-xs font-semibold text-slate-400">{formatBoardDate(comment.createdAt)}</span>
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Commented Post</p>
          <h4 className="mt-1 text-base font-black text-slate-900">{post.title}</h4>
          <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            {comment.text}
          </p>
        </button>
      ))}
    </div>
  );
}
