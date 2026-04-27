import { listCommentsServer } from "@/features/boards/api/comments-server";
import StudyPageClient from "@/features/study/components/StudyPageClient";
import { listStudiesServer } from "@/features/study/api/study-server";

export default async function StudyPage() {
  const posts = await listStudiesServer();
  const initialPosts = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      comments: await listCommentsServer("STUDY", post.id),
    })),
  );

  return <StudyPageClient initialPosts={initialPosts} />;
}
