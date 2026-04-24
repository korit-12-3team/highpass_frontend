"use client";

import Image from "next/image";
import {
  Bell,
  Calendar as CalendarIcon,
  MessageCircle,
  MessageSquare,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { ChatRoom, NotificationResponse, UserProfile } from "@/entities/common/types";
import NotificationDropdown from "@/features/notifications/components/NotificationDropdown";

interface MainSidebarProps {
  pathname: string;
  currentUser: UserProfile;
  chatRooms: ChatRoom[];
  notifications: NotificationResponse[];
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  onRefreshNotifications: () => void;
  onNavigate: (href: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

const navItems = [
  { label: "캘린더", icon: <CalendarIcon size={20} />, href: "/calendar" },
  { label: "자격증 정보", icon: <Search size={20} />, href: "/search" },
  { label: "마이페이지", icon: <UserRound size={20} />, href: "/mypage" },
];

const communityItems = [
  { label: "스터디 모집", icon: <Users size={20} />, href: "/study" },
  { label: "자유게시판", icon: <MessageSquare size={20} />, href: "/free" },
  { label: "채팅방", icon: <MessageCircle size={20} />, href: "/chat" },
];

export default function MainSidebar({
  pathname,
  currentUser,
  chatRooms,
  notifications,
  showNotifications,
  setShowNotifications,
  onRefreshNotifications,
  onNavigate,
  onOpenProfile,
  onLogout,
}: MainSidebarProps) {
  const unreadChatCount = chatRooms.reduce((sum, room) => sum + (room.unreadCount ?? 0), 0);
  const unreadNotiCount = notifications.filter((n) => !n.isRead).length;

  return (
    <aside className="relative z-10 hidden w-64 flex-col border-r border-[#b8dff3] bg-[linear-gradient(180deg,#f8fcff_0%,#e8f6ff_48%,#d5ebf7_100%)] shadow-xl md:flex">
      <div className="p-5">
        <h1 className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-3 text-2xl font-black text-[#123b5c] shadow-sm shadow-[#0d3d62]/10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] ring-1 ring-[#b9dff5]">
            <Image src="/images/Highpass_icon.png" alt="HighPass" width={40} height={40} className="h-10 w-10 object-contain" priority />
          </span>
          HIGHPASS
        </h1>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                active
                  ? "bg-[#123b5c] text-white shadow-sm shadow-[#0d3d62]/20"
                  : "text-slate-700 hover:bg-white/75 hover:text-[#123b5c]"
              }`}
            >
              <span className={active ? "text-[#8ccaf7]" : "text-[#2e668d]"}>{item.icon}</span>
              <span className="min-w-0 text-sm font-black">{item.label}</span>
            </button>
          );
        })}

        <div className="pb-2 pt-5">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-[#5f8bab]">Community</p>
        </div>

        {communityItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                active
                  ? "bg-[#123b5c] text-white shadow-sm shadow-[#0d3d62]/20"
                  : "text-slate-700 hover:bg-white/75 hover:text-[#123b5c]"
              }`}
            >
              <span className={active ? "text-[#8ccaf7]" : "text-[#2e668d]"}>{item.icon}</span>
              <span className="min-w-0 text-sm font-black">{item.label}</span>
              {item.href === "/chat" && unreadChatCount > 0 && (
                <span className="ml-auto rounded-full bg-[#1b7fba] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 알림 버튼 추가 */}
      <div className="mx-4 mb-2 flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative rounded-xl p-2.5 transition-all duration-200 border border-white shadow-sm ${
              showNotifications 
                ? "bg-[#123b5c] text-white shadow-[#0d3d62]/20" 
                : "bg-white/50 text-[#2e668d] hover:bg-white/80 hover:text-[#123b5c] hover:shadow-md"
            }`}
            aria-label="알림"
          >
            <Bell size={20} className={showNotifications ? "animate-pulse" : ""} />
            {unreadNotiCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                {unreadNotiCount > 99 ? "99+" : unreadNotiCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              userId={currentUser.id}
              notifications={notifications}
              onRefresh={onRefreshNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>
      </div>

      <div className="m-4 flex items-center justify-between rounded-2xl border border-white bg-white/75 p-3 shadow-sm shadow-[#0d3d62]/10">
        <div
          className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#eef8ff]"
          onClick={onOpenProfile}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#123b5c] font-bold text-white shadow-sm ring-2 ring-white">
            {currentUser.nickname.substring(0, 1)}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-[#123b5c]">{currentUser.nickname}</p>
            <p className="truncate text-[10px] text-slate-500">{currentUser.location}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2.5 text-[#2e668d] hover:text-[#123b5c]" aria-label="로그아웃">
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
