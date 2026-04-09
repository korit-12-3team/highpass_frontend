"use client";

import React from "react";
import {
  Calendar as CalendarIcon,
  MessageCircle,
  MessageSquare,
  Search,
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
    <aside className="w-64 bg-hp-900 shadow-xl flex flex-col hidden md:flex z-10 relative">
      <div className="p-6 border-b border-hp-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Zap size={28} className="text-hp-600 fill-hp-600" /> HighPass
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${
                active
                  ? "bg-hp-700 text-white border-l-4 border-hp-300"
                  : "text-hp-200 hover:bg-hp-800 border-l-4 border-transparent"
              }`}
            >
              {item.icon} {item.label}
            </button>
          );
        })}

        <div className="pt-5 pb-2">
          <p className="px-4 text-[10px] font-black text-hp-400 uppercase tracking-widest">Community</p>
        </div>

        {communityItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${
                active
                  ? "bg-hp-700 text-white border-l-4 border-hp-300"
                  : "text-hp-200 hover:bg-hp-800 border-l-4 border-transparent"
              }`}
            >
              {item.icon} {item.label}
              {item.href === "/chat" && chatRooms.length > 0 && (
                <span className="ml-auto text-[10px] bg-hp-600 text-white rounded-full px-1.5 py-0.5 font-bold">
                  {chatRooms.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-hp-700 bg-hp-900/80 flex items-center justify-between">
        <div
          className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-hp-800 rounded-lg flex-1"
          onClick={onOpenProfile}
        >
          <div className="w-9 h-9 bg-hp-600 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white">
            {currentUser.nickname.substring(0, 1)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{currentUser.nickname}</p>
            <p className="text-[10px] text-hp-300 truncate">{currentUser.location}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2.5 text-hp-300 hover:text-white" aria-label="로그아웃">
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
