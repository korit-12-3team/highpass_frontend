"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { NotificationResponse } from "@/entities/common/types";
import {
  deleteNotification,
  deleteAllNotifications,
  markAsRead
} from "@/features/notifications/api/notifications";
import { useApp } from "@/shared/context/AppContext";
import ConfirmModal from "@/shared/components/common/ConfirmModal";

interface NotificationDropdownProps {
  userId: string;
  notifications: NotificationResponse[];
  onRefresh: () => void;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function NotificationDropdown({
  userId,
  notifications,
  onRefresh,
  onClose,
  triggerRef,
}: NotificationDropdownProps) {
  const router = useRouter();
  const { setActiveChatRoomId } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      // 클릭된 요소가 ConfirmModal 내부인지 확인 (포탈이나 고정 위치에 있을 수 있으므로)
      const target = e.target as HTMLElement;
      const isInsideModal = target.closest('[role="dialog"]') || target.closest('.fixed.inset-0.z-\\[1000\\]');
      
      if (confirmDeleteAllOpen || isInsideModal) return;
      
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !triggerRef?.current?.contains(e.target as Node)
      ) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, confirmDeleteAllOpen, triggerRef]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("알림 삭제에 실패했습니다.");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications(userId);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("알림 전체 삭제에 실패했습니다.");
    }
  };

  const handleRead = async (id: number, targetId: number, targetType: string) => {
    try {
      await markAsRead(id);
      onRefresh();
      
      // 알림 종류에 따른 이동 처리
      if (targetType === "FREE") {
        router.push(`/free/${targetId}`);
      } else if (targetType === "STUDY") {
        router.push(`/study/${targetId}`);
      } else if (targetType === "CHAT") {
        setActiveChatRoomId(String(targetId));
        router.push(`/chat`);
      }
      
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("알림 처리에 실패했습니다.");
    }
  };

  return (
    <>
      <div
        ref={modalRef}
        className="absolute left-full bottom-0 z-[100] ml-2 w-[380px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-left-4 duration-200 ease-out"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-hp-50 text-hp-600">
              <Bell size={22} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">알림</h3>
              <p className="text-xs text-slate-400">새로운 소식을 확인하세요</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[500px] min-h-[300px] overflow-y-auto bg-white px-2 py-2">
          {notifications.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-slate-400">
              <div className="mb-4 rounded-full bg-slate-50 p-6">
                <Bell size={48} className="opacity-20" />
              </div>
              <p className="font-medium">새로운 알림이 없습니다.</p>
              <p className="mt-1 text-sm opacity-60">나중에 다시 확인해 주세요!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((noti) => (
                <div
                  key={noti.id}
                  onClick={() => handleRead(noti.id, noti.targetId, noti.targetType)}
                  className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition-all hover:bg-hp-50/50 ${
                    !noti.isRead ? "bg-white" : "opacity-60"
                  }`}
                >
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!noti.isRead ? "bg-hp-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-transparent"}`} />
                  
                  <div className="flex-1 pr-6">
                    <p className={`text-[15px] leading-snug ${!noti.isRead ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                      {noti.message}
                    </p>
                    {noti.content && (
                      <p className="mt-1 text-[13px] text-slate-500 italic">
                        &apos;{noti.content}&apos;
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-slate-400">
                      <span>{new Date(noti.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, noti.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-300 transition-all hover:bg-slate-100 hover:text-red-500"
                    title="알림 삭제"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
            <span className="text-xs text-slate-400">
              총 {notifications.length}개의 알림
            </span>
            <button
              onClick={() => setConfirmDeleteAllOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={14} />
              전체 삭제
            </button>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmDeleteAllOpen}
        title="모든 알림을 삭제하시겠습니까?"
        description="삭제한 알림은 복구할 수 없습니다."
        confirmLabel="전체 삭제"
        variant="danger"
        onConfirm={() => { setConfirmDeleteAllOpen(false); void handleDeleteAll(); }}
        onClose={() => setConfirmDeleteAllOpen(false)}
      />
    </>
  );
}
