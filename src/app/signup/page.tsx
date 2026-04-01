import Link from "next/link";

export const metadata = {
  title: "회원가입 | 자격증 시험일정",
  description: "새 계정을 만들고 스터디와 일정을 관리하세요",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <span className="text-4xl" aria-hidden>📝</span>
          <h1 className="text-3xl font-black text-orange-600 tracking-tight leading-none">
            자격증 시험일정
          </h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          회원가입
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
            로그인하기
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-3xl sm:px-10 border border-orange-100">
          <form className="space-y-6" action="#" method="POST">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg leading-6 font-bold text-gray-900 border-b pb-2 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일 *</label>
                  <div className="mt-1">
                    <input id="email" name="email" type="email" required className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="수신 가능한 이메일" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호 *</label>
                  <div className="mt-1">
                    <input id="password" name="password" type="password" required className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름 *</label>
                  <div className="mt-1">
                    <input id="name" name="name" type="text" required className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="실명 입력" />
                  </div>
                </div>

                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">닉네임 *</label>
                  <div className="mt-1">
                    <input id="nickname" name="nickname" type="text" required className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="게시판에서 사용할 이름" />
                  </div>
                </div>
              </div>
            </div>

            {/* 프로필 정보 */}
            <div className="pt-4">
              <h3 className="text-lg leading-6 font-bold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                <span>👤</span> 프로필 정보
                <span className="text-xs font-normal text-gray-400">(게시판, 스터디 참여 시 다른 사람에게 표시되는 정보입니다)</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <label htmlFor="age_range" className="block text-sm font-medium text-gray-700">연령대 *</label>
                  <div className="mt-1">
                    <select id="age_range" name="age_range" required className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-700 sm:text-sm bg-white">
                      <option value="">선택해주세요</option>
                      <option value="10대">10대</option>
                      <option value="20대">20대</option>
                      <option value="30대">30대</option>
                      <option value="40대">40대</option>
                      <option value="50대">50대</option>
                      <option value="60대 이상">60대 이상</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">성별 *</label>
                  <div className="mt-1">
                    <select id="gender" name="gender" required className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-700 sm:text-sm bg-white">
                      <option value="">선택해주세요</option>
                      <option value="남성">남성</option>
                      <option value="여성">여성</option>
                      <option value="비공개">비공개</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">사는 지역 (주로 스터디할 지역) *</label>
                  <div className="mt-1">
                    <input id="region" name="region" type="text" required className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="예: 서울시 강남구, 부산시 해운대구" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="w-full flex justify-center py-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors shadow-orange-200"
              >
                가입 완료하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
