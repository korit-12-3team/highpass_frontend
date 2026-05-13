export interface EventType {
  id: string;
  title: string;
  content?: string;
  month: number;
  startDay: number;
  endDay: number;
  startDate?: string;
  endDate?: string;
  color: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  kind?: "general" | "certificate" | "kakao";
}

export interface UserProfile {
  id: string;
  email?: string;
  password?: string;
  nickname: string;
  name: string;
  ageRange: string;
  gender: string;
  location: string;
  role?: string;
  status?: "active" | "suspended" | "deleted" | string;
  profileImage?: string | null;
  avatarVisualClassName?: string | null;
  loginType?: string;
  socialProvider?: string;
  online?: boolean;
  lastSeenAt?: string;
  isCommentNotiOn?: boolean;
  isLikeNotiOn?: boolean;
}

export interface PostComment {
  id: number;
  author: string;
  authorId?: string;
  avatarVisualClassName?: string | null;
  text: string;
  createdAt?: string;
}

export interface BoardPost {
  id: string;
  type: "study" | "free";
  title: string;
  content: string;
  author: string;
  authorAvatarVisualClassName?: string | null;
  location?: string;
  address?: string;
  lat?: number;
  lng?: number;
  views: number;
  likes: number;
  scraps: number;
  comments: PostComment[];
  authorId: string;
  tags?:string[]; 
  createdAt: string;
  cert: string | null;
  likedByUser?: boolean;
  chatRoomId?: number; 
}

export interface ChatMessage {
  id?: number;
  senderId: string;
  senderName?: string;
  senderAvatarVisualClassName?: string | null;
  message: string;
  type : string;
  createdAt: string;
  unreadCount?: number;
  readBy?: number[];
  deleted?: boolean;
  roomName?: string;
  newOwnerId?: number;
}

export interface ChatRoom {
  type: string;
  id: string;
  ownerId?: number; 
  partnerId?: string;
  partnerNickname?: string;
  partnerAvatarVisualClassName?: string | null;
  messages: ChatMessage[];
  unreadCount?: number;
  name?: string;
  roomNickname?: string;
  displayName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  sortPinnedAt?: string;
  participants?: ChatRoomParticipant[];
}

export interface ChatRoomParticipant {
  userId: number;
  nickname: string;
  avatarVisualClassName?: string | null;
  status: string;
}

export interface ChatMessageReadState {
  messageId: number;
  unreadCount: number;
  readers: number[];
}

export interface ChatRoomReadState {
  roomId: number;
  messages: ChatMessageReadState[];
}

export interface SearchPlace {
  id: string;
  name: string;
  address: string;
  phone?: string;
  category?: string;
  lat: number;
  lng: number;
}

export type NotificationType = "COMMENT" | "LIKE" | "CALENDAR" | "CHAT" | "REPORT";

export interface NotificationResponse {
  id: number;
  senderNickname: string;
  type: NotificationType;
  message: string;
  targetId: number;
  targetType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export type TodoItem = {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
  completedAt?: string;
};

export type TodoMap = Record<string, TodoItem[]>;
