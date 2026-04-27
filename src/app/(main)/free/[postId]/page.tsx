import { listCommentsServer } from "@/features/boards/api/comments-server";
import FreePostPageClient from "@/features/free-board/components/FreePostPageClient";
import { getBoardServer } from "@/features/free-board/api/boards-server";

export default async function FreePostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { postId } = await params;
  const { returnTo } = await searchParams;
  const initialPost = await getBoardServer(postId);
  const initialComments = initialPost ? await listCommentsServer("FREE", postId) : [];

  return (
    <FreePostPageClient
      postId={postId}
      initialPost={initialPost}
      initialComments={initialComments}
      returnTo={returnTo ?? null}
    />
  );
}
