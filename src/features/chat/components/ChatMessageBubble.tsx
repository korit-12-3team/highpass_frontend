"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, LogOut } from "lucide-react";
import type { ChatMessage } from "@/entities/common/types";
import ReportDialog from "@/features/reports/components/ReportDialog";
import { deleteChatMessage } from "@/services/realtime/stomp";
import Avatar from "@/shared/components/common/Avatar";
import { toast } from "sonner";

type Props = {
  message: ChatMessage;
  isMe: boolean;
  isSameSender: boolean;
  isLastInGroup: boolean;
  roomId: string | number;
  roomName?: string;
  roomType?: string;
  onProfileClick: (userId: string | number) => void;
  onDeleted: (messageId: number) => void;
  currentUserId?: number;
};

function formatMessageTime(value?: string) {
  if (!value) return "";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const hasExplicitZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
  const parsed = hasExplicitZone
    ? new Date(normalized)
    : (() => {
        const [datePart, timePart = "00:00:00"] = normalized.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);
        return new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
      })();
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(parsed);
}

export default function ChatMessageBubble({
  message,
  isMe,
  isSameSender,
  isLastInGroup,
  roomId,
  roomName,
  roomType,
  onProfileClick,
  onDeleted,
  currentUserId, 
}: Props) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closedRef = useRef(false);
  const shouldShowUnreadCount = isMe || roomType !== "PERSONAL";

  useEffect(() => {
    if (!contextMenu) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (e.button === 2) {
        closedRef.current = true;
        requestAnimationFrame(() => { closedRef.current = false; });
      }
      setContextMenu(null);
    };
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [contextMenu]);


  const isSystemMsg = message.type === "ENTER" || message.type === "QUIT" || message.type === "NOTICE";

  if (isSystemMsg) {
    return (
      <div className="my-2 flex justify-center">
        <div className="rounded-full bg-slate-100 px-4 py-1 text-[11px] font-medium text-slate-500">
          {message.message}
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!message.id) return;
    setContextMenu(null);
    try {
      await deleteChatMessage(message.id);
      onDeleted(message.id);
    } catch {
      alert("메시지 삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isSameSender ? "mt-0.5" : "mt-3"}`}>
        {!isMe && !isSameSender && (
          <button
            type="button"
            onClick={() => onProfileClick(message.senderId)}
            className="mb-1 ml-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-hp-600"
          >
            <Avatar
              name={message.senderName}
              customVisualClassName={
                Number(message.senderId) === currentUserId
                  ? undefined
                  : message.senderAvatarVisualClassName ?? undefined
              }
              className="h-5 w-5 rounded-full text-[10px]"
            />
            <span>{message.senderName || "Unknown"}</span>
          </button>
        )}
        <div className={`flex w-full items-end gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
          {isMe && ((message.unreadCount ?? 0) > 0 || isLastInGroup) && (
            <div className="mb-1 flex flex-col items-end gap-0.5">
              {(message.unreadCount ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-hp-400">{message.unreadCount}</span>
              )}
              {isLastInGroup && message.createdAt && (
                <span className="text-[10px] text-slate-400">{formatMessageTime(message.createdAt)}</span>
              )}
            </div>
          )}
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[78%] xl:max-w-[70%] ${
              isMe ? "rounded-br-sm bg-hp-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800"
            }`}
            onContextMenu={(e) => {
              e.preventDefault();
              if (closedRef.current) return;
              setContextMenu({ x: e.clientX, y: e.clientY });
            }}
          >
            {message.deleted
              ? <p className="italic opacity-50">삭제된 메시지입니다.</p>
              : <p className="whitespace-pre-wrap">{(message.message ?? (message as any).text) ?? "No content"}</p>
            }
          </div>
          {!isMe && (((message.unreadCount ?? 0) > 0 && shouldShowUnreadCount) || isLastInGroup) && (
            <div className="mb-1 flex flex-col items-start gap-0.5">
              {shouldShowUnreadCount && (message.unreadCount ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-hp-400">{message.unreadCount}</span>
              )}
              {isLastInGroup && message.createdAt && (
                <span className="text-[10px] text-slate-400">{formatMessageTime(message.createdAt)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
          <div
            ref={menuRef}
            className="fixed z-[100] min-w-[120px] overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {isMe ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                onClick={() => void handleDelete()}
              >
                <LogOut size={14} />
                삭제
              </button>
            ) : (
              <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                  onClick={() => {
                    if (message.deleted) {
                      toast.error("이미 삭제된 메시지는 신고할 수 없습니다.");
                      setContextMenu(null);
                      return;
                    }
                    setReportOpen(true);
                    setContextMenu(null);
                  }}
                >
                <AlertTriangle size={14} />
                신고
              </button>
            )}
          </div>
      )}

      {reportOpen && (
        <ReportDialog
          isOpen={reportOpen}
          targetType="chat"
          targetId={String(roomId)}
          title="메시지 신고"
          subtitle={roomName
            ? `${message.senderName ?? "알 수 없음"}님의 메시지를 신고합니다. (채팅방: ${roomName})`
            : `${message.senderName ?? "알 수 없음"}님의 메시지를 신고합니다.`}
          quotedMessage={!message.deleted ? (message.message ?? (message as any).text ?? undefined) : undefined}
          onClose={() => setReportOpen(false)}
        />
      )}
    </>
  );
}
