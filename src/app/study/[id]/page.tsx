import { notFound } from "next/navigation";
import Link from "next/link";
import { getStudyById, getAllStudies } from "@/lib/study";
import KakaoMap from "@/components/KakaoMap";
import UserProfileCard from "@/components/UserProfileCard";

export function generateStaticParams() {
  const studies = getAllStudies();
  return studies.map((study) => ({
    id: String(study.id),
  }));
}

export default async function StudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const study = getStudyById(Number(id));

  if (!study) {
    notFound();
  }

  const kakaoApiKey = "894423a9ffcffb29a1e5d50427ded82e";

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex items-center gap-3">
          <Link
            href="/study"
            className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 transition-colors font-bold text-sm"
          >
            ← 스터디 게시판
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-sm text-gray-400 truncate">{study.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-6 flex gap-2">
          <span className="inline-block text-xs font-bold px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full">
            {study.userRegion}
          </span>
          <span className="inline-block text-xs font-bold px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full">
            조회수 {study.viewCount} · ❤️ {study.favoriteCount}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-6">
          {study.title}
        </h1>

        {/* 작성자 정보 모달 카드 컴포넌트 */}
        <UserProfileCard profile={{
          nickname: study.userNickname,
          age: study.userAge,
          gender: study.userGender,
          region: study.userRegion,
          createdAt: study.createdAt
        }} />

        {/* 본문 */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 sm:p-8 mb-8 text-gray-700 leading-8 whitespace-pre-line text-lg">
          {study.content}
        </div>

        {/* 스터디 장소 및 지도 */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📍</span> 스터디 모임 장소
          </h2>
          <p className="text-gray-700 font-medium mb-2">{study.locationName}</p>
          <KakaoMap
            apiKey={kakaoApiKey}
            lat={study.latitude}
            lng={study.longitude}
            locationName={study.locationName}
          />
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-200">
            스터디 참여 1:1 채팅하기
          </button>
          <Link
            href="/study"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border-2 border-orange-300 text-orange-500 font-bold rounded-2xl hover:bg-orange-50 transition-colors"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </main>

      <footer className="border-t border-orange-100 mt-16 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 text-center text-sm text-gray-400">
          <p>© 2026 자격증 시험일정. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
