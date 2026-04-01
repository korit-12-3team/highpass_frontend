export interface ChatRoom {
  id: number;
  partnerNickname: string;
  partnerRegion: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number; // 0이면 로그인한 '나', 그 외는 '상대방'이라 가정
  message: string;
  createdAt: string;
}

export const chatRooms: ChatRoom[] = [
  {
    id: 1,
    partnerNickname: "공부왕철수",
    partnerRegion: "서울시 강남구",
    lastMessage: "오늘 스터디룸 예약하셨나요?",
    lastMessageTime: "오후 2:30",
    unreadCount: 1,
  },
  {
    id: 2,
    partnerNickname: "단기합격러",
    partnerRegion: "대구광역시 수성구",
    lastMessage: "네 감사합니다! 주말에 뵙겠습니다.",
    lastMessageTime: "어제",
    unreadCount: 0,
  },
];

export const chatMessages: ChatMessage[] = [
  { id: 101, roomId: 1, senderId: 101, message: "안녕하세요! 글 보고 연락드렸습니다.", createdAt: "오후 2:10" },
  { id: 102, roomId: 1, senderId: 0, message: "네 안녕하세요! 이번 기사 필기 준비 중이신가요?", createdAt: "오후 2:15" },
  { id: 103, roomId: 1, senderId: 101, message: "맞습니다. 오늘 스터디룸 예약하셨나요?", createdAt: "오후 2:30" },
];

export function getChatRooms() {
  return chatRooms;
}

export function getChatMessagesByRoomId(roomId: number) {
  return chatMessages.filter(m => m.roomId === roomId);
}

export function getChatRoomById(roomId: number) {
  return chatRooms.find(r => r.id === roomId);
}
