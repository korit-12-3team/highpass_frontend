"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import axios from "axios";
import { useApp } from "@/shared/context/AppContext";
import { sendMessage } from "@/services/realtime/stomp";
import { CHAT_API_BASE_URL, STOMP_ENDPOINT_URL } from "@/services/config/config";

export default function ChatPageClient() {
  const { currentUser, chatRooms, setChatRooms, activeChatRoomId, setActiveChatRoomId } = useApp();
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRoom = useMemo(
    () => chatRooms.find((room) => String(room.id) === String(activeChatRoomId)) ?? null,
    [activeChatRoomId, chatRooms],
  );

  useEffect(() => {
    if (activeRoom && (activeRoom.unreadCount ?? 0) > 0) {
      setChatRooms((prevRooms) =>
        prevRooms.map((room) =>
          String(room.id) === String(activeRoom.id)
            ? {
                ...room,
                unreadCount: 0,
              }
            : room,
        ),
      );
    }
  }, [activeRoom, setChatRooms]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeRoom?.messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChatRoomId || !currentUser) return;

    const messageData = {
      type: "TALK",
      roomId: Number(activeChatRoomId),
      senderId: Number(currentUser.id),
      senderName: currentUser.nickname || currentUser.name,
      message: chatInput,
    };

    setChatInput("");

    try {
      const SockJS = (await import("sockjs-client")).default;
      const { Client } = await import("@stomp/stompjs");
      const tempClient = new Client({
        webSocketFactory: () => new SockJS(STOMP_ENDPOINT_URL),
      });
      tempClient.onConnect = () => {
        sendMessage(tempClient, messageData);
        void tempClient.deactivate();
      };
      tempClient.activate();
    } catch {
      // Keep optimistic UI even if realtime send bootstrap fails.
    }
  };

  const handleRoomClick = async (roomId: number | string) => {
    setChatRooms((prevRooms) =>
      prevRooms.map((room) =>
        String(room.id) === String(roomId)
          ? { ...room, unreadCount: 0 }
          : room,
      ),
    );
    setActiveChatRoomId(String(roomId));

    if (currentUser?.id) {
      try {
        await axios.post(`${CHAT_API_BASE_URL}/chat/rooms/${roomId}/read`, null, {
          params: { userId: currentUser.id },
        });
      } catch {
        // Ignore read-sync failures in UI.
      }
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-5xl animate-in fade-in flex-col duration-500">
      <h2 className="mb-6 text-2xl font-bold">채팅방</h2>

      {chatRooms.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border bg-white p-12 text-center shadow-sm">
          <MessageCircle size={52} className="mb-4 text-slate-200" />
          <p className="text-lg font-bold text-slate-500">채팅방이 없습니다</p>
        </div>
      ) : (
        <div className="flex gap-4" style={{ height: "calc(100vh - 11rem)" }}>
          <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <p className="font-bold text-slate-800">대화 목록</p>
            </div>
            <div className="flex-1 divide-y divide-slate-50 overflow-y-auto">
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => void handleRoomClick(room.id)}
                  className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                    String(activeChatRoomId) === String(room.id) ? "bg-slate-50" : ""
                  }`}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hp-100 text-sm font-bold text-hp-600">
                    {room.name?.substring(0, 1) || room.partnerNickname?.substring(0, 1) || "R"}
                    {(room.unreadCount ?? 0) > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full border-2 border-white bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {(room.unreadCount ?? 0) > 99 ? "99+" : room.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{room.roomNickname || room.name || room.partnerNickname}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{room.lastMessage || "대화를 시작해보세요"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {activeRoom ? (
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hp-100 text-sm font-bold text-hp-600">
                  {(activeRoom.roomNickname || activeRoom.name || activeRoom.partnerNickname)?.substring(0, 1) || "R"}
                </div>
                <p className="font-bold text-slate-800">{activeRoom.roomNickname || activeRoom.name || activeRoom.partnerNickname}</p>
              </div>

              <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
                {(activeRoom.messages || []).map((message: any, idx: number) => (
                  <div
                    key={`${message.id ?? idx}-${idx}`}
                    className={`flex ${Number(message.senderId) === Number(currentUser?.id) ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        Number(message.senderId) === Number(currentUser?.id)
                          ? "rounded-br-sm bg-hp-600 text-white"
                          : "rounded-bl-sm bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p>{message.message ?? message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 border-t p-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-hp-500"
                />
                <button
                  onClick={() => void handleSendMessage()}
                  className="rounded-xl bg-hp-600 px-4 py-2.5 font-bold text-white transition-colors hover:bg-hp-700"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border bg-white text-sm text-slate-400 shadow-sm">
              채팅방을 선택해주세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}
