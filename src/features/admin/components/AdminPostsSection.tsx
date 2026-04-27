import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  MessageCircle,
  Siren,
  Trash2,
  UserRound,
} from "lucide-react";
import type { PostComment } from "@/entities/common/types";
import type { AdminPost, PostStatus } from "@/features/admin/types";
import {
  formatDateOnly,
  postStatusLabel,
  statusClass,
} from "@/features/admin/components/AdminCommon";
import { listComments } from "@/features/boards/api/comments";

export function AdminPostsSection({
  posts,
  selectedPost,
  onOpenPost,
  onBack,
  onUpdatePostStatus,
}: {
  posts: AdminPost[];
  selectedPost: AdminPost | null;
  onOpenPost: (post: AdminPost) => void;
  onBack: () => void;
  onUpdatePostStatus: (postId: string, status: PostStatus) => void;
}) {
  if (selectedPost) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            게시글 목록
          </button>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-hp-50 px-2.5 py-1 text-xs font-black text-hp-700">
                  {selectedPost.type === "study" ? "스터디 모집" : "자유 게시글"}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(selectedPost.status)}`}
                >
                  {postStatusLabel[selectedPost.status]}
                </span>
              </div>
              <h3 className="mt-3 break-words text-2xl font-black text-slate-950">
                {selectedPost.title}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound size={15} />
                  {selectedPost.author}
                </span>
                <span>{formatDateOnly(selectedPost.createdAt)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={15} />
                  조회 {selectedPost.views}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle size={15} />
                  댓글 {selectedPost.comments}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Siren size={15} />
                  신고 {selectedPost.reports}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="min-h-40 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {selectedPost.content || "내용이 없습니다."}
            </p>
          </article>

          <AdminPostComments post={selectedPost} />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-black text-slate-950">게시글 목록</h3>
        <span className="text-xs font-black text-slate-400">{posts.length}개</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">게시글</th>
              <th className="px-4 py-3">작성자</th>
              <th className="px-4 py-3">종류</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">작성일</th>
              <th className="px-4 py-3 text-right">지표</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.map((post) => (
              <tr
                key={post.id}
                onClick={() => onOpenPost(post)}
                className="cursor-pointer bg-white transition hover:bg-hp-50/80"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-hp-100 text-hp-700">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{post.title}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {post.content || "내용 없음"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 font-bold text-slate-700">
                    <UserRound size={16} />
                    {post.author}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-600">
                  {post.type === "study" ? "스터디 모집" : "자유 게시글"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(post.status)}`}
                  >
                    {postStatusLabel[post.status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-600">
                  {formatDateOnly(post.createdAt)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-600">
                  조회 {post.views} · 댓글 {post.comments} · 신고 {post.reports}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePostStatus(
                          post.id,
                          post.status === "deleted" || post.status === "hidden"
                            ? "visible"
                            : "hidden",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      <CheckCircle2 size={14} />
                      {post.status === "deleted"
                        ? "복구"
                        : post.status === "hidden"
                          ? "공개"
                          : "숨김"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("게시글을 삭제 처리하시겠습니까?")) {
                          onUpdatePostStatus(post.id, "deleted");
                        }
                      }}
                      disabled={post.status === "deleted"}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminPostComments({ post }: { post: AdminPost }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const targetId = post.id.includes("-")
    ? post.id.split("-").at(-1) ?? post.id
    : post.id;
  const targetType = post.type === "study" ? "STUDY" : "FREE";

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    void listComments(targetType, targetId)
      .then((items) => {
        if (cancelled) return;
        setComments(items);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setComments([]);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [targetId, targetType]);

  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-black text-slate-950">댓글</h4>
        <span className="text-xs font-black text-slate-400">{comments.length}개</span>
      </div>

      <div className="p-4">
        {status === "loading" ? (
          <p className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
            댓글을 불러오는 중입니다.
          </p>
        ) : status === "error" ? (
          <p className="rounded-lg bg-rose-50 p-5 text-center text-sm font-semibold text-rose-500">
            댓글을 불러오지 못했습니다.
          </p>
        ) : comments.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
            아직 댓글이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
                  {comment.author.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      {comment.author}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {formatAdminDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatAdminDateTime(value?: string) {
  if (!value) return "날짜 없음";
  return value.replace("T", " ").slice(0, 16);
}
