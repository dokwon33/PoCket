# review-service — PoCket 상호 평가 서비스

호스트(테스트베드 제공자)와 스타트업(실증 신청자)이 **확정된 실증 건에 대해 서로 평가**하고,
그 결과를 **다음 매칭의 신뢰 근거(평판)** 로 제공하는 신규 마이크로서비스.

- 포트: `8090`
- 스택: FastAPI · SQLAlchemy(async) · aiomysql · Eureka · JWT(RS256)
- **기존 5개 서비스와 인프라는 수정하지 않는다.** 참여자 검증은 기존 공개 엔드포인트 REST 호출로만 수행한다.

## 도메인 치환

| 템플릿 (제공)   | PoCket (우리 서비스)        |
|-----------------|-----------------------------|
| 강사 / 수강생   | 테스트베드 호스트 / 스타트업 |
| 과목 (course)   | 실증 슬롯                   |
| 수강신청 (enrollment) | 실증 신청             |
| (없음)          | **상호 평가 (review)**      |

`reviewer_role` 값 `HOST` = 강사 자리, `STARTUP` = 수강생 자리.

## 아키텍처상의 위치

게이트웨이를 경유하지 않고 브라우저가 직접 호출하는 **확장 서비스**다.
따라서 `X-User-Id` 헤더를 받을 수 없어, 토큰을 이 서비스가 직접 검증하고
게이트웨이와 동일한 `user_id` 클레임에서 사용자 ID를 꺼낸다.
(`JWT_USER_ID_CLAIM` 으로 변경 가능, `userId` 로 폴백)

CORS 도 이 서비스가 직접 허용한다 (`http://localhost:3000`, `http://localhost:5173`).

## 데이터

`reviews` 테이블 **하나만** 소유한다. 다른 서비스의 테이블은 읽지도 쓰지도 않는다.

- 스키마: [`init-db/02_review_init.sql`](../init-db/02_review_init.sql) — 신규 DB의 원본
- 기동 시 `create_all` 로 테이블이 없으면 만든다 (기존 DB에 붙일 때의 안전장치)
- 두 경로는 컬럼/인덱스가 같지만, `CHECK` 제약과 `ON UPDATE CURRENT_TIMESTAMP` 는
  SQL 파일에만 있다. 평점 범위와 자기평가 금지는 애플리케이션에서도 검증하므로
  동작 차이는 없다. **볼륨을 새로 만들어 SQL 파일로 생성하는 쪽을 권장한다.**

FK 는 걸지 않는다 — 서비스별 테이블 소유 원칙을 지키기 위함이며,
참여자 유효성은 enrollment/course 서비스 호출로 확인한다.

## 평가 규칙

1. 확정(`ACTIVE`)된 실증 건만 평가할 수 있다.
2. 그 실증 건의 당사자만 평가할 수 있다.
3. 한 실증 건당 각자 1회 (`uq_enrollment_reviewer`).
4. 자기 자신은 평가할 수 없다.
5. 평점은 1~5.

### 당사자 판별 (기존 백엔드 수정 0줄)

| 평가 주체 | 확인 방법 |
|-----------|-----------|
| 스타트업 → 호스트 | `GET /api/enrollments/user/{reviewerId}` 에 해당 `enrollmentId` 존재 → 평가 대상은 `GET /api/courses/internal/{courseId}` 의 `instructorId` 로 자동 결정 |
| 호스트 → 스타트업 | `revieweeId` 필수. `GET /api/enrollments/user/{revieweeId}` 에 해당 `enrollmentId` 존재 + 그 슬롯의 `instructorId` 가 요청자 본인 |

## API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST   | `/api/reviews` | 필요 | 평가 등록 |
| PUT    | `/api/reviews/{reviewId}` | 필요 | 본인 평가 수정 |
| DELETE | `/api/reviews/{reviewId}` | 필요 | 본인 평가 삭제 |
| GET    | `/api/reviews/me/pending` | 필요 | 내가 아직 남기지 않은 확정 실증 건 |
| GET    | `/api/reviews/me/written` | 필요 | 내가 작성한 평가 |
| GET    | `/api/reviews/user/{userId}` | 공개 | 해당 사용자가 받은 평가 |
| GET    | `/api/reviews/user/{userId}/reputation` | 공개 | 평판 요약 (건수·평균·분포) |
| GET    | `/api/reviews/enrollment/{enrollmentId}` | 공개 | 해당 실증 건의 양방향 평가 |
| GET    | `/health` | 공개 | 헬스 체크 |

Swagger: <http://localhost:8090/docs>

### 등록 요청

```json
{ "enrollmentId": 1, "revieweeId": 2, "rating": 5, "comment": "..." }
```

`revieweeId` 는 **호스트가 평가할 때만 필수**다.

## 실행

```bash
# 전체 스택 (이미지 기반)
docker compose up -d

# 이 서비스만 다시 빌드
docker compose -f docker-compose.build.yml build review-service
docker compose up -d review-service

# 로컬 직접 실행 (.env 사용, DB는 compose가 노출한 3379 포트)
cd review-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8090
```

## 알려진 제약

- `pool_pre_ping` 은 켜지 않는다. aiomysql 어댑터의 `ping()` 시그니처가
  SQLAlchemy 의 pre-ping 호출과 맞지 않아 커넥션 재사용 시 `TypeError` 가 난다.
  대신 `pool_recycle=1800` 으로 커넥션을 재활용한다.
- `me/pending` 은 **스타트업 입장**의 미평가 목록만 돌려준다.
  호스트 입장의 목록은 '슬롯별 신청자 조회' 엔드포인트가 있어야 하는데
  기존 백엔드를 수정하지 않는다는 원칙상 만들지 않았다.
  화면에서는 슬롯 상세의 신청자 목록을 통해 평가를 남기는 흐름으로 처리한다.
