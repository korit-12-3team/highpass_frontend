# REFACTORING_ROADMAP

작성일: 2026-04-29  
최종 업데이트: 2026-04-30

## 목적

현재 프로젝트의 프론트/백엔드 구조를 실무 기준에 맞게 안정화한다. 우선순위는 인증 주체 정리, 권한 정책, 입력 검증, 예외 처리, 중복 제거, 조회 성능 개선, 테스트/운영 설정 정리 순서로 진행한다.

## Push 제외 기준

다음 파일과 디렉터리는 GitHub에 push하지 않는다.

### 프론트엔드

- `.env.local`
- `.next/`
- `node_modules/`
- `.npm-cache/`
- `frontend-dev.log`
- `frontend-dev.err.log`
- `next-env.d.ts`

### 백엔드

- `env.properties`
- `data/`
- `.gradle/`
- `.gradle-home/`
- `build/`
- `backend-bootrun.log`
- `backend-bootrun.err.log`

### 주의

- `build.gradle`에 로컬 실행용으로 추가한 H2 의존성은 push 대상에서 제외한다.
- `cloudrun-env.yaml`, `env.properties` 등 민감정보가 포함될 수 있는 파일은 push 전 반드시 확인한다.

## 전체 진행 현황

| 단계 | 작업 | 상태 |
| --- | --- | --- |
| 1 | 게시판 인증 구조 정리 | 완료 |
| 2 | `SecurityConfig` 권한 정책 정리 | 완료 |
| 3 | 나머지 도메인 path `userId` 제거 | 완료 |
| 4 | Request DTO 검증 추가 | 완료 |
| 5 | Entity 직접 RequestBody 수신 제거 | 완료 |
| 6 | 예외 처리 표준화 | 완료 |
| 7 | 게시판 공통 중복 제거 | 완료 |
| 8 | Repository 목록 조회 개선 | 완료 |
| 9 | 프론트 API mapper 중복 제거 | 완료 |
| 10 | 테스트 추가 | 대기 |
| 11 | DB 마이그레이션 체계 도입 | 대기 |
| 12 | 운영 설정/민감정보 정리 | 대기 |

## 계획 대비 변경 사항

- 3단계는 원래 Calendar/Todo/User/Notification/UserCertificate 중심이었지만, 댓글/좋아요 API에도 path `userId`와 body `userId` 신뢰 문제가 있어 함께 정리했다.
- 5단계는 원래 `CalendarCreateRequest`, `CalendarUpdateRequest`를 별도 생성할 계획이었지만, 기존 `CalendarRequest`가 이미 생성/수정에 필요한 필드를 모두 갖고 있어 하나의 DTO를 재사용했다.
- 6단계는 한 번에 끝내지 않고 1차 정리 후 “잔여 예외 정리”로 나누어 진행했다. 이후 `ReportService`, `AdminService`, `TokenController`, `OAuth2SignupServiceImpl`, `KakaoCalendarTokenService`까지 정리했다.
- 7단계의 공통 서비스 이름은 계획상의 `BoardInteractionService` 대신 실제 책임에 맞춰 `BoardSupportService`로 생성했다.
- 8단계는 계획상 pagination까지 포함했지만, 현재 API 계약 변경 범위가 커서 page/size 도입은 보류했다. 이번 단계에서는 `findAll().stream()` 기반 필터/정렬/카운트를 Repository 메서드로 옮기는 수준까지 완료했다.
- 9단계는 계획상 게시판 API mapper 중심이었지만, 실제 중복이 댓글/마이페이지/자격증 API에도 있어 공통 유틸을 함께 분리했다.

## 완료 상세

### 1단계: 게시판 인증 구조 정리

완료 내용:

- 게시글 생성 API에서 path `userId` 제거
- `FreeBoardController`, `StudyBoardController`가 `@AuthenticationPrincipal CustomJwtPrincipal` 기반으로 사용자 식별
- 게시글 수정/삭제 권한을 작성자 또는 관리자 기준으로 검증
- 프론트 게시글 생성 호출부에서 path `userId` 제거

검증:

- 백엔드 `compileJava` 통과
- 프론트 `tsc --noEmit` 통과

### 2단계: SecurityConfig 권한 정책 정리

완료 내용:

- 공개 조회 API와 인증 필요 API 분리
- 게시글/일정/알림/마이페이지 등 쓰기 API는 인증 필요로 정리
- 관리자 API는 인증 후 서비스 레벨에서 관리자 권한 검증

검증:

- 백엔드 `compileJava` 통과

### 3단계: 나머지 도메인 path userId 제거

완료 내용:

- Calendar, Todo, Notification, UserCertificate, User 마이페이지 API에서 path `userId` 제거
- 현재 로그인 사용자 기준으로 조회/생성/수정/삭제 처리
- 댓글/좋아요도 추가로 principal 기반으로 변경
- 프론트 API 호출부를 새 경로로 변경

계획 대비 추가:

- 댓글 수정/삭제, 좋아요 토글도 사용자 ID 위조 가능성이 있어 함께 처리했다.

검증:

- 백엔드 `compileJava` 통과
- 프론트 `tsc --noEmit` 통과

### 4단계: Request DTO 검증 추가

완료 내용:

- 주요 Request DTO에 `@NotBlank`, `@NotNull`, `@Email`, `@Size`, `@Pattern` 적용
- 모든 `@RequestBody`에 `@Valid` 적용
- 검증 실패 시 `ErrorResponse` 형태의 400 응답 처리 추가

검증:

- 백엔드 `compileJava` 통과

### 5단계: Entity 직접 RequestBody 수신 제거

완료 내용:

- `CalendarController`가 `Calendar` Entity 대신 `CalendarRequest`를 받도록 변경
- `CalendarService`에서 DTO를 Entity로 변환
- Entity에 임시로 붙였던 요청 검증 어노테이션 제거

계획 대비 변경:

- 별도 Create/Update DTO를 만들지 않고 기존 `CalendarRequest`를 재사용했다.

검증:

- 백엔드 `compileJava` 통과

### 6단계: 예외 처리 표준화

완료 내용:

- `ErrorCode` 추가
- `BusinessException` 추가
- `ErrorResponse`에 `code` 필드 추가
- `GlobalExceptionHandler`를 표준 응답 형태로 정리
- 주요 서비스의 `RuntimeException`, `IllegalArgumentException`, `ResponseStatusException`을 `BusinessException`으로 교체

추가로 정리한 잔여 범위:

- `ReportService`
- `AdminService`
- `TokenController`
- `OAuth2SignupServiceImpl`
- `KakaoCalendarTokenService`

검증:

- 백엔드 `compileJava` 통과

### 7단계: 게시판 공통 중복 제거

완료 내용:

- `BoardSupportService` 추가
- 게시판 공통 인증 사용자 조회, 작성자/관리자 권한 검증, 좋아요 여부 조회, 댓글/좋아요 삭제 정리 로직 분리
- `FreeBoardService`, `StudyBoardService`에서 중복 제거
- `BoardLikeService`의 대상 조회, 좋아요 카운트 증감, 알림 발송 흐름 정리

계획 대비 변경:

- 공통 서비스 이름은 `BoardInteractionService`가 아니라 실제 책임에 맞춰 `BoardSupportService`로 정했다.

검증:

- 백엔드 `compileJava` 통과

### 8단계: Repository 목록 조회 개선

완료 내용:

- 게시판 목록의 `findAll().stream().filter(...)`를 Repository 메서드로 변경
- 관리자 사용자/신고/게시글 목록의 DB 정렬/필터/카운트 일부를 Repository로 이동
- `StudyBoardRepository`의 잘못된 반환 타입 수정
- 사용자별 게시글/댓글 수 계산을 `countBy...` 쿼리로 변경
- 자격증 일정 목록에 정렬 Repository 메서드 적용

계획 대비 변경:

- page/size 기반 pagination 도입은 보류했다. 프론트 API 계약 변경이 필요해 별도 단계로 분리하는 편이 안전하다.

검증:

- 백엔드 `compileJava` 통과
- 백엔드 `test` 통과, 현재 테스트 소스는 없어 실제 테스트 케이스는 실행되지 않음

### 9단계: 프론트 API mapper 중복 제거

완료 내용:

- `src/shared/utils/api-mappers.ts` 추가
- `safeString`, `safeNumber`, `unwrapData`, `optionalDate`, `optionalString` 공통화
- `src/features/boards/api/mappers.ts` 추가
- 자유게시판 client/server, 스터디 client/server, 댓글 client/server 매퍼 통합
- 마이페이지 프로필, 자격증 API도 공통 유틸 사용

계획 대비 추가:

- 게시판뿐 아니라 댓글, 마이페이지, 자격증 API의 반복 유틸도 함께 정리했다.

검증:

- 프론트 `tsc --noEmit` 통과

## 남은 단계

### 10단계: 테스트 추가

목표:

- 리팩토링 후 핵심 기능이 깨지지 않도록 최소 테스트 기반을 만든다.

우선 대상:

- 백엔드 인증/회원가입/로그인
- 게시글 생성/수정/삭제 권한
- 댓글/좋아요 principal 기반 처리
- 검증 실패 400 응답
- 예외 응답 `status`, `code`, `message` 형식
- 프론트 API mapper 단위 테스트 또는 최소 타입 기반 검증

### 11단계: DB 마이그레이션 체계 도입

목표:

- 운영 환경에서 `ddl-auto: update`에 의존하지 않도록 한다.

예정 작업:

- Flyway 또는 Liquibase 도입 검토
- 기존 수동 SQL을 migration 파일로 정리
- 개발/운영 DB 설정 분리
- 운영에서는 `ddl-auto: validate` 또는 `none` 사용

### 12단계: 운영 설정/민감정보 정리

목표:

- 민감정보와 로컬 실행 설정을 GitHub push 대상에서 분리한다.

예정 작업:

- `.env.example`, `env.properties.example` 추가 또는 정리
- `cloudrun-env.yaml` 내 실사용 secret 처리 방식 정리
- Secret Manager 사용 문서화
- 로컬 H2 실행 설정을 별도 local profile로 분리할지 결정

## 다음 요청 추천

```text
10단계 테스트 추가 진행해줘.
우선 백엔드 인증/게시판 권한/예외 응답 테스트부터 최소 범위로 만들어줘.
```
