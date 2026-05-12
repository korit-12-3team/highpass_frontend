"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/shared/context/AppContext";
import {
  getChatRoom,
  sendMessage,
  leaveRoom,
  kickParticipant,
  cancelJoinRequest,
} from "@/services/realtime/stomp";
import { fetchWithAuth } from "@/services/auth/auth";
import { CHAT_API_BASE_URL } from "@/services/config/config";
import type { ChatMessage, ChatRoomParticipant } from "@/entities/common/types";
import { ApiError, toUserMessage } from "@/shared/errors";

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
  const [cancelJoinRequestConfirmOpen, setCancelJoinRequestConfirmOpen] = useState(false);
  const [kickConfirmOpen, setKickConfirmOpen] = useState(false);
  const [kickTargetUserId, setKickTargetUserId] = useState<number | null>(null);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectTargetUserId, setRejectTargetUserId] = useState<number | null>(null);

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
      toast.error("채팅방 나가기에 실패했습니다.");
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!activeChatRoomId || !currentUser) return;

    try {
      await cancelJoinRequest(Number(activeChatRoomId));
      setChatRooms((prev) => prev.filter((room) => String(room.id) !== String(activeChatRoomId)));
      setActiveChatRoomId(null);
      setCancelJoinRequestConfirmOpen(false);
      toast.success("참여 요청을 취소했습니다.");
    } catch {
      setCancelJoinRequestConfirmOpen(false);
      toast.error("참여 요청 취소에 실패했습니다.");
    }
  };

  const handleApprove = async (targetUserId: number) => {
    try {
      const response = await fetchWithAuth(
        `${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/approve/${targetUserId}`,
        { method: "POST" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError((data as { message?: string } | null)?.message || "참여 요청 승인에 실패했습니다.");
      }

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
      toast.error(toUserMessage(error, "참여 승인에 실패했습니다."));
    }
  };

  const handleReject = (targetUserId: number) => {
    setRejectTargetUserId(targetUserId);
    setRejectConfirmOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetUserId) return;

    try {
      const response = await fetchWithAuth(
        `${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/reject/${rejectTargetUserId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError((data as { message?: string } | null)?.message || "참여 요청 거절에 실패했습니다.");
      }

      setChatRooms((prev) =>
        prev.map((room) =>
          String(room.id) === String(activeChatRoomId)
            ? {
                ...room,
                participants: room.participants?.filter((p) => p.userId !== rejectTargetUserId),
              }
            : room,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error(toUserMessage(error, "참여 거절에 실패했습니다."));
    } finally {
      setRejectConfirmOpen(false);
      setRejectTargetUserId(null);
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
      toast.error("참여자 강퇴에 실패했습니다.");
    }
  };

  const handleRoomClick = async (roomId: number | string) => {
    setActiveChatRoomId(String(roomId));

    try {
      const latestRoom = await getChatRoom(Number(roomId));

      const freshProfiles = new Map<number, ChatRoomParticipant>(
        (latestRoom.participants ?? []).map((p: ChatRoomParticipant) => [p.userId, p]),
      );

      setChatRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (String(room.id) === String(roomId)) {
            const existingById = new Map(
              (room.messages ?? []).filter((m) => m.id != null).map((m) => [String(m.id), m]),
            );
            return {
              ...room,
              ...latestRoom,
              messages: (latestRoom.messages ?? []).map((msg: ChatMessage) => ({
                ...msg,
                readBy: existingById.get(String(msg.id))?.readBy,
              })),
            };
          }

          if (freshProfiles.size === 0) return room;

          const partnerIdNum = room.partnerId ? Number(room.partnerId) : null;
          const hasPartnerUpdate = partnerIdNum !== null && freshProfiles.has(partnerIdNum);
          const hasParticipantUpdate = room.participants?.some((p) => freshProfiles.has(p.userId));

          if (!hasPartnerUpdate && !hasParticipantUpdate) return room;

          return {
            ...room,
            ...(hasPartnerUpdate && {
              partnerAvatarVisualClassName: freshProfiles.get(partnerIdNum!)?.avatarVisualClassName,
            }),
            participants: room.participants?.map((p) =>
              freshProfiles.has(p.userId) ? { ...p, ...freshProfiles.get(p.userId) } : p,
            ),
          };
        }),
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

  const handleTransferOwner = async (targetUserId: number) => {
    if (!activeChatRoomId || !currentUser) return;

    try {
      const response = await fetchWithAuth(
        `${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/owner/${targetUserId}`,
        { method: "PATCH" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError((data as { message?: string } | null)?.message || "방장 위임에 실패했습니다.");
      }

      setChatRooms((prev) =>
        prev.map((room) =>
          String(room.id) === String(activeChatRoomId)
            ? { ...room, ownerId: targetUserId }
            : room,
        ),
      );
      toast.success("방장이 위임되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(toUserMessage(error, "방장 위임에 실패했습니다."));
    }
  };

  const handleUpdateRoomName = async () => {
    if (!newRoomName.trim() || !activeChatRoomId || !currentUser) return;

    try {
      const response = await fetchWithAuth(
        `${CHAT_API_BASE_URL}/chat/rooms/${activeChatRoomId}/nickname?newNickname=${encodeURIComponent(newRoomName.trim())}`,
        { method: "PATCH" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError((data as { message?: string } | null)?.message || "채팅방 이름 변경에 실패했습니다.");
      }

      setChatRooms((prev) =>
        prev.map((room) =>
          String(room.id) === String(activeChatRoomId)
            ? { ...room, name: newRoomName.trim(), displayName: newRoomName.trim() }
            : room,
        ),
      );
      setNewRoomName("");
      setIsEditingName(false);
      toast.success("채팅방 이름이 변경되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(toUserMessage(error, "채팅방 이름 변경에 실패했습니다."));
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
    cancelJoinRequestConfirmOpen,
    setCancelJoinRequestConfirmOpen,
    kickConfirmOpen,
    setKickConfirmOpen,
    kickTargetUserId,
    setKickTargetUserId,
    handleSendMessage,
    handleLeaveRoom,
    handleCancelJoinRequest,
    handleApprove,
    handleReject,
    handleConfirmReject,
    rejectConfirmOpen,
    setRejectConfirmOpen,
    rejectTargetUserId,
    setRejectTargetUserId,
    handleKickParticipant,
    handleRoomClick,
    handleTransferOwner,
    handleUpdateRoomName,
  };
}
