"use client";

import React from "react";
import { Bookmark, FileText, Heart, MessageSquare, Settings, UserRound } from "lucide-react";
import { useApp } from "@/lib/AppContext";

type MyPageTab = "profile" | "posts" | "comments" | "likes";

const TAB_ITEMS: { id: MyPageTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "회원정보 수정", icon: <Settings size={16} /> },
  { id: "posts", label: "내가 쓴 게시물", icon: <FileText size={16} /> },
  { id: "comments", label: "내가 쓴 댓글", icon: <MessageSquare size={16} /> },
  { id: "likes", label: "좋아요한 게시물", icon: <Heart size={16} /> },
];

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-hp-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function PlaceholderList({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-hp-200 bg-hp-50/60 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-hp-600 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-base font-bold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function MyPageClient() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = React.useState<MyPageTab>("profile");

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in space-y-6 duration-500">
      <section className="overflow-hidden rounded-[32px] border border-hp-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-8 py-10 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl font-black">
                {currentUser.nickname.substring(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">MY PAGE</p>
                <h2 className="mt-1 text-3xl font-black">{currentUser.nickname}</h2>
                <p className="mt-2 text-sm text-white/75">
                  회원 정보와 내 활동 내역을 한 곳에서 관리할 수 있는 개인 페이지입니다.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-[320px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-bold text-white/60">현재 위치</p>
                <p className="mt-2 text-sm font-bold">{currentUser.location || "미설정"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-bold text-white/60">관심 연령대</p>
                <p className="mt-2 text-sm font-bold">{currentUser.ageGroup || "미설정"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {TAB_ITEMS.map((item) => {
          const active = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                active
                  ? "bg-hp-600 text-white"
                  : "border border-hp-200 bg-white text-hp-700 hover:bg-hp-50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" && (
        <SectionCard
          title="회원정보 수정"
          description="API 연결 전 단계입니다. 화면 구조와 입력 폼만 먼저 준비했습니다."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">닉네임</label>
              <input
                value={currentUser.nickname}
                readOnly
                className="w-full rounded-2xl border border-hp-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">이메일</label>
              <input
                value={currentUser.email ?? ""}
                readOnly
                className="w-full rounded-2xl border border-hp-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">연령대</label>
              <input
                value={currentUser.ageGroup}
                readOnly
                className="w-full rounded-2xl border border-hp-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">성별</label>
              <input
                value={currentUser.gender}
                readOnly
                className="w-full rounded-2xl border border-hp-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">지역</label>
              <input
                value={currentUser.location}
                readOnly
                className="w-full rounded-2xl border border-hp-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled
              className="rounded-2xl bg-hp-600 px-5 py-3 text-sm font-bold text-white opacity-60"
            >
              저장 기능 준비 중
            </button>
          </div>
        </SectionCard>
      )}

      {activeTab === "posts" && (
        <SectionCard
          title="내가 쓴 게시물"
          description="추후 내가 작성한 스터디 모집글과 자유게시판 글을 여기서 모아볼 수 있습니다."
        >
          <PlaceholderList
            icon={<FileText size={24} />}
            title="게시물 목록 영역"
            description="작성일, 게시판 유형, 제목, 반응 수를 보여주는 리스트가 여기에 들어갈 예정입니다."
          />
        </SectionCard>
      )}

      {activeTab === "comments" && (
        <SectionCard
          title="내가 쓴 댓글"
          description="추후 댓글 작성 대상 게시물과 댓글 내용, 작성 시간을 한 번에 확인할 수 있습니다."
        >
          <PlaceholderList
            icon={<MessageSquare size={24} />}
            title="댓글 목록 영역"
            description="댓글 원문과 연결된 게시물 정보, 이동 버튼이 포함된 리스트로 확장할 예정입니다."
          />
        </SectionCard>
      )}

      {activeTab === "likes" && (
        <SectionCard
          title="좋아요한 게시물"
          description="좋아요로 저장해 둔 게시물을 다시 찾기 쉬운 형태로 정리할 예정입니다."
        >
          <PlaceholderList
            icon={<Bookmark size={24} />}
            title="좋아요한 게시물 영역"
            description="게시물 썸네일 카드나 리스트 카드 형식으로 표시될 수 있도록 자리만 먼저 구성했습니다."
          />
        </SectionCard>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-hp-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-hp-700">
            <UserRound size={18} />
            <p className="text-sm font-bold">프로필 관리</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            계정 정보 수정, 프로필 이미지 확장 등 마이페이지의 기본 관리 기능이 들어갈 자리입니다.
          </p>
        </div>
        <div className="rounded-[24px] border border-hp-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-hp-700">
            <MessageSquare size={18} />
            <p className="text-sm font-bold">활동 기록</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            게시글, 댓글, 좋아요 같은 개인 활동 내역을 탭 단위로 구분해 보여줄 예정입니다.
          </p>
        </div>
        <div className="rounded-[24px] border border-hp-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-hp-700">
            <Heart size={18} />
            <p className="text-sm font-bold">저장된 관심글</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            마음에 들었던 게시물을 빠르게 다시 확인할 수 있도록 별도 영역으로 분리해 두었습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
