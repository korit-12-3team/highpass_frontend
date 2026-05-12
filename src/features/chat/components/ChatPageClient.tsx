"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, MessageCircle, Clock, LogOut, Users, Menu, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useApp } from "@/shared/context/AppContext";
import { fetchWithAuth } from "@/services/auth/auth";
import { CHAT_API_BASE_URL } from "@/services/config/config";
import { getChatRoomReadState } from "@/services/realtime/stomp";
import ConfirmModal from "@/shared/components/common/ConfirmModal";
import Avatar from "@/shared/components/common/Avatar";
import ChatMessageBubble from "@/features/chat/components/ChatMessageBubble";
import { getRoomDisplayName, minuteKey } from "@/features/chat/utils/chatRoom";
import { useChatActions } from "@/features/chat/hooks/useChatActions";

export default function ChatPageClient() {
  const {
    currentUser,
    chatRooms,
    setChatRooms,
    activeChatRoomId,
    setProfileModal,
  } = useApp();

  const {
    chatInput,
    setChatInput,
    newRoomName,
    setNewRoomName,
    isEditingName,
    setIsEditingName,
    leaveConfirmOpen,
    setLeaveConfirmOpen,
    cancelJoinRequestConfirmOpen,
    setCancelJoinRequestConfirmOpen,
    kickConfirmOpen,
    setKickConfirmOpen,
    kickTargetUserId,
    setKickTargetUserId,
    rejectConfirmOpen,
    setRejectConfirmOpen,
    handleConfirmReject,
    handleSendMessage,
    handleLeaveRoom,
    handleCancelJoinRequest,
    handleApprove,
    handleReject,
    handleKickParticipant,
    handleRoomClick,
    handleTransferOwner,
    handleUpdateRoomName,
  } = useChatActions();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialReadHandledRef = useRef<string | null>(null);
  const [showRooms, setShowRooms] = useState(true);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  useEffect(() => {
    setShowRoomInfo(false);
  }, [activeChatRoomId]);

  useEffect(() => {
    if (!chatInput && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [chatInput]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: number } | null>(null);
  const [transferReminderOpen, setTransferReminderOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const closedUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (contextMenuRef.current?.contains(e.target as Node)) return;
      if (e.button === 2) {
        closedUserIdRef.current = contextMenu.userId;
        requestAnimationFrame(() => { closedUserIdRef.current = null; });
      }
      setContextMenu(null);
    };
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [contextMenu]);

  const activeRoom = useMemo(
    () => chatRooms.find((room) => String(room.id) === String(activeChatRoomId)) ?? null,
    [activeChatRoomId, chatRooms],
  );

  const sortedChatRooms = useMemo(() => {
    return [...chatRooms].sort((a, b) => {
      const aTime = Date.parse(a.sortPinnedAt ?? a.lastMessageAt ?? a.messages?.at(-1)?.createdAt ?? "");
      const bTime = Date.parse(b.sortPinnedAt ?? b.lastMessageAt ?? b.messages?.at(-1)?.createdAt ?? "");
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
  }, [chatRooms]);

  const activeParticipantStatus = activeRoom?.participants?.find(
    (participant) => Number(participant.userId) === Number(currentUser?.id),
  )?.status;
  const isPendingRoom = activeParticipantStatus === "PENDING";

  const openProfileModal = (userId?: number | string | null) => {
    if (userId == null) return;
    setProfileModal(String(userId));
  };


  useEffect(() => {
    if (activeRoom && (activeRoom.unreadCount ?? 0) > 0) {
      setChatRooms((prevRooms) =>
        prevRooms.map((room) =>
          String(room.id) === String(activeRoom.id) ? { ...room, unreadCount: 0 } : room,
        ),
      );
    }
  }, [activeRoom, setChatRooms]);

  useEffect(() => {
    if (!activeRoom || !activeChatRoomId || !currentUser?.id) return;
    if (isPendingRoom) return;
    if (initialReadHandledRef.current === String(activeChatRoomId)) return;
    initialReadHandledRef.current = String(activeChatRoomId);

    void (async () => {
      try {
        await fetchWithAuth(`${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/read`, {
          method: "POST",
        });
        const messageIds = (activeRoom.messages ?? [])
          .map((message) => Number(message.id))
          .filter(Number.isFinite);
        const readState = messageIds.length > 0
          ? await getChatRoomReadState(Number(activeChatRoomId), messageIds)
          : null;
        const readStateByMessageId = readState
          ? new Map(readState.messages.map((state) => [Number(state.messageId), state]))
          : null;

        setChatRooms((prevRooms) =>
          prevRooms.map((room) =>
            String(room.id) === String(activeChatRoomId)
              ? {
                  ...room,
                  unreadCount: 0,
                  messages: readStateByMessageId
                    ? room.messages.map((message) => {
                        const state = readStateByMessageId.get(Number(message.id));
                        return state
                          ? {
                              ...message,
                              unreadCount: state.unreadCount,
                              readBy: state.readers,
                            }
                          : message;
                      })
                    : room.messages,
                }
              : room,
          ),
        );
      } catch (error) {
        initialReadHandledRef.current = null;
        console.error("채팅방 초기 읽음 처리에 실패했습니다.", error);
      }
    })();
  }, [activeRoom, activeChatRoomId, currentUser?.id, isPendingRoom, setChatRooms]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeRoom?.messages]);

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl animate-in fade-in flex-col duration-500">
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[200] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-xs font-semibold text-hp-600 hover:bg-hp-50"
            onClick={() => {
              void handleTransferOwner(contextMenu.userId);
              setContextMenu(null);
            }}
          >
            방장 위임
          </button>
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50"
            onClick={() => {
              setKickTargetUserId(contextMenu.userId);
              setKickConfirmOpen(true);
              setContextMenu(null);
            }}
          >
            강퇴
          </button>
        </div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowRooms((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          {showRooms ? <ChevronsLeft size={15} /> : <ChevronsRight size={15} />}
          {showRooms ? "목록 닫기" : "목록 보기"}
        </button>
      </div>

      {chatRooms.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-md">
          <MessageCircle size={52} className="mb-4 text-slate-200" />
          <p className="text-lg font-bold text-slate-500">참여중인 채팅방이 없습니다</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto" style={{ height: "calc(100vh - 11rem)" }}>

          {/* 채팅방 목록 */}
          <div
            className="flex shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 ease-in-out"
            style={{
              width: showRooms ? "256px" : "0px",
              marginRight: showRooms ? "0px" : "-16px",
              opacity: showRooms ? 1 : 0,
              pointerEvents: showRooms ? "auto" : "none",
            }}
          >
            <div className="w-64 flex flex-col h-full">
                <div className="border-b border-slate-100 p-4 shrink-0">
                  <p className="font-bold text-slate-800">채팅방 목록</p>
                </div>
                <div className="flex-1 divide-y divide-slate-50 overflow-y-auto"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
                >
                {sortedChatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => void handleRoomClick(room.id)}
                    className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 sm:p-4 ${
                      String(activeChatRoomId) === String(room.id) ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="relative flex h-10 w-10 shrink-0">
                      {room.type === "GROUP" ? (
                      <div className="relative h-10 w-10 shrink-0">
                        {(() => {
                          const joined = (room.participants?.filter((p) => p.status === "JOINED") ?? []).slice(0, 4);
                          const count = joined.length;
                          if (count <= 1) {
                            return (
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-[11px] font-bold shadow-sm">
                              {(room.name ?? "?").substring(0, 3)}
                            </div>
                          );
                          }
                          // 3명 이하: 겹치기
                          if (count <= 3) {
                            return joined.map((p, i) => (
                              <div
                                key={p.userId}
                                className="absolute"
                                style={{
                                  top: i === 0 ? 0 : i === 1 ? "auto" : 0,
                                  bottom: i === 1 ? 0 : "auto",
                                  left: i === 0 ? 0 : i === 2 ? "auto" : "auto",
                                  right: i === 1 ? 0 : i === 2 ? 0 : "auto",
                                  zIndex: 3 - i,
                                }}
                              >
                                <Avatar
                                  name={p.nickname}
                                  customVisualClassName={p.avatarVisualClassName ?? undefined}
                                  className="h-6 w-6 rounded-full text-[9px] ring-2 ring-white"
                                />
                              </div>
                            ));
                          }

                          // 4명: 2x2 그리드
                          return joined.map((p, i) => (
                            <div
                              key={p.userId}
                              className="absolute"
                              style={{
                                top: i < 2 ? 0 : "auto",
                                bottom: i >= 2 ? 0 : "auto",
                                left: i % 2 === 0 ? 0 : "auto",
                                right: i % 2 === 1 ? 0 : "auto",
                                zIndex: 4 - i,
                              }}
                            >
                              <Avatar
                                name={p.nickname}
                                customVisualClassName={p.avatarVisualClassName ?? undefined}
                                className="h-5 w-5 rounded-full text-[8px] ring-2 ring-white"
                              />
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                        <Avatar
                          name={room.roomNickname || room.partnerNickname}
                          customVisualClassName={room.partnerAvatarVisualClassName ?? undefined}
                          className="h-10 w-10 rounded-2xl text-sm shadow-sm"
                        />
                      )}
                      {(room.unreadCount ?? 0) > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-white bg-hp-600 px-1 text-[9px] font-bold text-white shadow-sm">
                          {(room.unreadCount ?? 0) > 99 ? "99+" : room.unreadCount}
                        </span>
                      )}
                      {room.type === "GROUP" &&
                        room.ownerId === Number(currentUser?.id) &&
                        room.participants?.some((p) => p.status === "PENDING") && (
                          <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-slate-800">{getRoomDisplayName(room)}</p>
                        {room.type === "GROUP" && (
                          <span className="flex items-center gap-0.5 shrink-0 -mt-0.5 text-[10px] font-medium text-slate-400">
                            <Users size={10} />
                            {room.participants?.filter((p) => p.status === "JOINED").length ?? 0}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {room.lastMessage || "Start a conversation"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 채팅창 */}
          {activeRoom ? (
            <div className="flex min-w-[320px] flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-md">

              {/* 헤더 */}
              <div className="relative flex items-center gap-3 border-b border-slate-100 p-4">
                {activeRoom.type === "GROUP" ? (
                  <div className="relative h-8 w-8 shrink-0">
                    {(() => {
                      const joined = (activeRoom.participants?.filter((p) => p.status === "JOINED") ?? []).slice(0, 4);
                      const count = joined.length;
                      if (count <= 1) {
                        return (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold bg-amber-100 text-amber-600">
                            {(activeRoom.name ?? "?").substring(0, 2)}
                          </div>
                        );
                      }
                      if (count <= 3) {
                        return joined.map((p, i) => (
                          <div key={p.userId} className="absolute" style={{ top: i === 0 ? 0 : i === 1 ? "auto" : 0, bottom: i === 1 ? 0 : "auto", left: i === 0 ? 0 : i === 2 ? "auto" : "auto", right: i === 1 ? 0 : i === 2 ? 0 : "auto", zIndex: 3 - i }}>
                            <Avatar name={p.nickname} customVisualClassName={p.avatarVisualClassName ?? undefined} className="h-5 w-5 rounded-full text-[8px] ring-2 ring-white" />
                          </div>
                        ));
                      }
                      return joined.map((p, i) => (
                        <div key={p.userId} className="absolute" style={{ top: i < 2 ? 0 : "auto", bottom: i >= 2 ? 0 : "auto", left: i % 2 === 0 ? 0 : "auto", right: i % 2 === 1 ? 0 : "auto", zIndex: 4 - i }}>
                          <Avatar name={p.nickname} customVisualClassName={p.avatarVisualClassName ?? undefined} className="h-4 w-4 rounded-full text-[7px] ring-2 ring-white" />
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <Avatar
                    name={activeRoom.roomNickname || activeRoom.partnerNickname}
                    customVisualClassName={activeRoom.partnerAvatarVisualClassName ?? undefined}
                    className="h-8 w-8 rounded-lg text-xs"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-lg font-bold text-slate-800">{getRoomDisplayName(activeRoom)}</p>
                    {activeRoom.type === "GROUP" && (
                      <span className="flex items-center gap-0.5 shrink-0 text-[11px] font-medium text-slate-400">
                        <Users size={11} />
                        {activeRoom.participants?.filter((p) => p.status === "JOINED").length ?? 0}
                      </span>
                    )}
                  </div>
                </div>

                {!isPendingRoom && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRoomInfo((prev) => !prev)}
                      className="relative rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Menu size={18} />
                      {activeRoom.type === "GROUP" &&
                        activeRoom.ownerId === Number(currentUser?.id) &&
                        activeRoom.participants?.some((p) => p.status === "PENDING") && (
                          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                        )}
                    </button>

                    {showRoomInfo && (
                    <div className="absolute right-0 top-10 z-50 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                      <div className="max-h-[480px] overflow-y-auto p-3">
                        {activeRoom.type === "GROUP" && activeRoom.ownerId === Number(currentUser?.id) && (
                          <>
                            <div className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400">
                              참여 요청
                              {activeRoom.participants?.some((p) => p.status === "PENDING") && (
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              )}
                            </div>
                            <div className="mb-3 space-y-1">
                              {activeRoom.participants?.filter((p) => p.status === "PENDING").length === 0 ? (
                                <p className="py-2 text-center text-xs text-slate-400">
                                  현재 대기 중인 참여 요청이 없습니다.
                                </p>
                              ) : (
                                activeRoom.participants
                                  ?.filter((p) => p.status === "PENDING")
                                  .map((participant) => (
                                    <div key={participant.userId} className="rounded-xl bg-slate-50 p-2">
                                      <button
                                        type="button"
                                        onClick={() => openProfileModal(participant.userId)}
                                        className="mb-1.5 text-xs font-medium text-slate-700 transition hover:text-hp-600"
                                      >
                                        {participant.nickname}
                                      </button>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => void handleApprove(participant.userId)}
                                          className="flex-1 rounded-lg bg-hp-600 py-1 text-[10px] font-bold text-white"
                                        >
                                          승인
                                        </button>
                                        <button
                                          onClick={() => void handleReject(participant.userId)}
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

                        <div className="mb-2 text-[11px] font-bold uppercase text-slate-400">대화 상대</div>
                        <div className="mb-3 space-y-1">
                          {activeRoom.participants?.filter((p) => p.status === "JOINED").map((participant) => (
                            <div
                              key={participant.userId}
                              className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50"
                              onContextMenu={(e) => {
                                if (
                                  activeRoom.ownerId === Number(currentUser?.id) &&
                                  participant.userId !== Number(currentUser?.id)
                                ) {
                                  e.preventDefault();
                                  if (closedUserIdRef.current === participant.userId) return;
                                  setContextMenu({ x: e.clientX, y: e.clientY, userId: participant.userId });
                                }
                              }}
                              onClick={() => openProfileModal(participant.userId)}
                            >
                              <div className="flex items-center gap-2" >
                                <Avatar
                                  name={participant.nickname}
                                  customVisualClassName={participant.avatarVisualClassName ?? undefined}
                                  className="h-6 w-6 rounded-full text-[10px]"
                                />
                                <button
                                  type="button"
                                  
                                  className="text-xs font-medium text-slate-700 transition hover:text-hp-600"
                                >
                                  {participant.nickname}
                                </button>
                              </div>
                              {participant.userId === activeRoom.ownerId && (
                                <span className="rounded-full bg-hp-100 px-1.5 py-0.5 text-[9px] font-bold text-hp-600">
                                  방장
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {activeRoom.ownerId === Number(currentUser?.id) && (
                          <>
                            <div className="mb-3 border-t border-slate-100" />
                            <div className="mb-2 text-[11px] font-bold uppercase text-slate-400"></div>
                            {isEditingName ? (
                              <div className="space-y-1">
                                <input
                                  value={newRoomName}
                                  onChange={(e) => setNewRoomName(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && void handleUpdateRoomName()}
                                  placeholder={activeRoom.roomNickname}
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
                                onClick={() => { setIsEditingName(true); setNewRoomName(activeRoom.name ?? ""); }}
                                className="w-full rounded-lg border py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                              >
                                채팅방 이름 변경
                              </button>
                            )}
                          </>
                        )}

                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <button
                            onClick={() => {
                              if (activeRoom?.ownerId === Number(currentUser?.id) && (activeRoom?.participants?.filter((p) => p.status === "JOINED").length ?? 0) > 1) {
                                setTransferReminderOpen(true);
                                return;
                              }
                              setLeaveConfirmOpen(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-400 hover:bg-red-50"
                          >
                            <LogOut size={14} />
                            나가기
                          </button>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                )}
              </div>

              {isPendingRoom ? (
                <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-hp-50 text-hp-500">
                    <Clock size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-700">승인 대기중인 채팅방</p>
                  <p className="mt-2 text-sm text-slate-400">
                    방장의 승인 후 채팅에 참여할 수 있습니다. 승인 전까지는 메시지를 보낼 수 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCancelJoinRequestConfirmOpen(true)}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    요청 취소
                  </button>
                </div>
              ) : (
                <>
                  <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5">
                    {(activeRoom.messages || []).filter((m) => m.type !== "READ" && !!m.message).length === 0 ? (
                      <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                        아직 대화 내역이 없어요. 첫 메시지를 보내보세요 💬
                      </div>
                    ) : (
                      (activeRoom.messages || [])
                        .filter((m) => m.type !== "READ" && !!m.message)
                        .map((message, idx, visible) => {
                          const isMe = Number(message.senderId) === Number(currentUser?.id);
                          const prev = visible[idx - 1];
                          const next = visible[idx + 1];
                          const isSameSender =
                            !!prev &&
                            !["ENTER", "QUIT", "NOTICE"].includes(prev.type) &&
                            String(prev.senderId) === String(message.senderId) &&
                            minuteKey(prev.createdAt) === minuteKey(message.createdAt);
                          const isLastInGroup =
                            !next ||
                            ["ENTER", "QUIT", "NOTICE"].includes(next.type) ||
                            String(next.senderId) !== String(message.senderId) ||
                            minuteKey(next.createdAt) !== minuteKey(message.createdAt);

                          return (
                            <ChatMessageBubble
                              key={`${message.id ?? idx}-${idx}`}
                              message={message}
                              isMe={isMe}
                              isSameSender={isSameSender}
                              isLastInGroup={isLastInGroup}
                              roomId={activeRoom.id}
                              roomName={getRoomDisplayName(activeRoom)}
                              roomType={activeRoom.type}
                              currentUserId={Number(currentUser?.id)}
                              onProfileClick={openProfileModal}
                              onDeleted={(messageId) => {
                                setChatRooms((prev) =>
                                  prev.map((room) =>
                                    String(room.id) === String(activeChatRoomId)
                                      ? {
                                          ...room,
                                          messages: room.messages.map((m) => m.id === messageId ? { ...m, deleted: true } : m),
                                          lastMessage: room.messages.at(-1)?.id === messageId
                                            ? "삭제된 메시지입니다."
                                            : room.lastMessage,
                                        }
                                      : room,
                                  ),
                                );
                              }}
                            />
                          );
                        })
                    )}
                  </div>

                  <div className="flex items-end gap-2 border-t border-slate-100 p-3 sm:p-4">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                      className="w-full flex-1 resize-none overflow-hidden rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-hp-500"
                      style={{ maxHeight: "120px", overflowY: "auto" }}
                    />
                    <button
                      onClick={() => void handleSendMessage()}
                      className="flex shrink-0 items-center justify-center rounded-xl bg-hp-600 px-4 py-2.5 font-bold text-white hover:bg-hp-700 sm:px-5"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex min-h-[24rem] flex-1 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-md lg:min-h-0">
              왼쪽에서 채팅방을 선택해 대화를 시작하세요.
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={rejectConfirmOpen}
        title="참여 요청을 거절하시겠습니까?"
        description="거절하면 해당 사용자의 참여 요청이 삭제됩니다."
        confirmLabel="거절"
        variant="danger"
        onConfirm={() => void handleConfirmReject()}
        onClose={() => setRejectConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={kickConfirmOpen}
        title="참여자를 강퇴하시겠습니까?"
        description="강퇴된 참여자는 채팅방에서 즉시 제외됩니다."
        confirmLabel="강퇴"
        variant="danger"
        onConfirm={() => void handleKickParticipant()}
        onClose={() => { setKickConfirmOpen(false); setKickTargetUserId(null); }}
      />

      <ConfirmModal
        isOpen={transferReminderOpen}
        title="방장을 위임해주세요"
        description="참여자가 있는 경우 방장을 위임한 뒤 나가실 수 있습니다. 참여자를 우클릭해 방장을 위임해주세요."
        confirmLabel="확인"
        onConfirm={() => setTransferReminderOpen(false)}
        onClose={() => setTransferReminderOpen(false)}
      />

      <ConfirmModal
        isOpen={cancelJoinRequestConfirmOpen}
        title="참여 요청을 취소하시겠습니까?"
        description="취소하면 채팅방 목록에서 사라지며 다시 참여하려면 요청을 다시 보내야 합니다."
        confirmLabel="요청 취소"
        variant="danger"
        onConfirm={() => void handleCancelJoinRequest()}
        onClose={() => setCancelJoinRequestConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={leaveConfirmOpen}
        title="채팅방을 나가시겠습니까?"
        description="나가면 대화 내용이 삭제되며 다시 입장하려면 초대가 필요할 수 있습니다."
        confirmLabel="나가기"
        variant="danger"
        onConfirm={() => void handleLeaveRoom()}
        onClose={() => setLeaveConfirmOpen(false)}
      />
    </div>
  );
}
