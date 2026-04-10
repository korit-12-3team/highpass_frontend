"use client";

import React from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useApp } from "@/lib/AppContext";

export default function ChatPageClient() {
  const { currentUser, chatRooms, setChatRooms, activeChatRoomId, setActiveChatRoomId } = useApp();
  const [chatInput, setChatInput] = React.useState("");

  if (!currentUser) return null;

  const sendMessage = () => {
    if (!chatInput.trim() || !activeChatRoomId) return;
    const message = {
      id: Date.now(),
      senderId: currentUser.id,
      text: chatInput.trim(),
      createdAt: new Date().toTimeString().slice(0, 5),
    };

    setChatRooms((prev) =>
      prev.map((room) =>
        room.id === activeChatRoomId ? { ...room, messages: [...room.messages, message] } : room,
      ),
    );
    setChatInput("");
  };

  return (
    <div className="max-w-5xl mx-auto h-full animate-in fade-in duration-500 flex flex-col">
      <h2 className="text-2xl font-bold mb-6">채팅방</h2>
      {chatRooms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border flex-1 flex flex-col items-center justify-center text-center p-12">
          <MessageCircle size={52} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-bold text-lg">채팅방이 없습니다</p>
          <p className="text-slate-400 text-sm mt-1">
            스터디 모집 또는 게시글 작성자 프로필에서
            <br />
            1:1 채팅하기를 눌러 대화를 시작하세요
          </p>
        </div>
      ) : (
        <div className="flex gap-4" style={{ height: "calc(100vh - 11rem)" }}>
          <div className="w-72 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col shrink-0">
            <div className="p-4 border-b">
              <p className="font-bold text-slate-800">대화 목록</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveChatRoomId(room.id)}
                  className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                    activeChatRoomId === room.id ? "bg-hp-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-hp-100 rounded-full flex items-center justify-center text-hp-600 font-bold text-sm shrink-0">
                    {room.partnerNickname.substring(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{room.partnerNickname}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {room.messages.length > 0
                        ? room.messages[room.messages.length - 1].text
                        : "대화를 시작해보세요"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {activeChatRoomId ? (
            (() => {
              const room = chatRooms.find((item) => item.id === activeChatRoomId);
              if (!room) return null;

              return (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                  <div className="p-4 border-b flex items-center gap-3">
                    <div className="w-9 h-9 bg-hp-100 rounded-full flex items-center justify-center text-hp-600 font-bold text-sm">
                      {room.partnerNickname.substring(0, 1)}
                    </div>
                    <p className="font-bold text-slate-800">{room.partnerNickname}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                    {room.messages.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        첫 메시지를 보내보세요
                      </div>
                    ) : (
                      room.messages.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === currentUser.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                              message.senderId === currentUser.id
                                ? "bg-hp-600 text-white rounded-br-sm"
                                : "bg-slate-100 text-slate-800 rounded-bl-sm"
                            }`}
                          >
                            <p>{message.text}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                message.senderId === currentUser.id ? "text-hp-200" : "text-slate-400"
                              }`}
                            >
                              {message.createdAt}
                            </p>
                          </div>
                        </div>
                        ),
                      )
                    )}
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                      }}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-hp-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="px-4 py-2.5 bg-hp-600 text-white rounded-xl font-bold hover:bg-hp-700 transition-colors"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-slate-400 text-sm">
              채팅방을 선택해주세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}
