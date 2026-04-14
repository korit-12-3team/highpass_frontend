"use client";

import {
  Calendar as CalendarIcon,
  MessageCircle,
  MessageSquare,
  Search,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { ChatRoom, UserProfile } from "@/lib/AppContext";

interface MainSidebarProps {
  pathname: string;
  currentUser: UserProfile;
  chatRooms: ChatRoom[];
  onNavigate: (href: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

const navItems = [
  { label: "내 캘린더", icon: <CalendarIcon size={20} />, href: "/calendar" },
  { label: "자격증 정보", icon: <Search size={20} />, href: "/search" },
  { label: "마이페이지", icon: <UserRound size={20} />, href: "/mypage" },
];

const communityItems = [
  { label: "스터디 모집", icon: <Users size={20} />, href: "/study" },
  { label: "자유 게시판", icon: <MessageSquare size={20} />, href: "/free" },
  { label: "채팅방", icon: <MessageCircle size={20} />, href: "/chat" },
];

export default function MainSidebar({
  pathname,
  currentUser,
  chatRooms,
  onNavigate,
  onOpenProfile,
  onLogout,
}: MainSidebarProps) {
  return (
    <aside className="relative z-10 hidden w-64 flex-col bg-hp-900 shadow-xl md:flex">
      <div className="border-b border-hp-800 p-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-white">
          <Zap size={28} className="fill-hp-600 text-hp-600" /> HIGHPASS
        </h1>
      </div>

      <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto px-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 font-bold transition-colors ${
                active
                  ? "border-l-4 border-hp-300 bg-hp-700 text-white"
                  : "border-l-4 border-transparent text-hp-200 hover:bg-hp-800"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}

        <div className="pb-2 pt-5">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-hp-400">Community</p>
        </div>

        {communityItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 font-bold transition-colors ${
                active
                  ? "border-l-4 border-hp-300 bg-hp-700 text-white"
                  : "border-l-4 border-transparent text-hp-200 hover:bg-hp-800"
              }`}
            >
              {item.icon}
              {item.label}
              {item.href === "/chat" && chatRooms.length > 0 && (
                <span className="ml-auto rounded-full bg-hp-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {chatRooms.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-hp-700 bg-hp-900/80 p-4">
        <div
          className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-hp-800"
          onClick={onOpenProfile}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hp-600 font-bold text-white shadow-sm ring-2 ring-white">
            {currentUser.nickname.substring(0, 1)}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-white">{currentUser.nickname}</p>
            <p className="truncate text-[10px] text-hp-300">{currentUser.location}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2.5 text-hp-300 hover:text-white" aria-label="로그아웃">
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
