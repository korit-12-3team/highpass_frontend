import { notFound } from "next/navigation";
import Link from "next/link";
import { getFreeBoardPostById, getAllFreeBoardPosts } from "@/lib/freeboard";
import UserProfileCard from "@/components/UserProfileCard";

export function generateStaticParams() {
  const posts = getAllFreeBoardPosts();
  return posts.map((post) => ({
    id: String(post.id),
  }));
}

export default async function FreeBoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getFreeBoardPostById(Number(id));

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex items-center gap-3">
          <Link
            href="/free"
            className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 transition-colors font-bold text-sm"
          >
            ← 자유게시판 목록
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-sm text-gray-400 truncate">{post.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-6 flex gap-2">
          <span className="inline-block text-xs font-bold px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full">
            조회수 {post.viewCount}
          </span>
          <span className="inline-block text-xs font-bold px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full">
            좋아요 ❤️ {post.favoriteCount}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>

        <UserProfileCard profile={{
          nickname: post.userNickname,
          age: post.userAge,
          gender: post.userGender,
          region: post.userRegion,
          createdAt: post.createdAt
        }} />

        {/* 본문 */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 sm:p-8 mb-8 text-gray-700 leading-8 whitespace-pre-line text-lg min-h-[300px]">
          {post.content}
        </div>

        {/* 댓글 껍데기 */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💬</span> 댓글 (0)
          </h2>
          <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl mb-4">
            아직 작성된 댓글이 없습니다. 첫 댓글을 남겨주세요!
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="댓글을 입력하세요..." 
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
            />
            <button className="px-5 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-sm hover:bg-orange-600 transition-colors">
              등록
            </button>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button className="flex-1 flex justify-center py-4 bg-orange-50 text-orange-600 font-bold rounded-2xl border border-orange-200 hover:bg-orange-100 transition-colors shadow-sm">
            ❤️ 좋아요
          </button>
          <Link
            href="/free"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
