import Image from "next/image";
import {
  CalendarDays,
  FileText,
  LogOut,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import type { AdminSection } from "@/features/admin/types";

export function AdminSidebar({
  activeSection,
  onSectionChange,
  onLogout,
}: {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
}) {
  const items = [
    {
      id: "users" as const,
      label: "회원 관리",
      description: "조회, 상세, 정지, 탈퇴",
      icon: <Users size={19} />,
    },
    {
      id: "posts" as const,
      label: "게시글 관리",
      description: "공개, 숨김, 삭제",
      icon: <FileText size={19} />,
    },
    {
      id: "reports" as const,
      label: "신고 및 문의",
      description: "신고, 문의 처리",
      icon: <MessageSquareWarning size={19} />,
    },
    {
      id: "certificates" as const,
      label: "자격증 일정",
      description: "일정 갱신",
      icon: <CalendarDays size={19} />,
    },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#b8dff3] bg-[linear-gradient(180deg,#f8fcff_0%,#e8f6ff_48%,#d5ebf7_100%)] text-[#123b5c] md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="p-5">
        <div className="rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/Highpass_icon.png"
              alt="HighPass Admin"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
              priority
            />
            <div>
              <h1 className="text-xl font-black text-[#123b5c]">HIGHPASS</h1>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2e668d]">
                관리자 페이지
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-[#b8dff3]/90" />
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {items.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                active
                  ? "bg-[#123b5c] text-white shadow-sm shadow-[#0d3d62]/20"
                  : "text-slate-700 hover:bg-white/75 hover:text-[#123b5c]"
              }`}
            >
              <span className={active ? "text-[#8ccaf7]" : "text-[#2e668d]"}>
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{item.label}</span>
                <span
                  className={`mt-0.5 block text-xs font-semibold ${
                    active ? "text-blue-100/80" : "text-slate-500"
                  }`}
                >
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="m-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#c9e6f7] bg-white/75 px-4 py-3 text-sm font-black text-[#123b5c] transition hover:bg-[#eef8ff]"
        >
          <LogOut size={17} />
          로그인 화면으로 가기
        </button>
      </div>
    </aside>
  );
}
