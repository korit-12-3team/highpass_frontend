import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "src/content/posts");

export interface PostData {
  slug: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  tags: string[];
  content: string;
}

export function getAllPosts(): PostData[] {
  // 폴더가 없으면 빈 배열 반환
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");

      const { data, content } = matter(fileContents);

      // 날짜 처리 (YYYY-MM-DD 형식으로 변환)
      let date = "";
      if (data.date instanceof Date) {
        date = data.date.toISOString().split("T")[0];
      } else {
        date = String(data.date || "");
      }

      return {
        slug,
        title: data.title || "제목 없음",
        date,
        summary: data.summary || "",
        category: data.category || "일반",
        tags: data.tags || [],
        content,
      } as PostData;
    });

  // 날짜순 정렬 (최신순)
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): PostData | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // 날짜 처리 (YYYY-MM-DD 형식으로 변환)
  let date = "";
  if (data.date instanceof Date) {
    date = data.date.toISOString().split("T")[0];
  } else {
    date = String(data.date || "");
  }

  return {
    slug,
    title: data.title || "제목 없음",
    date,
    summary: data.summary || "",
    category: data.category || "일반",
    tags: data.tags || [],
    content,
  };
}
