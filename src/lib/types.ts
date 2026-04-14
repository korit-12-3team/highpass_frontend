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
  kind?: "general" | "certificate";
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
  profileImage?: string | null;
  loginType?: string;
}

export interface PostComment {
  id: number;
  author: string;
  text: string;
  createdAt?: string;
}

export interface BoardPost {
  id: string;
  type: "study" | "free";
  title: string;
  content: string;
  author: string;
  location?: string;
  lat?: number;
  lng?: number;
  views: number;
  likes: number;
  scraps: number;
  comments: PostComment[];
  authorId: string;
  createdAt: string;
  cert: string | null;
  likedByUser?: boolean;
}

export interface ChatMessage {
  id: number;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  partnerId: string;
  partnerNickname: string;
  messages: ChatMessage[];
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

export type TodoItem = {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
  completedAt?: string;
};

export type TodoMap = Record<string, TodoItem[]>;
