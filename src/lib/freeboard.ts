export interface FreeBoardPost {
  id: number;
  userId: number;
  userNickname: string;
  userAge: string;
  userGender: string;
  userRegion: string;
  title: string;
  content: string;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
}

export const freeBoardPosts: FreeBoardPost[] = [
  {
    id: 1,
    userId: 201,
    userNickname: "합격만딸기",
    userAge: "20대",
    userGender: "여성",
    userRegion: "경기도 수원시",
    title: "기사 1회 실기 가채점 다들 어떠신가요?",
    content: "이번 기사 실기 1회차 시험 난이도 극악이네요...ㅠㅠ 3번 문제 푸신 분 계신가요? 어떻게 풀어야 할지 감도 안 오고, 부분 점수가 어떻게 주어질지 궁금합니다. 가채점으로 겨우 61점인데 불안하네요.",
    viewCount: 342,
    favoriteCount: 25,
    createdAt: "2026-03-30 11:20:00",
  },
  {
    id: 2,
    userId: 202,
    userNickname: "단기합격러",
    userAge: "30대",
    userGender: "남성",
    userRegion: "대구광역시 수성구",
    title: "정보처리기사 비전공자 합격 수기 (3주 컷)",
    content: "안녕하세요! 비전공자(경영학과) 직장인인데 운 좋게 3주 만에 정보처리기사 필기 합격했습니다! \n제가 사용했던 기출문제 사이트와 요약 노트 정리법을 공유합니다. 참고하셔서 다들 좋은 결과 있으시길 바랍니다!",
    viewCount: 1256,
    favoriteCount: 142,
    createdAt: "2026-03-29 09:15:00",
  },
  {
    id: 3,
    userId: 203,
    userNickname: "공부자극이필요해",
    userAge: "10대",
    userGender: "비공개",
    userRegion: "인천광역시 연수구",
    title: "슬럼프 어떻게 극복하시나요?",
    content: "요즘 책상에 앉아도 10분 만에 집중력이 깨져요... ㅠㅠ 다들 이럴 때 어떻게 리프레시하시는지 궁금합니다. 조언 좀 부탁드려요!",
    viewCount: 89,
    favoriteCount: 5,
    createdAt: "2026-03-28 22:45:00",
  },
];

export function getAllFreeBoardPosts() {
  return freeBoardPosts;
}

export function getFreeBoardPostById(id: number) {
  return freeBoardPosts.find((p) => p.id === id);
}
