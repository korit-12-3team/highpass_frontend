// 앱 전체에서 공유하는 데이터 타입과 데이터를 정의합니다.
// 나중에 실제 API로 바꿀 때도 이 파일만 수정하면 돼요!

export interface Schedule {
  id: number;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  target: string;
  summary: string;
  link: string;
}

export interface Benefit {
  id: number;
  name: string;
  category: string;
  summary: string;
  link: string;
}

// ── 실제 데이터 ──────────────────────────────────────
// public/data/local-info.json 과 동기화되어 있습니다.
export const schedules: Schedule[] = [
  {
    id: 1,
    name: "2026년 제1회 기사/산업기사 필기시험",
    category: "시험일정",
    startDate: "2026-04-11",
    endDate: "2026-04-25",
    location: "전국 CBT 시험장",
    target: "기사/산업기사 응시 자격 소지자",
    summary:
      "2026년 첫 번째 정기 기사/산업기사 필기시험입니다. 원서 접수 일정을 반드시 확인하세요. " +
      "CBT(Computer Based Test) 방식으로 진행되며, 원서 접수는 한국산업인력공단 큐넷(Q-Net)을 통해 할 수 있습니다. " +
      "시험 합격 기준은 과목별 40점 이상, 전과목 평균 60점 이상입니다.",
    link: "https://www.q-net.or.kr/crf021.do?id=crf02103&gSite=Q&gId=&schGb=cal&schMonth=20260401",
  },
  {
    id: 2,
    name: "2026년 제2회 기능사 필기시험",
    category: "시험일정",
    startDate: "2026-05-09",
    endDate: "2026-05-23",
    location: "전국 CBT 시험장",
    target: "제한 없음 (누구나 응시 가능)",
    summary:
      "기능사는 학력 제한 없이 누구나 도전할 수 있는 국가기술자격입니다! " +
      "실기 시험으로 가는 첫 번째 관문으로, 필기 합격 후 2년 이내에 실기 시험에 응시해야 합니다. " +
      "60점 이상이면 합격이며, CBT 방식으로 진행되어 시험 직후 바로 합격 여부를 확인할 수 있습니다.",
    link: "https://www.q-net.or.kr/crf021.do?id=crf02103&gSite=Q&gId=&schGb=cal&schMonth=20260501",
  },
  {
    id: 3,
    name: "2026년 제2회 기사/산업기사 실기시험",
    category: "시험일정",
    startDate: "2026-06-06",
    endDate: "2026-06-19",
    location: "각 지역 실기 지정 시험장",
    target: "기사/산업기사 필기 합격자",
    summary:
      "실기는 작업형과 필답형으로 나뉩니다. 합격 발표를 놓치지 않도록 일정을 꼭 저장해 두세요. " +
      "실기 시험은 자격 종목에 따라 필답형, 작업형, 또는 혼합형으로 진행됩니다. " +
      "합격 기준은 100점 만점에 60점 이상이며, 합격률은 종목별로 상이합니다. " +
      "시험장 위치와 준비물은 수험표와 함께 사전에 꼭 확인하세요.",
    link: "https://www.q-net.or.kr/crf021.do?id=crf02103&gSite=Q&gId=&schGb=cal&schMonth=20260601",
  },
];

export const qualifications: Schedule[] = [
  {
    id: 10,
    name: "정보처리기사",
    category: "자격정보",
    startDate: "-",
    endDate: "-",
    location: "-",
    target: "관련 학과 졸업(예정)자 또는 실무 경력자",
    summary:
      "IT 국가 기술자격의 기본이자 필수! 소프트웨어 개발, 설계, 운영 전반을 다루는 핵심 자격증입니다. " +
      "취업 시 우대 사항에 단골로 등장하는 자격증으로, SW 개발자를 꿈꾼다면 반드시 취득하는 것이 좋습니다. " +
      "시험은 필기(객관식 5과목)와 실기(단답형·서술형)로 구성됩니다. " +
      "응시 자격은 관련 학과 졸업(예정)자, 비관련 학과 졸업 후 실무 1년 이상 경력자 등에게 주어집니다.",
    link: "https://www.q-net.or.kr/crf006.do?id=crf00610&gSite=Q&gId=",
  },
];

// 두 배열을 합쳐서 전체 리스트를 만들어줍니다.
export const allItems: Schedule[] = [...schedules, ...qualifications];

// id로 특정 항목을 찾는 함수
export function getItemById(id: number): Schedule | undefined {
  return allItems.find((item) => item.id === id);
}
