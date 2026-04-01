"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getChatRoomById, getChatMessagesByRoomId, ChatRoom, ChatMessage } from "@/lib/chat";

export default function ChatClient({ roomId }: { roomId: number }) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      setRoom(getChatRoomById(roomId) || null);
      setMessages(getChatMessagesByRoomId(roomId) || []);
    }
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now(),
        roomId,
        senderId: 0, // '나'
        message: newMessage,
        createdAt: "방금"
      }
    ]);
    setNewMessage("");
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-500 font-bold">채팅방을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-2xl mx-auto shadow-2xl relative">
      {/* 고정 헤더 */}
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20 flex-shrink-0">
        <div className="px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="text-orange-500 hover:text-orange-600 transition-colors font-bold text-lg"
            >
              ←
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-300 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {room.partnerNickname[0]}
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 leading-tight">
                {room.partnerNickname}
              </h1>
              <p className="text-xs text-gray-400">{room.partnerRegion}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-red-500 font-medium text-sm transition-colors">
            나가기
          </button>
        </div>
      </header>

      {/* 대화창 (말풍선 영역) */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4">
        <div className="text-center">
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            더 이상 이전 대화 내역이 없습니다.
          </span>
        </div>
        
        {messages.map((msg) => {
          const isMe = msg.senderId === 0;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4`}>
              <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`p-4 rounded-3xl relative text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                  isMe 
                    ? "bg-orange-500 text-white rounded-tr-sm border-orange-600" 
                    : "bg-white text-gray-800 rounded-tl-sm border-gray-200"
                }`}>
                  {msg.message}
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 mb-1">{msg.createdAt}</span>
              </div>
            </div>
          );
        })}
      </main>

      {/* 고정 하단 입력 필드 */}
      <footer className="bg-white border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 min-w-0 bg-gray-50 border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            placeholder="메시지를 입력하세요..."
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-orange-600 disabled:bg-orange-300 transition-colors shadow-sm"
          >
            전송
          </button>
        </form>
      </footer>
    </div>
  );
}
