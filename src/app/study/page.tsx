import Link from "next/link";
import { getAllStudies } from "@/lib/study";
import KakaoMap from "@/components/KakaoMap";

export default function StudyBoardPage() {
  const studies = getAllStudies();
  const kakaoApiKey = "894423a9ffcffb29a1e5d50427ded82e";

  // 모든 스터디의 위치를 마커 데이터로 변환합니다.
  const mapMarkers = studies.map((s) => ({
    lat: s.latitude,
    lng: s.longitude,
    locationName: s.locationName,
    id: s.id,
  }));

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>📝</span>
            <Link href="/" className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight leading-none">
              자격증 시험일정
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">홈</Link>
            <Link href="/blog" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">블로그</Link>
            <Link href="/study" className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">스터디</Link>
            <div className="flex items-center gap-3 ml-4 border-l pl-4 border-gray-100">
              <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors">로그인</Link>
              <Link href="/signup" className="text-sm font-bold text-white bg-orange-500 px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors">회원가입</Link>
            </div>
          </nav>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-500 to-amber-400 text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">스터디 게시판</h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed max-w-md mb-8">
            목표가 같은 동료를 찾아 시너지를 내보세요! 지도에서 스터디 위치를 한눈에 확인할 수 있습니다.
          </p>
          
          {/* 목록 상단 전체 지도 추가 */}
          <div className="bg-white/10 p-2 rounded-[32px] backdrop-blur-sm shadow-2xl">
            <KakaoMap 
              apiKey={kakaoApiKey} 
              markers={mapMarkers} 
              level={10} // 전국을 보여주기 위해 약간 멀리서 봅니다.
              center={{ lat: 36.3504, lng: 127.3845 }} // 대전쯤을 중심으로 잡으면 전국이 잘 보입니다.
            />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold text-gray-900">모집 중인 스터디 ({studies.length})</h2>
          <button className="bg-orange-500 text-white font-bold py-2 px-4 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
            + 새 스터디 모집
          </button>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {studies.map((study) => (
            <Link
              key={study.id}
              href={`/study/${study.id}`}
              className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-shadow group block flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">{study.userRegion}</span>
                <span className="text-xs text-gray-400 font-mono">{study.createdAt.split(" ")[0]}</span>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">{study.title}</h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed flex-1">
                {study.content}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-400 border-t border-orange-50 pt-4 mt-auto">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">👁️ {study.viewCount}</span>
                  <span className="flex items-center gap-1">❤️ {study.favoriteCount}</span>
                </div>
                <div className="bg-gray-50 px-3 py-1.5 border border-gray-100 rounded-lg">
                  <span className="font-semibold text-gray-600">{study.userNickname}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
