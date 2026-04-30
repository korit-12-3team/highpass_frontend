// KakaoTalk Calendar PlayMCP integration
// Wraps all 6 PlayMCP KakaotalkCal tools with typed interfaces

export type KakaoEvent = {
  eventId?: string;
  title: string;
  description?: string;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  allDay?: boolean;
  location?: string;
  color?: string;
};

export type KakaoTask = {
  taskId?: string;
  title: string;
  dueDate?: string; // ISO 8601 date
  memo?: string;
  isDone?: boolean;
};

export type KakaoFriendBirthday = {
  friendId: string;
  name: string;
  birthday: string; // MM-DD or YYYY-MM-DD
};

export type KakaoCurrentTime = {
  currentTime: string; // ISO 8601
  timezone: string;
};

export type CreateEventInput = {
  title: string;
  startAt: string;
  endAt: string;
  description?: string;
  allDay?: boolean;
  location?: string;
  color?: string;
};

export type CreateTaskInput = {
  title: string;
  dueDate?: string;
  memo?: string;
};

export type GetEventInput = {
  eventId?: string;
  from?: string;
  to?: string;
};

export type GetTaskInput = {
  taskId?: string;
  from?: string;
  to?: string;
};

