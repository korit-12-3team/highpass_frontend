# 프로젝트: 자격증 시험일정 & 커뮤니티 플랫폼

## 🎯 목표
자격증 시험 일정 관리, 개인 캘린더, 스터디/자유 게시판, 1:1 채팅 기능을 갖춘 자격증 수험생 전용 커뮤니티 플랫폼

---

## 🛠 기술 스택
| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS |
| AI | Gemini API (블로그 글 자동 생성) |
| 데이터 | 공공데이터포털 API (Q-Net 자격증 일정) |
| 자동화 | GitHub Actions |
| 배포 | Cloudflare Pages / Vercel |
| 지도 | Kakao Maps API (스터디 장소 표시) |
| 실시간 채팅 | WebSocket or Firebase Realtime DB (검토 필요) |

---

## 🗄 데이터베이스 스키마

### 1. User (사용자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| email | unique | 이메일 (로그인 ID) |
| password | string | 비밀번호 (암호화 저장) |
| nickname | string | 닉네임 |
| name | string | 이름 |
| age_range | string | 연령대 (예: 20대, 30대) |
| gender | string | 성별 |
| region | string | 사는 지역 |
| created_at | datetime | 가입 일시 |

### 2. Calendar (개인 일정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| user_id | FK → User | 작성자 |
| start_date | date | 시작 날짜 |
| end_date | date | 끝나는 날짜 |
| title | string | 일정 제목 |
| content | text | 일정 내용 |

### 3. Certificate (자격증 정보)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| name | string | 자격증 이름 |

### 4. CertificateSchedule (자격증 일정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| certificate_id | FK → Certificate | 자격증 |
| round | int | 회차 |
| written_apply_start | date | 필기 원서접수 시작 |
| written_apply_end | date | 필기 원서접수 종료 |
| written_exam_date | date | 필기 시험일 |
| written_result_date | date | 필기 합격예정자 발표 |
| practical_apply_start | date | 실기 원서접수 시작 |
| practical_apply_end | date | 실기 원서접수 종료 |
| practical_exam_date | date | 실기 시험일 |
| practical_result_date | date | 실기 합격자 발표 |

### 5. UserCertificate (사용자가 선택한 자격증)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| user_id | FK → User | 사용자 |
| certificate_schedule_id | FK → CertificateSchedule | 선택한 자격증 일정 |

### 6. Study (스터디 게시판)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| user_id | FK → User | 작성자 |
| title | string | 제목 |
| content | text | 내용 |
| location_name | string | 스터디 장소 이름 |
| latitude | float | 위도 |
| longitude | float | 경도 |
| view_count | int | 조회수 |
| favorite_count | int | 좋아요 수 |
| created_at | datetime | 작성일 |

### 7. FreeBoard (자유게시판)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| user_id | FK → User | 작성자 |
| title | string | 제목 |
| content | text | 내용 |
| view_count | int | 조회수 |
| favorite_count | int | 좋아요 수 |
| created_at | datetime | 작성일 |

### 8. Comment (댓글 - 스터디/자유게시판 공통)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| user_id | FK → User | 작성자 |
| content | text | 댓글 내용 |
| target_type | enum | "STUDY" 또는 "FREE" |
| target_id | int | 대상 게시글 id |
| created_at | datetime | 작성일 |

### 9. Favorite (관심 / 북마크)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| user_id | FK → User | 사용자 |
| target_type | enum | "STUDY" 또는 "FREE" |
| target_id | int | 대상 게시글 id |

### 10. ChatRoom (채팅방)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| created_at | datetime | 생성일 |

### 11. ChatParticipant (채팅 참여자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| chat_room_id | FK → ChatRoom | 채팅방 |
| user_id | FK → User | 참여자 |

### 12. ChatMessage (채팅 메시지)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | 고유 번호 |
| chat_room_id | FK → ChatRoom | 채팅방 |
| sender_id | FK → User | 보낸 사람 |
| message | text | 메시지 내용 |
| created_at | datetime | 전송 일시 |

---

## 📄 페이지 구성

### 🔐 인증
- `/login` — 로그인 (이메일 + 비밀번호)
- `/signup` — 회원가입 (이메일, 비밀번호, 닉네임, 이름, 연령대, 성별, 사는 지역)

### 🏠 메인
- `/` — 이번 달 자격증 시험 일정 카드 목록
- `/schedule/[id]` — 자격증 일정 상세

### 📅 캘린더
- `/calendar` — 달력 뷰 (날짜 클릭 시 그날 개인 일정 작성/조회)
  - 기능: 날짜 클릭 → 모달에서 일정 제목/내용 입력 → 저장
  - 자격증 일정도 캘린더에 겹쳐서 표시

### 🏆 자격증 일정 관리
- `/cert` — 내가 선택한 자격증 일정 목록 (회차, 필기/실기 전체 일정 표)
  - 필기 원서접수, 필기 시험일, 합격예정자 발표, 실기 원서접수, 실기 시험일, 합격자 발표

### 📚 스터디 게시판
- `/study` — 스터디 목록 (조회수, 좋아요, 관심, 댓글 수 표시)
- `/study/[id]` — 스터디 상세 (Kakao Map으로 장소 표시 + 댓글)
- `/study/write` — 스터디 글 작성 (장소를 지도에서 선택)

### 💬 자유게시판
- `/free` — 자유게시판 목록 (조회수, 좋아요, 관심, 댓글 수)
- `/free/[id]` — 게시글 상세 + 댓글
- `/free/write` — 글 작성

### 🧑 공통 기능 (스터디 / 자유게시판)
- 작성자 이름 클릭 → **모달창**으로 프로필 표시
  - 프로필 내용: 닉네임 / 이름 / 연령대 / 성별 / 사는 지역
  - 하단 버튼: **1:1 채팅하기**

### 💬 1:1 채팅
- `/chat` — 내 채팅방 목록
- `/chat/[roomId]` — 채팅방 (실시간 메시지)

---

## 🚀 개발 우선순위 (권장 순서)

| 단계 | 작업 항목 |
|------|-----------|
| 1단계 ✅ | 메인 페이지 + 일정 상세 페이지 (완료) |
| 2단계 | 로그인 / 회원가입 페이지 |
| 3단계 | 자격증 일정 관리 페이지 (내 자격증 선택) |
| 4단계 | 개인 캘린더 (달력 + 일정 작성) |
| 5단계 | 스터디 게시판 (목록 / 상세 / 작성) |
| 6단계 | 자유 게시판 |
| 7단계 | 유저 프로필 모달 + 1:1 채팅 |

---

## 🔐 환경변수 (.env.local)
```
GEMINI_API_KEY=
PUBLIC_DATA_API_KEY=
NEXT_PUBLIC_ADSENSE_ID=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_KAKAO_MAP_KEY=
```

---

## 💰 수익화
- **Google AdSense**: 메인 페이지, 블로그 글 페이지에 광고 배치
- **쿠팡 파트너스**: 블로그 글 하단에 수험서 추천 배너

---

## 🤖 자동화 (GitHub Actions)
매일 아침 7시(한국시간) 자동 실행:
1. Q-Net 공공데이터 API에서 최신 시험 일정 수집
2. Gemini AI로 블로그 글 자동 작성
3. Git 커밋 & 푸시
4. Cloudflare Pages 자동 배포
