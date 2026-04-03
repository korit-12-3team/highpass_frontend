export interface Study {
  id: number;
  userId: number;
  userName: string;
  userNickname: string;
  userAge: string;
  userGender: string;
  userRegion: string;
  title: string;
  content: string;
  locationName: string;
  latitude: number;
  longitude: number;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  cert: string | null;
}

export const studies: Study[] = [
  {
    id: 1,
    userId: 101,
    userName: "김철수",
    userNickname: "공부왕철수",
    userAge: "20대",
    userGender: "남성",
    userRegion: "서울 강남구",
    title: "강남역 스터디룸 정보처리기사 필기 빡집중 멤버 모집",
    content: "평일 저녁 강남역 부근 스터디룸에서 같이 정보처리기사 필기 공부하실 분 구합니다. 조용히 각자 공부할 분들 환영해요!",
    locationName: "강남역 2번 출구 스타벅스",
    latitude: 37.497942,
    longitude: 127.027621,
    viewCount: 152,
    favoriteCount: 14,
    createdAt: "2026-03-30 10:00:00",
    cert: "정보처리기사",
  },
  {
    id: 2,
    userId: 102,
    userName: "이영희",
    userNickname: "합격가즈아",
    userAge: "30대",
    userGender: "여성",
    userRegion: "부산 해운대구",
    title: "주말 오전 부산대 인근 전기기사 스터디",
    content: "주말 아침 일찍 모여서 전기기사 1차 준비하는 캠스터디/오프라인 모임입니다. 같이 열심히 해봐요!",
    locationName: "부산대학교 정문 앞 탐앤탐스",
    latitude: 35.231610,
    longitude: 129.083995,
    viewCount: 89,
    favoriteCount: 5,
    createdAt: "2026-03-29 18:30:00",
    cert: "전기기사",
  },
  {
    id: 3,
    userId: 103,
    userName: "박민준",
    userNickname: "단기합격러",
    userAge: "20대",
    userGender: "남성",
    userRegion: "서울 마포구",
    title: "홍대입구 카페 산업안전기사 주말 스터디",
    content: "산업안전기사 이번 회차에 꼭 붙고 싶으신 분들 모여요. 주말 오후 2시~6시, 스터디룸 or 카페에서 진행합니다.",
    locationName: "홍대입구역 근처 스터디룸",
    latitude: 37.557527,
    longitude: 126.925595,
    viewCount: 67,
    favoriteCount: 9,
    createdAt: "2026-04-01 14:00:00",
    cert: "산업안전기사",
  },
  {
    id: 4,
    userId: 104,
    userName: "최수연",
    userNickname: "전기공주",
    userAge: "20대",
    userGender: "여성",
    userRegion: "인천 남동구",
    title: "인천 전기기능사 실기 대비 스터디 모집",
    content: "전기기능사 실기 준비 중이신 분들과 함께 공부하고 싶어요. 평일 저녁 시간 가능하신 분 환영합니다.",
    locationName: "인천시청역 인근 스터디카페",
    latitude: 37.456068,
    longitude: 126.705204,
    viewCount: 44,
    favoriteCount: 3,
    createdAt: "2026-04-02 09:30:00",
    cert: "전기기능사",
  },
  {
    id: 5,
    userId: 105,
    userName: "정도현",
    userNickname: "합격이다",
    userAge: "30대",
    userGender: "남성",
    userRegion: "대구 수성구",
    title: "대구 건축기사 필기/실기 통합 스터디",
    content: "건축기사 준비하시는 분들 대구에서 모집합니다. 기출 분석 위주로 진행할 예정이며 초보자도 환영해요.",
    locationName: "수성구 범어역 카페베네",
    latitude: 35.858598,
    longitude: 128.630641,
    viewCount: 33,
    favoriteCount: 2,
    createdAt: "2026-04-01 20:00:00",
    cert: "건축기사",
  },
];

export function getAllStudies() {
  return studies;
}

export function getStudyById(id: number) {
  return studies.find((s) => s.id === id);
}
