"use client";

import { Users } from "lucide-react";
import type { ChatRoom } from "@/entities/common/types";
import Avatar from "@/shared/components/common/Avatar";

type Props = {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
};

export function getRoomDisplayName(room: {
  type?: string;
  roomNickname?: string;
  name?: string;
  partnerNickname?: string;
}) {
  if (room.type === "GROUP") return room.name ?? "Chat room";
  if (room.type === "PERSONAL") return room.roomNickname || room.partnerNickname || "No user";
  return room.name ?? "Unknown";
}

export default function ChatRoomItem({ room, isActive, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 sm:p-4 ${
        isActive ? "bg-slate-50" : ""
      }`}
    >
      <div className="relative flex h-10 w-10 shrink-0">
        {room.type === "GROUP" ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-500 shadow-sm">
            <Users size={18} strokeWidth={2} />
          </div>
        ) : (
          <Avatar
            name={room.roomNickname || room.partnerNickname}
            customVisualClassName={room.partnerAvatarVisualClassName ?? undefined}
            className="h-10 w-10 rounded-2xl text-sm shadow-sm"
          />
        )}
        {(room.unreadCount ?? 0) > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {(room.unreadCount ?? 0) > 99 ? "99+" : room.unreadCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{getRoomDisplayName(room)}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {room.lastMessage || "Start a conversation"}
        </p>
      </div>
    </button>
  );
}
