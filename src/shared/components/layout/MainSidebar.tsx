"use client";

import { startTransition } from "react";
import Image from "next/image";
import {
  Bell,
  Calendar as CalendarIcon,
  LogOut,
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
  onLogout,
}: MainSidebarProps) {
  const unreadChatCount = chatRooms.reduce((sum, room) => sum + (room.unreadCount ?? 0), 0);
  const unreadNotiCount = notifications?.filter((notification) => !notification.isRead).length ?? 0;

  return (
    <aside className="relative z-10 hidden w-20 flex-col border-r border-[#b8dff3] bg-[linear-gradient(180deg,#f8fcff_0%,#e8f6ff_48%,#d5ebf7_100%)] shadow-xl transition-all duration-300 ease-in-out md:flex xl:w-64 group">
      <div className="p-5 flex flex-col items-center xl:items-start">
        <h1 className="flex items-center gap-3 p-3 text-2xl font-black text-[#123b5c] overflow-hidden">
          <Image
            src="/images/Highpass_icon.png"
            alt="HighPass"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
            priority
          />
          <span className="hidden xl:inline">HIGHPASS</span>
        </h1>
        <div className="mt-3 w-full border-t border-[#b8dff3]/90" />
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => startTransition(() => onNavigate(item.href))}
              className={`flex w-full items-center justify-center xl:justify-start gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                active
                  ? "bg-[#123b5c] text-white shadow-sm shadow-[#0d3d62]/20"
                  : "text-slate-700 hover:bg-white/75 hover:text-[#123b5c]"
              }`}
              title={item.label}
            >
              <span className={`shrink-0 ${active ? "text-[#8ccaf7]" : "text-[#2e668d]"}`}>
                {item.icon}
              </span>
              <span className="min-w-0 text-sm font-black hidden xl:inline">{item.label}</span>
            </button>
          );
        })}

        <div className="pb-2 pt-5 flex justify-center xl:justify-start">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-[#5f8bab] hidden xl:block">
            Community
          </p>
          <div className="h-px w-8 bg-[#b8dff3]/50 xl:hidden" />
        </div>

        {communityItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => startTransition(() => onNavigate(item.href))}
              className={`flex w-full items-center justify-center xl:justify-start gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                active
                  ? "bg-[#123b5c] text-white shadow-sm shadow-[#0d3d62]/20"
                  : "text-slate-700 hover:bg-white/75 hover:text-[#123b5c]"
              }`}
              title={item.label}
            >
              <span className={`shrink-0 ${active ? "text-[#8ccaf7]" : "text-[#2e668d]"}`}>
                {item.icon}
              </span>
              <span className="min-w-0 text-sm font-black hidden xl:inline">{item.label}</span>
              {item.href === "/chat" && unreadChatCount > 0 ? (
                <span className="ml-auto rounded-full bg-[#1b7fba] px-1.5 py-0.5 text-[10px] font-bold text-white xl:block hidden">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              ) : null}
              {item.href === "/chat" && unreadChatCount > 0 ? (
                <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 xl:hidden" />
              ) : null}
            </button>
          );
        })}
      </nav>
 
      <div className="mx-4 mb-2 flex justify-center xl:justify-end">
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

      <div className="m-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center xl:justify-start rounded-2xl border border-[#dcecf7] bg-white/80 px-4 py-3 text-sm font-black text-[#123b5c] shadow-sm shadow-[#0d3d62]/8 transition hover:border-[#b7d8ec] hover:bg-white hover:text-[#0d3d62]"
          aria-label="로그아웃"
          title="로그아웃"
        >
          <span className="flex items-center justify-center gap-2.5 xl:pr-1">
            <LogOut size={15} className="shrink-0 text-[#2e668d]" />
            <span className="hidden xl:inline min-w-[68px] text-center">로그아웃</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
