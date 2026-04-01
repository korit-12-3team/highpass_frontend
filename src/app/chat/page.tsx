import Link from "next/link";
import { getChatRooms } from "@/lib/chat";

export const metadata = {
  title: "1:1 채팅 | 자격증 시험일정",
};

export default function ChatListPage() {
  const rooms = getChatRooms();

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 transition-colors font-bold text-sm"
          >
            ← 메인 홈으로
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-sm font-black text-gray-900 truncate">내 채팅방</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">메시지 목록</h1>

        {rooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
            <span className="text-4xl">📭</span>
            <p className="mt-4 text-gray-400 font-medium tracking-tight">아직 대화 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Link 
                key={room.id} 
                href={`/chat/${room.id}`}
                className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-300 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0 relative">
                    {room.partnerNickname[0]}
                    {room.unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-extrabold text-gray-900 text-base truncate pr-2 group-hover:text-orange-600 transition-colors">
                        {room.partnerNickname}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">{room.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{room.lastMessage}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
