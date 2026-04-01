import Link from "next/link";
import { getAllFreeBoardPosts } from "@/lib/freeboard";

export default function FreeBoardPage() {
  const posts = getAllFreeBoardPosts();

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>📝</span>
            <Link href="/" className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight leading-none">
              자격증 시험일정
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">홈</Link>
            <Link href="/calendar" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">캘린더</Link>
            <Link href="/study" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">스터디</Link>
            <Link href="/free" className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">자유게시판</Link>
          </nav>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-500 to-amber-400 text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">자유게시판</h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed max-w-md">
            자격증 관련 질문, 합격 수기, 고민 상담까지 수험생들과 자유롭게 이야기해 보세요!
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold text-gray-900">최신 게시글</h2>
          <button className="bg-orange-500 text-white font-bold py-2 px-4 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
            + 글쓰기
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_100px_80px] gap-4 p-4 bg-orange-50 border-b border-orange-100 font-bold text-gray-500 text-sm text-center">
            <div className="text-left">제목</div>
            <div className="hidden sm:block">작성자</div>
            <div className="hidden sm:block">작성일</div>
            <div className="hidden sm:block">조회수</div>
          </div>
          <ul>
            {posts.map((post) => (
              <li key={post.id} className="border-b border-gray-100 last:border-0 hover:bg-orange-50/50 transition-colors">
                <Link href={`/free/${post.id}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_100px_80px] gap-4 p-4 text-sm items-center text-center">
                  <div className="text-left">
                    <span className="font-bold text-gray-900 group-hover:text-orange-600 line-clamp-1">{post.title}</span>
                    {/* 모바일 뷰어 전용 메타데이터 */}
                    <div className="sm:hidden flex gap-2 text-xs text-gray-400 mt-1">
                      <span>{post.userNickname}</span>
                      <span>·</span>
                      <span>{post.createdAt.split(" ")[0]}</span>
                      <span>·</span>
                      <span>👁 {post.viewCount}</span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-gray-600 font-medium truncate">{post.userNickname}</div>
                  <div className="hidden sm:block text-gray-400 truncate">{post.createdAt.split(" ")[0]}</div>
                  <div className="hidden sm:block text-gray-400">{post.viewCount}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
