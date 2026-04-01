import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "블로그 | 자격증 정보 & 수험 팁",
  description: "AI가 전해주는 최신 자격증 정보와 합격 팁을 확인하세요.",
};

export default function BlogPage() {
  const posts = getAllPosts();

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
          <nav className="flex items-center gap-4 text-sm font-bold text-gray-400">
            <Link href="/" className="hover:text-orange-500 transition-colors">홈</Link>
            <Link href="/blog" className="text-orange-500">블로그</Link>
          </nav>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-500 to-amber-400 text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">자격증 블로그</h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed max-w-md">
            자격증 시험 합격 전술과 최신 뉴스, 그리고 동기부여 글까지 모두 전해드립니다.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">모든 글 ({posts.length})</h2>

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
            <span className="text-4xl">📭</span>
            <p className="mt-4 text-gray-400 font-medium tracking-tight">아직 등록된 블로그 글이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-300" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-700 rounded-full">{post.category}</span>
                    <span className="text-xs text-gray-300 font-mono">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900 line-clamp-2 group-hover:text-orange-500 transition-colors mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-1">
                    {post.summary}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-auto pt-4 border-t border-orange-50">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">#{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-orange-100 mt-8 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 text-center space-y-2 text-sm text-gray-400">
          <p>© 2026 자격증 시험일정. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
