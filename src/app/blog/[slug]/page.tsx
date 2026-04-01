import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 정적 생성 지원
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return {
    title: post ? `${post.title} | 블로그` : "글을 찾을 수 없음",
    description: post?.summary || "블로그 상세 내용입니다.",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex items-center gap-3">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 transition-colors font-bold text-sm"
          >
            ← 블로그 목록
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-sm text-gray-400 truncate">{post.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="mb-6">
          <span className="inline-block text-xs font-bold px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full mb-3">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="font-mono">{post.date}</span>
            <span>·</span>
            <div className="flex gap-1">
              {post.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-orange-200 to-amber-100 mb-12" />

        {/*Markdown 렌더링 영역 */}
        <article className="prose prose-orange lg:prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:leading-8 prose-p:text-gray-600 prose-strong:text-orange-600 prose-a:text-orange-500 prose-a:font-bold prose-img:rounded-3xl prose-img:shadow-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </article>

        <div className="mt-20 flex flex-col sm:flex-row gap-4 border-t border-orange-100 pt-10">
          <Link
            href="/blog"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-100"
          >
            블로그 글 목록 보기
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border-2 border-orange-400 text-orange-500 font-bold rounded-2xl hover:bg-orange-50 transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </main>

      <footer className="border-t border-orange-100 mt-16 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 text-center text-sm text-gray-400">
          <p>© 2026 자격증 시험일정. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
