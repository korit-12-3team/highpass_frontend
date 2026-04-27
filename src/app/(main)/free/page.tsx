import { listCommentsServer } from "@/features/boards/api/comments-server";
import FreeBoardPageClient from "@/features/free-board/components/FreeBoardPageClient";
import { listBoardsServer } from "@/features/free-board/api/boards-server";

export default async function FreePage() {
  const posts = await listBoardsServer();
  const initialPosts = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      comments: await listCommentsServer("FREE", post.id),
    })),
  );

  return <FreeBoardPageClient initialPosts={initialPosts} />;
}
