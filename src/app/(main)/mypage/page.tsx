import { listCommentsServer } from "@/features/boards/api/comments-server";
import { listBoardsServer } from "@/features/free-board/api/boards-server";
import MyPageClient from "@/features/mypage/components/MyPageClient";
import { getCurrentUserProfileServer } from "@/features/mypage/api/profile-server";
import { listStudiesServer } from "@/features/study/api/study-server";

export default async function MyPage() {
  const profile = await getCurrentUserProfileServer();
  const userId = profile?.id;

  if (!userId) {
    return <MyPageClient initialPosts={[]} initialProfile={null} />;
  }

  const [freeBoards, studies] = await Promise.all([
    listBoardsServer(userId),
    listStudiesServer(userId),
  ]);

  const initialPosts = await Promise.all(
    [...freeBoards, ...studies].map(async (post) => ({
      ...post,
      comments: await listCommentsServer(post.type === "study" ? "STUDY" : "FREE", post.id),
    })),
  );

  return <MyPageClient initialPosts={initialPosts} initialProfile={profile} />;
}
