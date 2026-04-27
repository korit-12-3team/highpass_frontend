"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, MessageCircle, Users, Clock, LogOut } from "lucide-react";
import axios from "axios";
import { useApp } from "@/shared/context/AppContext";
import { sendMessage , leaveRoom, kickParticipant} from "@/services/realtime/stomp";
import { CHAT_API_BASE_URL } from "@/services/config/config";


export default function ChatPageClient() {
  const { currentUser, chatRooms, setChatRooms, activeChatRoomId, setActiveChatRoomId, chatClient } = useApp();
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

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
    if (!chatClient?.connected) return; 
    if (!chatInput.trim() || !activeChatRoomId || !currentUser) return;

    const messageData = {
      type: "TALK",
      roomId: Number(activeChatRoomId),
      senderId: Number(currentUser.id),
      senderName: currentUser.nickname || currentUser.name,
      message: chatInput,
      createdAt: new Date().toISOString(), 
    };

    setChatInput("");

    sendMessage(chatClient, messageData);
  };

  const handleLeaveRoom = async () => {
  if (!activeChatRoomId || !currentUser) return;
  if (!confirm("채팅방을 나가시겠습니까?")) return;

  try {
    await leaveRoom(Number(activeChatRoomId), Number(currentUser.id));
    setChatRooms((prev) => prev.filter((r) => String(r.id) !== String(activeChatRoomId)));
    setActiveChatRoomId(null);
  } catch {
    alert("나가기에 실패했습니다.");
  }
};

  const handleApprove = async (targetUserId: number) => {
    try {
        await axios.post(`${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/approve/${targetUserId}`);
        setChatRooms((prev) =>
            prev.map((room) =>
                String(room.id) === String(activeChatRoomId)
                    ? {
                        ...room,
                        participants: room.participants?.map((p) =>
                            p.userId === targetUserId ? { ...p, status: "JOINED" } : p
                        ),
                    }
                    : room,
            ),
        );
    } catch (e) { console.error(e); }
}

  const handleReject = async (targetUserId: number) => {
    if (!confirm("거절하시겠습니까?")) return;
    try {
        await axios.delete(`${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/reject/${targetUserId}`);
        setChatRooms((prev) =>
            prev.map((room) =>
                String(room.id) === String(activeChatRoomId)
                    ? {
                        ...room,
                        participants: room.participants?.filter((p) => p.userId !== targetUserId),
                    }
                    : room,
            ),
        );
    } catch (e) { console.error(e); }
};

const handleKickParticipant = async (targetUserId: number) => {
    if (!activeChatRoomId || !currentUser) return;
    if (!confirm("해당 유저를 강퇴하시겠습니까?")) return;

    try {
        await kickParticipant(Number(activeChatRoomId), Number(currentUser.id), targetUserId);
        setChatRooms((prev) =>
            prev.map((room) =>
                String(room.id) === String(activeChatRoomId)
                    ? {
                        ...room,
                        participants: room.participants?.filter((p) => p.userId !== targetUserId),
                    }
                    : room,
            ),
        );
    } catch {
        alert("강퇴에 실패했습니다.");
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
    } catch (e) {
      console.error("읽음 처리 실패:", e);
    }
  }
};

  const handleUpdateRoomName = async () => {
      if (!newRoomName.trim() || !activeChatRoomId || !currentUser) return;
      try {
          await axios.patch(`${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/nickname`, null, {
              params: { userId: currentUser.id, newNickname: newRoomName.trim() },
          });
          setChatRooms((prev) =>
              prev.map((room) =>
                  String(room.id) === String(activeChatRoomId)
                      ? { ...room, name: newRoomName.trim() }
                      : room,
              ),
          );
          setNewRoomName("");
          setIsEditingName(false);
      } catch (e) {
          console.error(e);
      }
  };
 return (
  <div className="mx-auto flex h-full max-w-6xl animate-in fade-in flex-col duration-500">
    <h2 className="mb-6 text-2xl font-bold">채팅방</h2>

    {chatRooms.length === 0 ? (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border bg-white p-12 text-center shadow-sm">
        <MessageCircle size={52} className="mb-4 text-slate-200" />
        <p className="text-lg font-bold text-slate-500">채팅방이 없습니다</p>
      </div>
    ) : (
      <div className="flex gap-4" style={{ height: "calc(100vh - 11rem)" }}>
        {/* 왼쪽 대화 목록 */}
        <div className="flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
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
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-white bg-hp-600 px-1 text-[9px] font-bold text-white shadow-sm">
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

        {/* 가운데 채팅창 */}
        {activeRoom ? (
          <>
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
              {/* 헤더 */}
              <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hp-100 text-sm font-bold text-hp-600">
                  {(activeRoom.roomNickname || activeRoom.name || activeRoom.partnerNickname)?.substring(0, 1) || "R"}
                </div>
                <p className="flex-1 font-bold text-slate-800">
                  {activeRoom.roomNickname || activeRoom.name || activeRoom.partnerNickname}
                </p>
              </div>

              {/* 본문 분기 */}
              {activeRoom.participants?.find((p) => Number(p.userId) === Number(currentUser?.id))?.status === "PENDING" ? (
                <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-hp-50 text-hp-500">
                    <Clock size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-700">승인 대기 중</p>
                  <p className="mt-2 text-sm text-slate-400">방장이 승인하면 대화를 시작할 수 있습니다.</p>
                </div>
              ) : (
                <>
                  <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
                    {(activeRoom.messages || []).map((message, idx) => {
                      const isMe = Number(message.senderId) === Number(currentUser?.id);
                      const isSystemMsg = message.type === "ENTER" || message.type === "QUIT" || message.type === "NOTICE";
                      if (message.type === "READ" || !message.message) return null;

                      if (isSystemMsg) return (
                        <div key={idx} className="my-2 flex justify-center">
                          <div className="rounded-full bg-slate-100 px-4 py-1 text-[11px] font-medium text-slate-500">
                            {message.message}
                          </div>
                        </div>
                      );

                      return (
                        <div key={`${message.id ?? idx}-${idx}`} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          {!isMe && (
                            <span className="mb-1 ml-1 text-[11px] font-semibold text-slate-500">
                              {message.senderName || "알 수 없음"}
                            </span>
                          )}
                          <div className={`flex w-full items-end gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            {isMe && (
                              <div className="mb-1 flex flex-col items-end gap-0.5">
                                {(message.unreadCount ?? 0) > 0 && (
                                  <span className="text-[10px] font-bold text-hp-400">{message.unreadCount}</span>
                                )}
                                {message.createdAt && (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(message.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "rounded-br-sm bg-hp-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800"}`}>
                              <p>{(message.message ?? (message as any).text) ?? "내용 없음"}</p>
                            </div>

                            {!isMe && (
                              <div className="mb-1 flex flex-col items-start gap-0.5">
                                {(message.unreadCount ?? 0) > 0 && (
                                  <span className="text-[10px] font-bold text-hp-400">{message.unreadCount}</span>
                                )}
                                {message.createdAt && (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(message.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                      className="rounded-xl bg-hp-600 px-4 py-2.5 font-bold text-white hover:bg-hp-700"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 오른쪽 사이드 패널 */}
            {activeRoom.type === "GROUP" && (
              <div className="flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <p className="font-bold text-slate-800">채팅방 정보</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {/* 방장 전용 - 승인 대기 */}
                  {activeRoom.ownerId === Number(currentUser?.id) && (
                    <>
                      <div className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400">
                        승인 대기
                        {activeRoom.participants?.some((p) => p.status === "PENDING") && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                      </div>
                      <div className="mb-3 space-y-1">
                        {activeRoom.participants?.filter((p) => p.status === "PENDING").length === 0 ? (
                          <p className="py-2 text-center text-xs text-slate-400">대기 중인 멤버가 없습니다.</p>
                        ) : (
                          activeRoom.participants?.filter((p) => p.status === "PENDING").map((p) => (
                            <div key={p.userId} className="rounded-xl bg-slate-50 p-2">
                              <p className="mb-1.5 text-xs font-medium text-slate-700">{p.nickname}</p>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => void handleApprove(p.userId)}
                                  className="flex-1 rounded-lg bg-hp-600 py-1 text-[10px] font-bold text-white"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => void handleReject(p.userId)}
                                  className="flex-1 rounded-lg border border-slate-200 py-1 text-[10px] font-bold text-slate-400"
                                >
                                  거절
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mb-3 border-t border-slate-100" />
                    </>
                  )}

                  {/* 참여 중인 멤버 */}
                  <div className="mb-2 text-[11px] font-bold uppercase text-slate-400">참여 중인 멤버</div>
                  <div className="mb-3 space-y-1">
                    {activeRoom.participants?.filter((p) => p.status === "JOINED").map((p) => (
                      <div key={p.userId} className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-hp-100 text-[10px] font-bold text-hp-600">
                            {p.nickname.substring(0, 1)}
                          </div>
                          <span className="text-xs font-medium text-slate-700">{p.nickname}</span>
                        </div>
                        {activeRoom.ownerId === Number(currentUser?.id) && p.userId !== Number(currentUser?.id) && (
                          <button
                            onClick={() => void handleKickParticipant(p.userId)}
                            className="rounded-lg border border-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-50"
                          >
                            강퇴
                          </button>
                        )}
                        {p.userId === Number(currentUser?.id) && activeRoom.ownerId === Number(currentUser?.id) && (
                          <span className="rounded-full bg-hp-100 px-1.5 py-0.5 text-[9px] font-bold text-hp-600">방장</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 방장 전용 - 채팅방 이름 변경 */}
                  {activeRoom.ownerId === Number(currentUser?.id) && (
                    <>
                      <div className="mb-3 border-t border-slate-100" />
                      <div className="mb-2 text-[11px] font-bold uppercase text-slate-400">이름 변경</div>
                      {isEditingName ? (
                        <div className="space-y-1">
                          <input
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && void handleUpdateRoomName()}
                            placeholder="새 이름 입력"
                            className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-hp-500"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => void handleUpdateRoomName()}
                              className="flex-1 rounded-lg bg-hp-600 py-1.5 text-[10px] font-bold text-white"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => { setIsEditingName(false); setNewRoomName(""); }}
                              className="flex-1 rounded-lg border py-1.5 text-[10px] text-slate-400"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setIsEditingName(true); setNewRoomName(""); }}
                          className="w-full rounded-lg border py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                        >
                          이름 변경하기
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* 나가기 버튼 */}
                <div className="border-t p-3">
                  <button
                    onClick={() => void handleLeaveRoom()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-400 hover:bg-red-50"
                  >
                    <LogOut size={14} />
                    나가기
                  </button>
                </div>
              </div>
            )}
          </>
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
