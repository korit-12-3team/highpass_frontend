export type AdminSection = "users" | "posts" | "reports";
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
  name: string;
  role: "USER" | "ADMIN";
  status: UserStatus;
  joinedAt: string;
  lastSeenAt?: string;
  deletedAt?: string;
  region: string;
  loginType?: "local" | "social" | string;
  socialProvider?: string;
  online?: boolean;
  posts: number;
  comments: number;
  reports: number;
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
  reporter: string;
  createdAt: string;
  status: ReportStatus;
};
