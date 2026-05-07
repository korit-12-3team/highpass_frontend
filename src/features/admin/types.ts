export type AdminSection = "users" | "posts" | "reports" | "certificates";
export type UserStatus = "active" | "suspended" | "deleted";
export type PostStatus = "visible" | "hidden" | "deleted";
export type PostType = "free" | "study";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ApiStatus = "idle" | "loading" | "ready" | "unavailable";
export type AuthStatus = "checking" | "authenticated" | "unauthorized";

export type AdminUser = {
  id: string;
  email: string;
  nickname: string;
  role: "USER" | "ADMIN";
  status: UserStatus;
  avatarVisualClassName?: string | null;
  createdAt: string;
  lastSeenAt?: string;
  deletedAt?: string;
  region: string;
  loginType?: "local" | "social" | string;
  socialProvider?: string;
  online?: boolean;
  posts: number;
  comments: number;
  reports: number;
  gender: string;
  ageRange: string;
};

export type AdminPost = {
  id: string;
  type: PostType;
  title: string;
  content?: string;
  authorId: string;
  author: string;
  status: PostStatus;
  createdAt: string;
  views: number;
  comments: number;
  reports: number;
};

export type AdminReport = {
  id: string;
  targetType: "user" | "post" | "comment" | "chat" | "inquiry";
  targetId: string;
  targetLabel: string;
  reason: string;
  reporter: {
    name: string;
    email: string;
  };
  createdAt: string;
  status: ReportStatus;
  adminResponse?: string;
  respondedAt?: string;
  userDetail?: {
    userId: string;
    nickname: string;
    email: string;
  };
  postDetail?: {
    postId: string;
    postType: string;
    title: string;
    content: string;
    author: string;
  };
  commentDetail?: {
    commentId: string;
    content: string;
    author: string;
    postType: string;
    postId: string;
    postTitle: string;
  };
  chatDetail?: {
    roomId: string;
    roomName: string;
    roomType?: "PERSONAL" | "GROUP";
    partner?: {
      userId: string;
      nickname: string;
      email: string;
    };
  };
  inquiryDetail?: {
    title: string;
    accountEmail: string;
  };
};
