# Highpass Frontend

한국 자격증 시험 준비 플랫폼 **Highpass**의 프론트엔드입니다.

Next.js 기반 SSR/CSR 혼합 구조로, 포트 **3000**에서 실행됩니다.

---

## 기술 스택

| 구분 | 내용 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4 |
| HTTP | Axios (`http`) — 클라이언트 컴포넌트용 |
| 실시간 | STOMP over SockJS (`@stomp/stompjs`) |
| 지도 | Kakao Maps SDK |
| 배포 | Vercel |

---

## 로컬 실행

### 사전 조건

`highpass_frontend/.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_KAKAO_MAP_APPKEY=...
```

### 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인

---

## 주요 피처

| 디렉토리 | 기능 |
|---|---|
| `features/auth` | 로그인·회원가입·OAuth2 |
| `features/boards` | 자유게시판 (좋아요·댓글) |
| `features/study` | 스터디 모집 게시판 |
| `features/chat` | 실시간 채팅 (STOMP) |
| `features/calendar` | 캘린더·할일·공휴일·카카오 캘린더 연동 |
| `features/search` | 자격증 검색·일정 조회 |
| `features/notifications` | 실시간 알림 |
| `features/mypage` | 프로필·자격증 관리 |
| `features/reports` | 신고 |
| `features/admin` | 관리자 페이지 |
| `features/support` | 고객 문의 |

---

## API 호출 규칙

| 상황 | 클라이언트 | 경로 |
|---|---|---|
| 클라이언트 컴포넌트 (인증 필요) | `http` (Axios) | `@/services/api/http` |
| 서버 컴포넌트 / Route Handler | `fetchWithAuth` | `@/services/auth/auth` |
| Chat API | `fetchWithAuth` | `@/services/auth/auth` (별도 base URL) |

- 환경변수는 반드시 `@/services/config/config.ts`에서만 import (`process.env` 직접 참조 금지)
- Board 응답 매핑은 `features/boards/api/mappers.ts` 재사용

---

## 디렉토리 구조

```
src/
├── app/              # Next.js App Router 페이지 및 route handlers
├── entities/         # 공유 도메인 타입 (common/types.ts)
├── features/         # 도메인별 feature 모듈
│   └── {feature}/
│       ├── api/      # API 호출 함수 (클라이언트: *.ts / 서버: *-server.ts)
│       ├── components/
│       ├── hooks/
│       └── utils/
├── services/
│   ├── api/          # Axios 인스턴스 (http.ts)
│   ├── auth/         # fetchWithAuth, 세션 관리
│   ├── config/       # 환경변수 export
│   └── realtime/     # STOMP 클라이언트 (stomp.ts)
└── shared/           # 공통 컴포넌트·훅·유틸·AppContext
```

---

## 전역 상태

`useApp()` — `@/shared/context/AppContext`

채팅방 목록 갱신 등 앱 전역 이벤트를 `chatRoomsRefreshKey` 패턴으로 처리합니다.

---

## 배포

Vercel 연결 후 환경변수 설정:

- `NEXT_PUBLIC_API_BASE_URL` → Cloud Run 배포 URL + `/api`
- `NEXT_PUBLIC_FRONTEND_URL` → Vercel 배포 URL
- `NEXT_PUBLIC_KAKAO_MAP_APPKEY` → 카카오 앱 키
