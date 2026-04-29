# 프론트엔드/백엔드 구조 점검 및 보완 과제

작성일: 2026-04-29

## 총평

현재 프로젝트는 프론트엔드와 백엔드가 별도 디렉터리로 분리되어 있고, 백엔드는 `controller`, `service`, `repository`, `entity`, `dto`, `config` 계층을 갖추고 있습니다. 프론트엔드도 `app`, `features`, `services`, `shared`, `entities` 구조로 기능별 분리를 시도하고 있어 학습용 또는 프로토타입 단계에서는 나쁘지 않은 구조입니다.

다만 실무 운영 기준에서는 보안, 데이터베이스 변경 관리, 인증/인가 경계, 테스트, 예외 처리, 프론트 상태 관리 측면에서 보완이 필요합니다. 특히 인증된 사용자 정보 대신 요청 path의 `userId`를 신뢰하는 구조, 광범위한 `permitAll`, `ddl-auto: update`, 테스트 부재는 우선적으로 수정해야 합니다.

## 우선순위 요약

| 우선순위 | 영역 | 문제 | 권장 조치 |
| --- | --- | --- | --- |
| 높음 | 보안/인가 | 다수의 API가 `permitAll`로 열려 있음 | 공개 API와 인증 필요 API를 명확히 분리 |
| 높음 | 인증 | 글 작성 등에서 path의 `userId`를 신뢰 | JWT 인증 주체에서 사용자 ID 추출 |
| 높음 | DB | `ddl-auto: update` 사용 | Flyway 또는 Liquibase 도입 |
| 높음 | 운영 설정 | `show-sql: true` 활성화 | 운영 환경에서는 비활성화하고 로깅 레벨 분리 |
| 중간 | 검증 | DTO 입력 검증 부족 | `@Valid`, `@NotBlank`, `@Email`, `@Size` 적용 |
| 중간 | 성능 | 게시글 목록이 `findAll().stream()` 기반 | 페이지네이션, 정렬, 조건 쿼리 적용 |
| 중간 | 의존성 | 중복/혼재된 Gradle 의존성 | 버전 정리 및 중복 제거 |
| 중간 | 프론트 상태 | 전역 Context에 여러 도메인 상태 집중 | 인증/채팅/게시글/일정 상태 분리 |
| 중간 | 테스트 | 백엔드/프론트 테스트 거의 없음 | 서비스/컨트롤러/API 클라이언트 테스트 추가 |
| 낮음 | 타입 안정성 | `allowJs`, `skipLibCheck` 사용 | 점진적으로 비활성화 검토 |

## 백엔드 보완 사항

### 1. 인증/인가 경계 재정리

현재 `SecurityConfig.java`에서 여러 API가 `permitAll`로 열려 있습니다.

예시:

```java
.requestMatchers(
    "/api/boards/**",
    "/api/calendar/**",
    "/api/study/**",
    "/api/likes/**",
    "/api/comments/**",
    "/api/chat/**",
    "/api/todos/**",
    "/api/user-certificates/**",
    "/api/certificates/**",
    "/api/users/**",
    "/ws-stomp/**",
    "/rooms/**",
    "/api/reports/inquiries"
).permitAll()
```

이 설정은 조회 API까지는 허용 가능하지만, 생성/수정/삭제 API까지 함께 열릴 수 있어 위험합니다.

권장 방향:

- 게시글/댓글/좋아요/일정/채팅/마이페이지/알림은 기본적으로 인증 필요 API로 분류합니다.
- 공개 조회가 필요한 API만 명시적으로 `permitAll` 처리합니다.
- 관리자 API는 `hasRole("ADMIN")` 또는 `hasAuthority(...)` 기반으로 제한합니다.
- HTTP 메서드별로 권한을 분리합니다. 예를 들어 `GET /api/boards/**`는 공개, `POST/PATCH/DELETE /api/boards/**`는 인증 필요로 나눕니다.

### 2. path userId 신뢰 제거

현재 게시글 작성 API는 다음처럼 path에서 `userId`를 받습니다.

```java
@PostMapping("/{userId}")
public ResponseEntity<FreeBoardResponse> addFreeBoard(
    @PathVariable Long userId,
    @RequestBody FreeBoardRequest request
)
```

이 방식은 클라이언트가 임의의 사용자 ID를 넣을 수 있으므로 실무 기준으로는 안전하지 않습니다.

권장 방향:

- 요청 path에서 `userId`를 받지 않습니다.
- `@AuthenticationPrincipal` 또는 SecurityContext에서 현재 로그인 사용자를 가져옵니다.
- 서비스 계층에는 인증된 사용자 ID만 전달합니다.

예시 방향:

```java
@PostMapping
public ResponseEntity<FreeBoardResponse> addFreeBoard(
    @AuthenticationPrincipal CustomJwtPrincipal principal,
    @Valid @RequestBody FreeBoardRequest request
) {
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(freeBoardService.createFreeBoard(principal.userId(), request));
}
```

### 3. DB 마이그레이션 체계 도입

현재 `application.yaml`에 다음 설정이 있습니다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

`ddl-auto: update`는 개발 초기에는 편하지만 운영 환경에서는 의도하지 않은 스키마 변경, 누락된 제약조건, 재현 불가능한 DB 상태를 만들 수 있습니다.

권장 방향:

- 운영/스테이징에서는 `ddl-auto: validate` 또는 `none`을 사용합니다.
- Flyway 또는 Liquibase를 도입합니다.
- 현재 `src/main/resources/db/manual`에 있는 수동 SQL들을 정식 migration 파일로 전환합니다.
- 환경별 설정을 분리합니다.

예시:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
```

### 4. DTO 입력 검증 추가

현재 `UserSignupRequest`, `FreeBoardRequest` 등 주요 요청 DTO에 검증 어노테이션이 부족합니다.

권장 방향:

- 컨트롤러 요청 파라미터에 `@Valid`를 붙입니다.
- DTO 필드에 `@NotBlank`, `@Email`, `@Size`, `@Pattern` 등을 적용합니다.
- 검증 실패 응답을 `GlobalExceptionHandler`에서 일관된 형식으로 반환합니다.

예시:

```java
public record FreeBoardRequest(
    @NotBlank(message = "제목을 입력해 주세요.")
    @Size(max = 100, message = "제목은 100자 이하로 입력해 주세요.")
    String title,

    @NotBlank(message = "내용을 입력해 주세요.")
    @Size(max = 5000, message = "내용은 5000자 이하로 입력해 주세요.")
    String content
) {}
```

### 5. 예외 처리 표준화

현재 서비스 계층에서 `RuntimeException` 또는 `IllegalArgumentException`을 직접 던지는 코드가 많습니다.

문제점:

- 404, 403, 409 등 HTTP 상태 구분이 흐려집니다.
- 프론트엔드가 에러를 안정적으로 처리하기 어렵습니다.
- 운영 로그에서 원인 파악이 어려워집니다.

권장 방향:

- `BusinessException` 같은 커스텀 예외와 `ErrorCode` enum을 도입합니다.
- 리소스 없음은 404, 권한 없음은 403, 중복은 409 등으로 분리합니다.
- `GlobalExceptionHandler`에서 모든 예외 응답 형식을 통일합니다.

### 6. 게시글 목록 성능 개선

현재 자유게시판 목록 조회는 `findAll().stream()` 기반입니다.

```java
return freeBoardRepository.findAll().stream()
    .filter(board -> board.getStatus() == null || board.getStatus() == FreeBoard.Status.VISIBLE)
    .map(...)
    .toList();
```

데이터가 많아지면 전체 테이블을 메모리에 올린 뒤 필터링하므로 성능 문제가 발생합니다.

권장 방향:

- `Pageable` 기반 페이지네이션을 도입합니다.
- `status = VISIBLE` 조건을 DB 쿼리로 이동합니다.
- 최신순, 인기순 등 정렬 기준을 명시합니다.
- 댓글 수, 좋아요 수가 필요한 경우 N+1 문제가 없는지 확인합니다.

예시 방향:

```java
Page<FreeBoard> findByStatusOrderByCreatedAtDesc(FreeBoard.Status status, Pageable pageable);
```

### 7. Gradle 의존성 정리

`build.gradle`에 중복 의존성과 버전 혼재가 있습니다.

확인된 예:

- `spring-boot-starter-validation` 중복 선언
- `spring-boot-starter-oauth2-client` 중복 선언
- `springdoc-openapi-starter-webmvc-ui`가 `3.0.2`, `2.3.0` 두 버전으로 선언
- Jackson core/databind 직접 버전 지정

권장 방향:

- Spring Boot BOM이 관리하는 버전은 직접 지정하지 않습니다.
- springdoc은 Spring Boot 버전에 맞는 하나의 버전만 사용합니다.
- 사용하지 않는 의존성은 제거합니다.
- 깨진 주석과 인코딩이 깨진 문자열을 정리합니다.

### 8. 관리자 계정 초기화 방식 점검

현재 기본 관리자 계정 정보가 설정과 프론트 UI에 노출되어 있습니다.

예:

```yaml
app:
  admin:
    email: ${ADMIN_EMAIL:admin@highpass.local}
    password: ${ADMIN_PASSWORD:Admin1234!}
```

권장 방향:

- 운영 환경에서는 기본 관리자 비밀번호 fallback을 제거합니다.
- 관리자 계정 생성은 초기 배포 스크립트 또는 별도 운영 절차로 분리합니다.
- 프론트 로그인 화면에 관리자 계정 정보를 노출하지 않습니다.

## 프론트엔드 보완 사항

### 1. 전역 Context 분리

현재 `AppContext.tsx`는 인증, 일정, 할 일, 채팅, 게시글 작성 모달, 장소 검색 상태까지 모두 관리합니다.

문제점:

- 상태 변경 시 불필요한 리렌더링이 커질 수 있습니다.
- 도메인 간 결합도가 높아집니다.
- 기능 추가 시 Context가 계속 비대해집니다.

권장 방향:

- `AuthProvider`, `ChatProvider`, `CalendarProvider`, `PostComposerProvider` 등으로 분리합니다.
- 서버 상태는 React Query, SWR 같은 서버 상태 관리 도구 도입을 검토합니다.
- UI 모달 상태와 서버 데이터 상태를 분리합니다.

### 2. API 타입 안정성 강화

현재 프론트 API 매핑 코드에서 `unknown`, fallback, `Date.now()` 기반 임시 ID 처리 등이 많이 보입니다.

문제점:

- 백엔드 응답 변경을 컴파일 타임에 잡기 어렵습니다.
- 실제 API 오류가 조용히 기본값으로 덮일 수 있습니다.
- 임시 ID가 실제 데이터처럼 섞일 수 있습니다.

권장 방향:

- 백엔드 DTO와 프론트 타입을 명확히 맞춥니다.
- OpenAPI 기반 타입 생성 도입을 검토합니다.
- 응답 파싱 실패 시 기본값으로 덮기보다 명시적으로 에러를 처리합니다.

### 3. 환경 변수 검증

현재 설정은 다음처럼 non-null assertion을 사용합니다.

```ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
export const BACKEND_ORIGIN = new URL(API_BASE_URL).origin;
```

환경 변수가 없거나 잘못된 URL이면 앱 초기화 시점에 바로 실패할 수 있습니다.

권장 방향:

- 환경 변수 검증 함수를 추가합니다.
- 개발/운영 환경별 `.env.example`을 제공합니다.
- 잘못된 설정일 때 명확한 에러 메시지를 출력합니다.

### 4. TypeScript 설정 개선

현재 `tsconfig.json`에 다음 설정이 있습니다.

```json
"allowJs": true,
"skipLibCheck": true,
"strict": true
```

`strict`는 좋지만, `allowJs`와 `skipLibCheck`는 타입 안정성을 낮출 수 있습니다.

권장 방향:

- JS 파일이 없다면 `allowJs: false`로 변경합니다.
- 의존성 타입 문제가 정리되면 `skipLibCheck: false`를 검토합니다.
- API 응답 타입, 폼 타입, 도메인 모델 타입을 더 엄격히 관리합니다.

### 5. 로그인 화면의 관리자 계정 노출 제거

현재 로그인 화면에 관리자 계정 정보가 노출됩니다.

권장 방향:

- 개발 환경에서만 보이게 조건 처리하거나 완전히 제거합니다.
- 운영 배포 시 관리자 계정 안내 UI가 포함되지 않도록 합니다.

## 테스트 및 검증 보완 사항

### 1. 백엔드 테스트 추가

현재 백엔드 테스트 파일은 실질적인 테스트가 거의 없는 상태입니다.

권장 테스트:

- `AuthService` 회원가입/로그인/중복 이메일/비밀번호 불일치 테스트
- 게시글 생성/수정/삭제 권한 테스트
- SecurityConfig 인증 필요 API 테스트
- Repository 쿼리 테스트
- GlobalExceptionHandler 응답 형식 테스트

### 2. 프론트엔드 테스트 추가

현재 프론트엔드 테스트 러너 구성이 보이지 않습니다.

권장 테스트:

- 로그인/회원가입 폼 검증 테스트
- API 클라이언트 에러 처리 테스트
- 주요 페이지 렌더링 테스트
- 게시글 작성 모달 테스트
- 인증 만료 시 상태 초기화 테스트

권장 도구:

- Vitest
- React Testing Library
- MSW
- Playwright

### 3. CI 구성

권장 CI 단계:

```text
backend:
  - ./gradlew test
  - ./gradlew build

frontend:
  - npm ci
  - npm run lint
  - npm run build
  - npm test
```

현재 로컬 검증 시 확인된 환경 문제:

- 백엔드 테스트 실행 실패: `JAVA_HOME` 미설정
- 프론트 lint 실행 실패: `node_modules` 미설치 또는 `eslint` 실행 불가
- PowerShell에서는 `npm.ps1` 실행 정책 문제가 있어 `npm.cmd` 사용 필요

## 권장 개선 순서

1. `SecurityConfig`에서 공개 API와 인증 API를 분리합니다.
2. 게시글/댓글/좋아요/일정/채팅 생성·수정·삭제 API에서 path userId 신뢰를 제거합니다.
3. `ddl-auto: update`를 제거하고 Flyway 또는 Liquibase를 도입합니다.
4. DTO 검증과 전역 예외 응답 포맷을 정리합니다.
5. 게시글/댓글/알림 목록에 페이지네이션을 적용합니다.
6. Gradle 의존성 중복과 버전 혼재를 정리합니다.
7. 로그인 화면의 관리자 계정 노출을 제거합니다.
8. `AppContext`를 도메인별 Provider로 분리합니다.
9. 백엔드 서비스/컨트롤러 테스트와 프론트 핵심 컴포넌트 테스트를 추가합니다.
10. CI에서 lint, test, build를 자동 실행하도록 구성합니다.

## 단기 목표

가장 먼저 처리할 현실적인 범위는 다음 3가지입니다.

1. 보안 설정 정리
   - `GET` 공개 API와 `POST/PATCH/DELETE` 인증 API 분리
   - 관리자 API 권한 제한

2. 사용자 식별 방식 개선
   - path의 `userId` 제거
   - JWT principal 기반 사용자 식별

3. DB 변경 관리 개선
   - Flyway 도입
   - 기존 manual SQL migration 전환
   - 운영 환경 `ddl-auto: validate` 적용

이 3가지만 먼저 정리해도 실무 안정성은 크게 올라갑니다.
