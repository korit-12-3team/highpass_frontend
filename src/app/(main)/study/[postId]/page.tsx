import { listCommentsServer } from "@/features/boards/api/comments-server";
import StudyPostPageClient from "@/features/study/components/StudyPostPageClient";
import { getStudyServer } from "@/features/study/api/study-server";

export default async function StudyPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { postId } = await params;
  const { returnTo } = await searchParams;
  const initialPost = await getStudyServer(postId);
  const initialComments = initialPost ? await listCommentsServer("STUDY", postId) : [];

  return (
    <StudyPostPageClient
      postId={postId}
      initialPost={initialPost}
      initialComments={initialComments}
      returnTo={returnTo ?? null}
    />
  );
}
