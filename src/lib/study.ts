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
}

export const studies: Study[] = [
  {
    id: 1,
    userId: 101,
    userName: "김철수",
    userNickname: "공부왕철수",
    userAge: "20대",
    userGender: "남성",
    userRegion: "서울시 강남구",
    title: "강남역 스터디룸 기사 필기 빡집중 멤버 모집",
    content: "평일 저녁 강남역 부근 스터디룸에서 같이 기사 필기 공부하실 분 구합니다. 조용히 각자 공부할 분들 환영해요!",
    locationName: "강남역 2번 출구 스타벅스",
    latitude: 37.497942,
    longitude: 127.027621,
    viewCount: 152,
    favoriteCount: 14,
    createdAt: "2026-03-30 10:00:00",
  },
  {
    id: 2,
    userId: 102,
    userName: "이영희",
    userNickname: "합격가즈아",
    userAge: "30대",
    userGender: "여성",
    userRegion: "부산시 해운대구",
    title: "주말 오전 부산대 인근 공인노무사 스터디",
    content: "주말 아침 일찍 모여서 공인노무사 1차 준비하는 캠스터디/오프라인 모임 구장입니다.",
    locationName: "부산대학교 정문 앞 탐앤탐스",
    latitude: 35.231610,
    longitude: 129.083995,
    viewCount: 89,
    favoriteCount: 5,
    createdAt: "2026-03-29 18:30:00",
  },
];

export function getAllStudies() {
  return studies;
}

export function getStudyById(id: number) {
  return studies.find((s) => s.id === id);
}
