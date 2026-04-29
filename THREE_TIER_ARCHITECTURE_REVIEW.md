# 3계층 아키텍처 구조 점검

작성일: 2026-04-29

## 총평

현재 백엔드는 `Controller`, `Service`, `Repository` 계층이 물리적으로 분리되어 있습니다. 패키지 구조도 `controller`, `service`, `repository`, `entity`, `dto`, `config`로 나뉘어 있어 3계층 아키텍처의 기본 형태는 갖추고 있습니다.

다만 실무적인 3계층 아키텍처 관점에서는 책임 경계가 아직 불명확한 부분이 있습니다. 특히 사용자 식별 방식이 도메인마다 다르고, 일부 Controller가 path의 `userId`를 신뢰하며, Service 계층에 여러 도메인 책임이 섞여 있습니다. Repository도 DB 조건 처리보다 `findAll().stream()` 이후 Java 코드에서 필터링하는 패턴이 있어 데이터가 많아질수록 성능과 유지보수성이 떨어질 수 있습니다.

결론적으로 현재 구조는 "3계층 폴더 구조는 갖췄지만, 계층별 책임이 완전히 안정화되지는 않은 상태"로 보는 것이 정확합니다.

## 현재 구조의 장점

- 프론트엔드와 백엔드가 별도 프로젝트로 분리되어 있습니다.
- 백엔드는 Controller, Service, Repository, Entity, DTO 패키지가 구분되어 있습니다.
- 대부분의 요청은 Controller에서 받고 Service로 위임하는 흐름을 따릅니다.
- Repository는 Spring Data JPA 기반으로 분리되어 있어 DB 접근 경계는 존재합니다.
- DTO 응답 객체의 `from(...)` 정적 팩토리 메서드를 통해 Entity를 응답 형태로 변환하려는 패턴이 있습니다.
- 일부 API는 `@AuthenticationPrincipal`을 사용해 인증 사용자 정보를 활용하고 있습니다.

## 핵심 문제 요약

| 영역 | 문제 | 영향 | 개선 방향 |
| --- | --- | --- | --- |
| Controller | path의 `userId`를 신뢰 | 권한 우회 가능성, API 사용성 저하 | `@AuthenticationPrincipal` 기준으로 통일 |
| Controller | Entity를 `@RequestBody`로 직접 수신 | Entity 변경이 API 스펙에 직접 노출 | Request DTO 도입 |
| Service | 여러 도메인 책임이 한 Service에 섞임 | 결합도 증가, 테스트 어려움 | 도메인 Service 또는 Facade 분리 |
| Service | Free/Study 게시판 로직 중복 | 유지보수 비용 증가 | 공통 게시판 정책 분리 |
| Repository | `findAll().stream()` 후 필터링 | 성능 저하, 페이징 어려움 | Repository 쿼리와 Pageable 사용 |
| Exception | `RuntimeException` 직접 사용 | HTTP 상태와 에러 응답 불명확 | 커스텀 예외와 ErrorCode 도입 |
| DTO | 요청 검증 부족 | 잘못된 데이터 유입 가능성 | `@Valid`, Bean Validation 적용 |
| Frontend API | client/server API mapper 중복 | 타입 불일치, 수정 비용 증가 | 공통 mapper 분리 |

## Controller 계층 점검

### 1. 사용자 식별 방식이 일관되지 않음

일부 Controller는 인증 주체를 사용합니다.

예시:

```java
@GetMapping("/me")
public ResponseEntity<UserResponse> getCurrentUser(
        @AuthenticationPrincipal CustomJwtPrincipal principal
) {
    return ResponseEntity.ok(userService.getUserById(principal.getUserId()));
}
```

반면 다른 Controller는 URL path의 `userId`를 그대로 받습니다.

예시:

```java
@PostMapping("/{userId}")
public ResponseEntity<StudyBoardDetailResponse> addStudy(
        @PathVariable Long userId,
        @RequestBody StudyBoardCreateRequest request
) {
    StudyBoardDetailResponse response = studyBoardService.createStudy(userId, request);
    return new ResponseEntity<>(response, HttpStatus.CREATED);
}
```

이 방식은 클라이언트가 임의의 `userId`를 넣을 수 있어 보안상 위험합니다. 또한 프론트엔드가 매번 사용자 ID를 알고 있어야 하므로 API 사용성도 떨어집니다.

권장 방향:

- 로그인 사용자 기준 API는 path에서 `userId`를 받지 않습니다.
- Controller에서 `@AuthenticationPrincipal`로 현재 사용자 ID를 가져옵니다.
- Service에는 검증된 사용자 ID만 전달합니다.

권장 형태:

```java
@PostMapping
public ResponseEntity<StudyBoardDetailResponse> addStudy(
        @AuthenticationPrincipal CustomJwtPrincipal principal,
        @Valid @RequestBody StudyBoardCreateRequest request
) {
    StudyBoardDetailResponse response = studyBoardService.createStudy(principal.getUserId(), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

적용 우선 대상:

- `FreeBoardController`
- `StudyBoardController`
- `CalendarController`
- `TodoListController`
- `NotificationController`
- `UserCertificateController`
- `UserController`의 수정/비밀번호/검증 API

### 2. Controller가 Entity를 직접 요청으로 받음

`CalendarController`는 `Calendar` Entity를 직접 `@RequestBody`로 받고 있습니다.

```java
@PostMapping("/{userId}")
public ResponseEntity<CalendarResponse> create(
        @PathVariable Long userId,
        @RequestBody Calendar request
) {
    CalendarResponse response = calendarService.createCalendar(userId, request);
    return new ResponseEntity<>(response, HttpStatus.CREATED);
}
```

문제점:

- Entity 필드가 API 스펙으로 노출됩니다.
- 클라이언트가 수정하면 안 되는 필드까지 요청으로 들어올 수 있습니다.
- Entity 변경이 곧 API 변경으로 이어집니다.
- 검증 규칙을 요청 단위로 관리하기 어렵습니다.

권장 방향:

- `CalendarCreateRequest`, `CalendarUpdateRequest`를 별도로 만듭니다.
- Controller는 DTO만 받고 Entity 생성은 Service 또는 Mapper에서 처리합니다.

권장 형태:

```java
public record CalendarCreateRequest(
        @NotBlank String title,
        String content,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        String startTime,
        String endTime,
        String kind
) {}
```

## Service 계층 점검

### 1. Service가 여러 도메인 책임을 직접 가짐

`StudyBoardService`는 스터디 게시글 생성뿐 아니라 채팅방 생성까지 직접 처리합니다.

현재 흐름:

```java
if (request.createChatRoom()) {
    ChatRoom chatRoom = ChatRoom.builder()
            .name(request.title())
            .ownerId(userId)
            .isApprovalRequired(true)
            .type(ChatRoom.ChatType.GROUP)
            .build();
    savedChatRoom = chatRoomRepository.save(chatRoom);
    chatRoom.addParticipant(user, true);
    savedStudy.setChatRoom(savedChatRoom);
}
```

도메인 흐름상 스터디 생성 시 채팅방이 함께 생길 수는 있습니다. 하지만 `StudyBoardService`가 `ChatRoomRepository`를 직접 알고 있으면 게시판 도메인과 채팅 도메인이 강하게 결합됩니다.

권장 방향:

- 채팅방 생성 책임은 `ChatRoomService` 또는 `StudyChatService`로 분리합니다.
- 스터디 생성과 채팅방 생성이 하나의 유스케이스라면 `StudyBoardFacade` 또는 `StudyCreationService`를 둘 수 있습니다.

권장 구조:

```text
StudyBoardController
  -> StudyBoardFacade
      -> StudyBoardService
      -> ChatRoomService
```

이렇게 하면 게시글 저장 로직과 채팅방 생성 로직을 각각 독립적으로 테스트할 수 있습니다.

### 2. FreeBoardService와 StudyBoardService의 중복

자유게시판과 스터디게시판 Service에는 비슷한 로직이 반복됩니다.

중복되는 패턴:

- 사용자 조회
- 게시글 생성
- 목록 조회
- `VISIBLE` 상태 필터링
- 좋아요 여부 계산
- 게시글 상세 조회 시 조회수 증가
- 댓글 삭제
- 좋아요 삭제
- 게시글 삭제

예시:

```java
return freeBoardRepository.findAll().stream()
        .filter(board -> board.getStatus() == null || board.getStatus() == FreeBoard.Status.VISIBLE)
        .map(board -> FreeBoardResponse.from(board, isLikedByUser(currentUserId, board.getId())))
        .toList();
```

```java
return studyBoardRepository.findAll().stream()
        .filter(study -> study.getStatus() == null || study.getStatus() == StudyBoard.Status.VISIBLE)
        .map(study -> StudyBoardListResponse.from(study, isLikedByUser(currentUserId, study.getId())))
        .toList();
```

권장 방향:

- 좋아요 여부 조회는 `BoardLikeService` 또는 `BoardInteractionService`로 분리합니다.
- 댓글/좋아요 삭제 같은 부가 정리 작업은 공통 정책으로 분리합니다.
- Free/Study를 완전히 통합할 필요는 없지만, 공통 로직은 별도 컴포넌트로 이동하는 것이 좋습니다.

예시:

```java
@Service
public class BoardInteractionService {
    public boolean isLikedByUser(Long userId, BoardLike.TargetType targetType, Long targetId) {
        if (userId == null) return false;
        return boardLikeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);
    }

    public void deleteInteractions(BoardLike.TargetType targetType, Comment.TargetType commentType, Long targetId) {
        commentRepository.deleteByTargetTypeAndTargetId(commentType, targetId);
        boardLikeRepository.deleteByTargetTypeAndTargetId(targetType, targetId);
    }
}
```

### 3. RuntimeException 직접 사용

여러 Service에서 `RuntimeException`을 직접 던지고 있습니다.

문제점:

- 존재하지 않는 리소스, 권한 없음, 중복, 검증 실패가 모두 500 또는 모호한 응답으로 처리될 수 있습니다.
- 프론트엔드에서 에러를 안정적으로 구분하기 어렵습니다.
- 테스트에서 기대 상태 코드를 명확히 검증하기 어렵습니다.

권장 방향:

- `BusinessException`과 `ErrorCode`를 도입합니다.
- 예외 상황별 HTTP 상태를 명확히 매핑합니다.

예시:

```java
throw new BusinessException(ErrorCode.BOARD_NOT_FOUND);
throw new BusinessException(ErrorCode.FORBIDDEN_BOARD_ACCESS);
throw new BusinessException(ErrorCode.DUPLICATED_NICKNAME);
```

## Repository 계층 점검

### 1. findAll 후 Java 필터링

현재 일부 목록 조회가 `findAll().stream()` 패턴을 사용합니다.

문제점:

- 전체 데이터를 메모리에 로드합니다.
- DB 인덱스를 활용한 필터링이 어렵습니다.
- 페이지네이션 적용이 어렵습니다.
- 데이터가 늘수록 응답 시간이 급격히 증가합니다.

권장 방향:

- Repository 메서드에서 조건을 처리합니다.
- `Pageable`을 도입합니다.
- 정렬 기준을 명시합니다.

예시:

```java
Page<FreeBoard> findByStatusOrderByCreatedAtDesc(FreeBoard.Status status, Pageable pageable);
Page<StudyBoard> findByStatusOrderByCreatedAtDesc(StudyBoard.Status status, Pageable pageable);
```

Service 예시:

```java
@Transactional(readOnly = true)
public Page<FreeBoardResponse> getFreeBoardList(Long currentUserId, Pageable pageable) {
    return freeBoardRepository
            .findByStatusOrderByCreatedAtDesc(FreeBoard.Status.VISIBLE, pageable)
            .map(board -> FreeBoardResponse.from(
                    board,
                    boardInteractionService.isLikedByUser(currentUserId, BoardLike.TargetType.FREE, board.getId())
            ));
}
```

### 2. 삭제 전 존재 확인 부족

일부 삭제 로직은 `deleteById`를 바로 호출합니다.

```java
calendarRepository.deleteById(calendarId);
```

권장 방향:

- 삭제 대상 존재 여부를 확인합니다.
- 현재 사용자가 삭제 권한을 갖는지 확인합니다.
- 존재하지 않으면 404, 권한이 없으면 403을 반환합니다.

## DTO와 Mapper 구조

### 1. Response DTO 변환 위치

현재 `Response.from(entity)` 패턴이 많이 사용됩니다. 이 방식은 간단하고 읽기 쉽지만, 응답 조합이 복잡해질수록 DTO가 Entity 내부 구조에 강하게 의존할 수 있습니다.

현재 방식의 장점:

- 구현이 빠릅니다.
- 별도 Mapper 클래스가 없어 코드량이 적습니다.
- 단순 CRUD 응답에는 충분합니다.

현재 방식의 단점:

- DTO가 Entity 구조를 많이 알게 됩니다.
- 여러 Entity를 조합하는 응답에서 `from(...)` 파라미터가 늘어납니다.
- 같은 매핑이 여러 DTO에 반복될 수 있습니다.

권장 방향:

- 단순 응답은 `Response.from(...)` 유지해도 됩니다.
- 복잡한 응답 조합은 별도 Mapper 또는 Assembler로 분리합니다.

예시:

```text
dto/
  board/
    StudyBoardDetailResponse.java

mapper/
  board/
    StudyBoardResponseMapper.java
```

### 2. Request DTO 검증 부족

요청 DTO에 Bean Validation이 부족합니다.

권장 방향:

- Controller의 `@RequestBody` 앞에 `@Valid`를 붙입니다.
- Request DTO에 검증 어노테이션을 추가합니다.
- `MethodArgumentNotValidException`을 전역 예외 처리합니다.

## 프론트엔드 API 계층 중복

프론트엔드에서도 계층 중복이 보입니다.

대표적으로 다음 파일들이 비슷한 매핑 로직을 가집니다.

- `src/features/free-board/api/boards.ts`
- `src/features/free-board/api/boards-server.ts`

중복되는 요소:

- `BoardApiRecord` 타입
- `safeString`
- `safeNumber`
- `safeComments`
- `mapApiRecordToBoardPost`
- `unwrapData`

문제점:

- 백엔드 응답 필드가 바뀌면 두 파일을 모두 수정해야 합니다.
- client/server API 응답 처리 방식이 조금씩 달라질 수 있습니다.
- 타입 불일치가 발생해도 늦게 발견됩니다.

권장 방향:

- fetch 방식만 client/server로 분리합니다.
- 응답 타입과 mapper는 공통 파일로 분리합니다.

권장 구조:

```text
src/features/free-board/api/
  board-client.ts
  board-server.ts
  board-mapper.ts
  board-types.ts
```

또는:

```text
src/features/free-board/api/
  boards.ts
  boards-server.ts
  mapper.ts
```

## 권장 3계층 기준

### Controller

Controller는 다음 책임만 가집니다.

- HTTP 요청을 받습니다.
- 인증 주체를 확인합니다.
- Request DTO를 검증합니다.
- Service를 호출합니다.
- 적절한 HTTP 상태 코드로 응답합니다.

Controller가 하지 말아야 할 일:

- Entity 직접 조립
- Repository 직접 접근
- 비즈니스 규칙 판단
- path userId 신뢰
- 복잡한 응답 조합

### Service

Service는 다음 책임을 가집니다.

- 유스케이스 흐름을 처리합니다.
- 트랜잭션 경계를 가집니다.
- 도메인 규칙을 검증합니다.
- Repository를 사용해 Entity를 조회/저장합니다.
- 필요한 경우 다른 도메인 Service와 협력합니다.

Service가 조심해야 할 일:

- 다른 도메인의 Repository를 직접 과도하게 참조하지 않습니다.
- 너무 많은 책임을 한 Service에 몰지 않습니다.
- 예외를 `RuntimeException`으로 뭉뚱그리지 않습니다.

### Repository

Repository는 다음 책임을 가집니다.

- DB 접근을 담당합니다.
- 조건 조회, 페이징, 정렬을 DB 쿼리로 처리합니다.
- Entity 저장/수정/삭제를 담당합니다.

Repository가 피해야 할 일:

- 모든 데이터를 `findAll()`로 가져온 뒤 Service에서 필터링하게 만드는 것
- 비즈니스 로직을 쿼리 메서드 이름에 과도하게 밀어 넣는 것
- 인덱스와 페이징을 고려하지 않은 목록 조회

## 개선 우선순위

1. path `userId`를 제거하고 `@AuthenticationPrincipal` 기준으로 통일합니다.
2. Entity를 직접 `@RequestBody`로 받는 API를 Request DTO 기반으로 변경합니다.
3. Free/Study 게시판의 공통 로직을 `BoardInteractionService` 등으로 분리합니다.
4. `findAll().stream()` 목록 조회를 Repository 쿼리와 `Pageable`로 변경합니다.
5. `RuntimeException` 대신 `BusinessException`과 `ErrorCode`를 도입합니다.
6. `StudyBoardService`의 채팅방 생성 책임을 별도 Service 또는 Facade로 분리합니다.
7. 프론트엔드 API mapper 중복을 공통 mapper로 분리합니다.
8. Controller 요청 DTO에 `@Valid`와 Bean Validation을 적용합니다.

## 단기 리팩터링 추천 범위

가장 먼저 손대기 좋은 범위는 게시판 도메인입니다.

추천 작업:

1. `FreeBoardController`, `StudyBoardController`에서 path `userId` 제거
2. `@AuthenticationPrincipal CustomJwtPrincipal principal` 적용
3. `FreeBoardService`, `StudyBoardService`의 `isLikedByUser` 중복 제거
4. 댓글/좋아요 삭제 공통 로직 분리
5. 목록 조회에 `Pageable` 적용
6. 게시글 생성/수정 Request DTO에 검증 추가

게시판 도메인을 먼저 정리하면 다른 도메인에도 같은 패턴을 적용하기 쉬워집니다.

## 최종 판단

현재 구조는 학습용 또는 팀 프로젝트 초기 구현으로는 충분히 이해 가능한 구조입니다. 하지만 실무 운영 기준에서는 계층이 단순히 나뉘어 있는 것만으로는 부족합니다.

핵심은 다음입니다.

- Controller는 인증과 HTTP 경계만 담당해야 합니다.
- Service는 유스케이스와 트랜잭션을 담당해야 합니다.
- Repository는 DB 조건 조회와 영속성을 담당해야 합니다.
- 사용자 식별, 예외 처리, DTO 검증, 페이징은 모든 도메인에 일관되게 적용되어야 합니다.

현재는 이 기준이 도메인마다 다르게 적용되어 있어 사용성과 유지보수성이 떨어질 수 있습니다. 지금 단계에서 기준을 통일하면 이후 기능 추가 비용을 크게 줄일 수 있습니다.
