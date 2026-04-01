import { allItems, getItemById } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";

// Next.js 정적 배포(output: "export")를 위해
// 빌드 시점에 어떤 id 페이지들을 만들어야 하는지 알려줍니다.
export function generateStaticParams() {
  return allItems.map((item) => ({
    id: String(item.id),
  }));
}

// SEO를 위한 페이지 제목 자동 설정
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItemById(Number(id));
  return {
    title: item ? `${item.name} | 자격증 시험일정` : "항목을 찾을 수 없음",
  };
}

// 날짜를 보기 좋게 변환하는 함수
function formatDate(dateStr: string) {
  if (dateStr === "-") return "-";
  const [year, month, day] = dateStr.split("-");
  return `${year}년 ${month}월 ${day}일`;
}

export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItemById(Number(id));

  // 해당 id가 없으면 404 페이지로 이동
  if (!item) notFound();

  const isSchedule = item.category === "시험일정";

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      {/* ────── 헤더 ────── */}
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 transition-colors font-bold text-sm"
          >
            ← 목록으로
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-sm text-gray-400 truncate">{item.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        {/* 카테고리 뱃지 */}
        <div className="mb-6">
          <span
            className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${
              isSchedule
                ? "bg-orange-100 text-orange-700"
                : "bg-sky-100 text-sky-700"
            }`}
          >
            {item.category}
          </span>
        </div>

        {/* 시험명 */}
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-10">
          {item.name}
        </h1>

        {/* 기본 정보 카드 */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden mb-8">
          <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-300" />
          <div className="p-6 sm:p-8 grid gap-5 sm:grid-cols-2">
            {isSchedule && (
              <InfoRow
                icon="📅"
                label="시험 기간"
                value={
                  item.startDate === "-"
                    ? "-"
                    : `${formatDate(item.startDate)} ~ ${formatDate(item.endDate)}`
                }
              />
            )}
            <InfoRow icon="📍" label="장소" value={item.location} />
            <InfoRow icon="👤" label="응시 대상" value={item.target} />
            <InfoRow icon="🏷️" label="구분" value={item.category} />
          </div>
        </div>

        {/* 상세 설명 */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span> 상세 설명
          </h2>
          <p className="text-gray-600 leading-8 whitespace-pre-line">
            {item.summary}
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
          >
            Q-Net 원본 사이트에서 자세히 보기 →
          </a>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border-2 border-orange-300 text-orange-500 font-bold rounded-2xl hover:bg-orange-50 transition-colors"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </main>

      {/* ────── 푸터 ────── */}
      <footer className="border-t border-orange-100 mt-16 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 text-center text-sm text-gray-400">
          <p>
            데이터 출처:{" "}
            <a
              href="https://data.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 font-semibold hover:underline"
            >
              공공데이터포털 (data.go.kr)
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// 정보 한 줄을 표시하는 작은 컴포넌트
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-xl mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-bold text-orange-400 mb-0.5">{label}</p>
        <p className="text-gray-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
