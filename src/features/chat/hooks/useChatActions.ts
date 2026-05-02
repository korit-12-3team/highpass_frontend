"use client";

import { useState } from "react";
import { useApp } from "@/shared/context/AppContext";
import { getChatRoom, sendMessage, leaveRoom, kickParticipant } from "@/services/realtime/stomp";
import { fetchWithAuth } from "@/services/auth/auth";
import { CHAT_API_BASE_URL } from "@/services/config/config";

export function useChatActions() {
  const {
    currentUser,
    setChatRooms,
    activeChatRoomId,
    setActiveChatRoomId,
    chatClient,
  } = useApp();

  const [chatInput, setChatInput] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [kickConfirmOpen, setKickConfirmOpen] = useState(false);
  const [kickTargetUserId, setKickTargetUserId] = useState<number | null>(null);

  const handleSendMessage = async () => {
    if (!chatClient?.connected) return;
    if (!chatInput.trim() || !activeChatRoomId || !currentUser) return;

    const messageData = {
      type: "TALK",
      roomId: Number(activeChatRoomId),
      senderId: Number(currentUser.id),
      senderName: currentUser.nickname || currentUser.name,
      message: chatInput,
    };

    setChatInput("");
    sendMessage(chatClient, messageData);
  };

  const handleLeaveRoom = async () => {
    if (!activeChatRoomId || !currentUser) return;

    try {
      await leaveRoom(Number(activeChatRoomId));
      setChatRooms((prev) => prev.filter((room) => String(room.id) !== String(activeChatRoomId)));
      setActiveChatRoomId(null);
      setLeaveConfirmOpen(false);
    } catch {
      setLeaveConfirmOpen(false);
      alert("채팅방 나가기에 실패했습니다.");
    }
  };

  const handleApprove = async (targetUserId: number) => {
    try {
      const response = await fetchWithAuth(
        `${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/approve/${targetUserId}`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("참여 요청 승인에 실패했습니다.");

      setChatRooms((prev) =>
        prev.map((room) =>
          String(room.id) === String(activeChatRoomId)
            ? {
                ...room,
                participants: room.participants?.map((p) =>
                  p.userId === targetUserId ? { ...p, status: "JOINED" } : p,
                ),
              }
            : room,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (targetUserId: number) => {
    if (!confirm("정말 이 참여 요청을 거절하시겠습니까?")) return;

    try {
      const response = await fetchWithAuth(
        `${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/reject/${targetUserId}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("참여 요청 거절에 실패했습니다.");

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
    } catch (error) {
      console.error(error);
    }
  };

  const handleKickParticipant = async () => {
    if (!activeChatRoomId || !currentUser || kickTargetUserId === null) return;

    try {
      await kickParticipant(Number(activeChatRoomId), kickTargetUserId);
      setKickConfirmOpen(false);
      setKickTargetUserId(null);
      setChatRooms((prev) =>
        prev.map((room) =>
          String(room.id) === String(activeChatRoomId)
            ? {
                ...room,
                participants: room.participants?.filter((p) => p.userId !== kickTargetUserId),
              }
            : room,
        ),
      );
    } catch {
      setKickConfirmOpen(false);
      setKickTargetUserId(null);
      alert("참여자 강퇴에 실패했습니다.");
    }
  };

  const handleRoomClick = async (roomId: number | string) => {
    setActiveChatRoomId(String(roomId));

    try {
      const latestRoom = await getChatRoom(Number(roomId));
      setChatRooms((prevRooms) =>
        prevRooms.map((room) =>
          String(room.id) === String(roomId) ? { ...room, ...latestRoom } : room,
        ),
      );
    } catch (error) {
      console.error("채팅방 정보를 불러오지 못했습니다.", error);
    }

    if (currentUser?.id) {
      try {
        await fetchWithAuth(`${CHAT_API_BASE_URL}/chat/rooms/${roomId}/read`, { method: "POST" });
        setChatRooms((prevRooms) =>
          prevRooms.map((room) =>
            String(room.id) === String(roomId) ? { ...room, unreadCount: 0 } : room,
          ),
        );
      } catch (error) {
        console.error("채팅방 읽음 처리에 실패했습니다.", error);
      }
    }
  };

  const handleUpdateRoomName = async () => {
    if (!newRoomName.trim() || !activeChatRoomId || !currentUser) return;

    try {
      const response = await fetchWithAuth(
        `${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/nickname?newNickname=${encodeURIComponent(newRoomName.trim())}`,
        { method: "PATCH" },
      );
      if (!response.ok) throw new Error("채팅방 이름 변경에 실패했습니다.");

      setChatRooms((prev) =>
        prev.map((room) =>
          String(room.id) === String(activeChatRoomId)
            ? { ...room, name: newRoomName.trim(), displayName: newRoomName.trim() }
            : room,
        ),
      );
      setNewRoomName("");
      setIsEditingName(false);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    chatInput,
    setChatInput,
    newRoomName,
    setNewRoomName,
    isEditingName,
    setIsEditingName,
    leaveConfirmOpen,
    setLeaveConfirmOpen,
    kickConfirmOpen,
    setKickConfirmOpen,
    kickTargetUserId,
    setKickTargetUserId,
    handleSendMessage,
    handleLeaveRoom,
    handleApprove,
    handleReject,
    handleKickParticipant,
    handleRoomClick,
    handleUpdateRoomName,
  };
}
