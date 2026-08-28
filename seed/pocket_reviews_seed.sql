-- ═══════════════════════════════════════════════════════════════
--  PoCket 평가 시드
-- ═══════════════════════════════════════════════════════════════
--  화면 개발·시연용 후기 데이터입니다.
--
--  실행 (pocket_seed.sql 을 먼저 넣은 뒤):
--    docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < seed/pocket_reviews_seed.sql
--
--  주의
--   1. 표시용 스타트업 계정 8개(id 20~27)를 함께 넣습니다.
--      password 는 유효한 BCrypt 해시가 아니라 'LOGIN_DISABLED_SEED_ACCOUNT'
--      문자열이며 로그인할 수 없습니다. 화면 표시 전용입니다.
--   2. 평가는 신청(enrollments)을 참조하므로 신청도 함께 만듭니다.
--      신청 id 는 자동 증가라, 평가는 (user_id, course_id) 로 되찾아 연결합니다.
--   3. reviewer_role 은 review-service 규약대로 STARTUP / HOST 입니다.
--   4. 시드 슬롯(호스트 10~19, id 95 이하)만 대상으로 합니다.
--      직접 등록한 슬롯은 건드리지 않습니다.
-- ═══════════════════════════════════════════════════════════════

-- 표시용 스타트업 계정 (이미 있으면 건너뜀)
INSERT IGNORE INTO users (id, email, password, name, role, created_at, updated_at) VALUES
  (20, 'startup.20@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '뉴런로보틱스', 'STUDENT', NOW(), NOW()),
  (21, 'startup.21@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '셀프오더랩', 'STUDENT', NOW(), NOW()),
  (22, 'startup.22@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '스택하우스', 'STUDENT', NOW(), NOW()),
  (23, 'startup.23@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '비전메트릭', 'STUDENT', NOW(), NOW()),
  (24, 'startup.24@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '케어브릿지', 'STUDENT', NOW(), NOW()),
  (25, 'startup.25@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '워크플로우스', 'STUDENT', NOW(), NOW()),
  (26, 'startup.26@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '가디언AI', 'STUDENT', NOW(), NOW()),
  (27, 'startup.27@pocket.test', 'LOGIN_DISABLED_SEED_ACCOUNT', '델타로지스', 'STUDENT', NOW(), NOW());

-- 신청 (평가가 참조할 대상)
INSERT INTO enrollments (user_id, course_id, status, created_at, updated_at)
SELECT v.user_id, v.course_id, 'ACTIVE', NOW(), NOW() FROM (
  SELECT 25 AS user_id, 1 AS course_id
  UNION ALL SELECT 21, 1
  UNION ALL SELECT 22, 1
  UNION ALL SELECT 21, 2
  UNION ALL SELECT 24, 2
  UNION ALL SELECT 26, 2
  UNION ALL SELECT 25, 3
  UNION ALL SELECT 22, 4
  UNION ALL SELECT 27, 6
  UNION ALL SELECT 22, 6
  UNION ALL SELECT 22, 7
  UNION ALL SELECT 26, 7
  UNION ALL SELECT 20, 7
  UNION ALL SELECT 27, 8
  UNION ALL SELECT 22, 8
  UNION ALL SELECT 27, 9
  UNION ALL SELECT 23, 9
  UNION ALL SELECT 25, 9
  UNION ALL SELECT 24, 10
  UNION ALL SELECT 20, 10
  UNION ALL SELECT 23, 12
  UNION ALL SELECT 24, 13
  UNION ALL SELECT 22, 15
  UNION ALL SELECT 22, 19
  UNION ALL SELECT 24, 19
  UNION ALL SELECT 23, 21
  UNION ALL SELECT 27, 22
  UNION ALL SELECT 22, 22
  UNION ALL SELECT 25, 22
  UNION ALL SELECT 25, 26
  UNION ALL SELECT 22, 27
  UNION ALL SELECT 24, 27
  UNION ALL SELECT 21, 28
  UNION ALL SELECT 23, 30
  UNION ALL SELECT 25, 31
  UNION ALL SELECT 22, 31
  UNION ALL SELECT 27, 33
  UNION ALL SELECT 27, 35
  UNION ALL SELECT 25, 35
  UNION ALL SELECT 24, 37
  UNION ALL SELECT 22, 37
  UNION ALL SELECT 25, 37
  UNION ALL SELECT 25, 38
  UNION ALL SELECT 21, 38
  UNION ALL SELECT 27, 38
  UNION ALL SELECT 23, 39
  UNION ALL SELECT 27, 40
  UNION ALL SELECT 25, 41
  UNION ALL SELECT 24, 42
  UNION ALL SELECT 25, 44
  UNION ALL SELECT 27, 44
  UNION ALL SELECT 21, 48
  UNION ALL SELECT 27, 49
  UNION ALL SELECT 27, 50
  UNION ALL SELECT 22, 50
  UNION ALL SELECT 22, 51
  UNION ALL SELECT 21, 51
  UNION ALL SELECT 22, 53
  UNION ALL SELECT 23, 53
  UNION ALL SELECT 25, 55
  UNION ALL SELECT 21, 58
  UNION ALL SELECT 27, 58
  UNION ALL SELECT 22, 58
  UNION ALL SELECT 26, 60
  UNION ALL SELECT 21, 60
  UNION ALL SELECT 27, 60
  UNION ALL SELECT 24, 63
  UNION ALL SELECT 27, 63
  UNION ALL SELECT 27, 64
  UNION ALL SELECT 20, 66
  UNION ALL SELECT 26, 67
  UNION ALL SELECT 23, 67
  UNION ALL SELECT 20, 69
  UNION ALL SELECT 23, 70
  UNION ALL SELECT 27, 70
  UNION ALL SELECT 22, 71
  UNION ALL SELECT 21, 71
  UNION ALL SELECT 20, 72
  UNION ALL SELECT 25, 73
  UNION ALL SELECT 22, 73
  UNION ALL SELECT 27, 74
  UNION ALL SELECT 20, 75
  UNION ALL SELECT 25, 75
  UNION ALL SELECT 21, 75
  UNION ALL SELECT 22, 76
  UNION ALL SELECT 25, 76
  UNION ALL SELECT 20, 77
  UNION ALL SELECT 27, 77
  UNION ALL SELECT 20, 81
  UNION ALL SELECT 21, 82
  UNION ALL SELECT 25, 82
  UNION ALL SELECT 24, 87
  UNION ALL SELECT 23, 89
  UNION ALL SELECT 27, 90
  UNION ALL SELECT 25, 90
  UNION ALL SELECT 20, 91
  UNION ALL SELECT 22, 91
  UNION ALL SELECT 27, 91
  UNION ALL SELECT 20, 94
  UNION ALL SELECT 26, 94
  UNION ALL SELECT 22, 94
  UNION ALL SELECT 21, 95
) AS v
JOIN courses c ON c.id = v.course_id
LEFT JOIN enrollments e ON e.user_id = v.user_id AND e.course_id = v.course_id
WHERE e.id IS NULL;

-- 평가
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 10, 'STARTUP', 3, '공간은 좋았는데 실증 시간대가 예상보다 짧았습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 1
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 1);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 10, 'STARTUP', 5, '매장 직원분들이 실증 취지를 알고 계셔서 손님 응대가 자연스러웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 1
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 1);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 10, 'STARTUP', 5, '매장 직원분들이 실증 취지를 알고 계셔서 손님 응대가 자연스러웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 1
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 1);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 10, 'STARTUP', 5, '주문 데이터 연동을 흔쾌히 허락해 주셔서 검증 범위를 넓힐 수 있었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 2
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 2);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 10, 'STARTUP', 5, '주문 데이터 연동을 흔쾌히 허락해 주셔서 검증 범위를 넓힐 수 있었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 2
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 2);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 10, 'STARTUP', 4, '주문 데이터 연동을 흔쾌히 허락해 주셔서 검증 범위를 넓힐 수 있었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 26 AND e.course_id = 2
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 26 AND r.course_id = 2);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 11, 'STARTUP', 5, 'POS 연동 데이터를 익명화해서 바로 주셔서 분석이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 3
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 3);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 11, 'STARTUP', 4, '주말 방문객 수가 사전 안내와 거의 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 4
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 4);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '파렛트 배치를 실증 조건에 맞춰 다시 잡아 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 6
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 6);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '파렛트 배치를 실증 조건에 맞춰 다시 잡아 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 6
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 6);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 5, '간호 인력분들이 기기 사용법을 빠르게 익혀 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 7
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 7);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 5, '간호 인력분들이 기기 사용법을 빠르게 익혀 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 26 AND e.course_id = 7
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 26 AND r.course_id = 7);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 3, '공간은 좋았는데 실증 시간대가 예상보다 짧았습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 7
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 7);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 5, '환자 동선과 겹치지 않는 시간대를 잡아 주셔서 부담이 적었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 8
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 8);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 4, '간호 인력분들이 기기 사용법을 빠르게 익혀 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 8
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 8);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 5, '입주사 안내 공지를 대신 돌려 주셔서 협조를 얻기 쉬웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 9
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 9);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 4, '공조 제어 권한을 실증 기간 동안 위임해 주셔서 변수 통제가 됐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 9
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 9);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 3, '공간은 좋았는데 실증 시간대가 예상보다 짧았습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 9
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 9);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 15, 'STARTUP', 4, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 10
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 10);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 15, 'STARTUP', 5, '야간 열화상 촬영 조건을 그대로 맞춰 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 10
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 10);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 17, 'STARTUP', 5, '현장 담당자분 응답이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 12
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 12);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 18, 'STARTUP', 5, '매장 직원분들이 실증 취지를 알고 계셔서 손님 응대가 자연스러웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 13
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 13);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '매장 직원분들이 실증 취지를 알고 계셔서 손님 응대가 자연스러웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 15
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 15);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 18, 'STARTUP', 4, '매장 직원분들이 실증 취지를 알고 계셔서 손님 응대가 자연스러웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 19
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 19);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 18, 'STARTUP', 5, '주문 데이터 연동을 흔쾌히 허락해 주셔서 검증 범위를 넓힐 수 있었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 19
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 19);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 18, 'STARTUP', 4, '피크타임 회피 약속이 그대로 지켜졌습니다. 전원과 유선망도 안내대로였어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 21
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 21);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 18, 'STARTUP', 3, '공간은 좋았는데 실증 시간대가 예상보다 짧았습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 22
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 22);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 18, 'STARTUP', 3, '공간은 좋았는데 실증 시간대가 예상보다 짧았습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 22
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 22);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 18, 'STARTUP', 4, '주문 데이터 연동을 흔쾌히 허락해 주셔서 검증 범위를 넓힐 수 있었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 22
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 22);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 11, 'STARTUP', 4, '주말 방문객 수가 사전 안내와 거의 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 26
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 26);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, 'POS 연동 데이터를 익명화해서 바로 주셔서 분석이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 27
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 27);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '주말 방문객 수가 사전 안내와 거의 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 27
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 27);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 11, 'STARTUP', 4, 'POS 연동 데이터를 익명화해서 바로 주셔서 분석이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 28
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 28);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 11, 'STARTUP', 5, '주말 방문객 수가 사전 안내와 거의 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 30
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 30);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 11, 'STARTUP', 4, '진열대 위치를 실증에 맞게 조정해 주셨습니다. 협조가 좋았어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 31
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 31);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 11, 'STARTUP', 4, '진열대 위치를 실증에 맞게 조정해 주셨습니다. 협조가 좋았어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 31
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 31);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '파렛트 배치를 실증 조건에 맞춰 다시 잡아 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 33
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 33);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 4, '야간 시간대 통제가 깔끔했고 안전 관리자도 배치해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 35
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 35);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '통로 폭과 층고가 안내대로였습니다. AGV 주행 시험에 문제없었어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 35
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 35);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 3, '조건은 대체로 맞았지만 담당자 연락이 조금 늦었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 37
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 37);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '야간 시간대 통제가 깔끔했고 안전 관리자도 배치해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 37
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 37);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '야간 시간대 통제가 깔끔했고 안전 관리자도 배치해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 37
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 37);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 4, '통로 폭과 층고가 안내대로였습니다. AGV 주행 시험에 문제없었어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 38
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 38);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '야간 시간대 통제가 깔끔했고 안전 관리자도 배치해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 38
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 38);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 4, '통로 폭과 층고가 안내대로였습니다. AGV 주행 시험에 문제없었어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 38
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 38);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '통로 폭과 층고가 안내대로였습니다. AGV 주행 시험에 문제없었어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 39
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 39);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 4, '통로 폭과 층고가 안내대로였습니다. AGV 주행 시험에 문제없었어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 40
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 40);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 4, '통로 폭과 층고가 안내대로였습니다. AGV 주행 시험에 문제없었어요.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 41
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 41);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '파렛트 배치를 실증 조건에 맞춰 다시 잡아 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 42
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 42);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '개인정보 처리 절차를 먼저 안내해 주셔서 준비가 수월했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 44
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 44);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '개인정보 처리 절차를 먼저 안내해 주셔서 준비가 수월했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 44
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 44);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 5, '간호 인력분들이 기기 사용법을 빠르게 익혀 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 48
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 48);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 5, '환자 동선과 겹치지 않는 시간대를 잡아 주셔서 부담이 적었습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 49
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 49);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 3, '설비는 안내대로였으나 주변 소음이 있어 보정이 필요했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 50
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 50);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 4, '개인정보 처리 절차를 먼저 안내해 주셔서 준비가 수월했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 50
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 50);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 5, '간호 인력분들이 기기 사용법을 빠르게 익혀 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 51
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 51);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 13, 'STARTUP', 5, '간호 인력분들이 기기 사용법을 빠르게 익혀 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 51
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 51);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '회의실 예약 시스템 연동을 미리 열어 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 53
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 53);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '공조 제어 권한을 실증 기간 동안 위임해 주셔서 변수 통제가 됐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 53
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 53);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 3, '협조는 좋았지만 사전 안내 자료가 부족했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 55
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 55);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 5, '회의실 예약 시스템 연동을 미리 열어 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 58
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 58);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 4, '입주사 안내 공지를 대신 돌려 주셔서 협조를 얻기 쉬웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 58
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 58);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 3, '협조는 좋았지만 사전 안내 자료가 부족했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 58
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 58);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '회의실 예약 시스템 연동을 미리 열어 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 26 AND e.course_id = 60
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 26 AND r.course_id = 60);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '입주사 안내 공지를 대신 돌려 주셔서 협조를 얻기 쉬웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 60
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 60);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '회의실 예약 시스템 연동을 미리 열어 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 60
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 60);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 5, '입주사 안내 공지를 대신 돌려 주셔서 협조를 얻기 쉬웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 63
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 63);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 14, 'STARTUP', 5, '회의실 예약 시스템 연동을 미리 열어 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 63
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 63);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 15, 'STARTUP', 5, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 64
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 64);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 66
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 66);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 3, '설비는 안내대로였으나 주변 소음이 있어 보정이 필요했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 26 AND e.course_id = 67
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 26 AND r.course_id = 67);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '관제실과의 협조가 원활했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 67
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 67);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 15, 'STARTUP', 2, '현장 조건이 설명과 달라 일정을 다시 잡아야 했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 69
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 69);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 4, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 70
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 70);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 4, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 70
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 70);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 15, 'STARTUP', 5, '야간 열화상 촬영 조건을 그대로 맞춰 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 71
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 71);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 15, 'STARTUP', 2, '현장 조건이 설명과 달라 일정을 다시 잡아야 했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 71
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 71);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 12, 'STARTUP', 5, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 72
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 72);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '관제실과의 협조가 원활했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 73
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 73);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 73
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 73);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '보안구역 출입 절차가 명확했고 사전 교육도 해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 74
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 74);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 16, 'STARTUP', 4, '무중단 조건을 지키면서도 필요한 접근을 허용해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 75
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 75);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 16, 'STARTUP', 4, '상면 전력과 냉방 조건이 사양서와 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 75
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 75);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 16, 'STARTUP', 4, '상면 전력과 냉방 조건이 사양서와 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 75
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 75);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '상면 전력과 냉방 조건이 사양서와 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 76
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 76);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '센서 부착 위치를 함께 고민해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 76
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 76);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 16, 'STARTUP', 5, '센서 부착 위치를 함께 고민해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 77
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 77);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 16, 'STARTUP', 4, '상면 전력과 냉방 조건이 사양서와 일치했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 77
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 77);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '센서 부착 위치를 함께 고민해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 81
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 81);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 16, 'STARTUP', 3, '설비는 안내대로였으나 주변 소음이 있어 보정이 필요했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 82
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 82);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 16, 'STARTUP', 5, '센서 부착 위치를 함께 고민해 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 82
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 82);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '실증 일정 조율이 매끄러웠습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 24 AND e.course_id = 87
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 24 AND r.course_id = 87);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '현장 담당자분 응답이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 23 AND e.course_id = 89
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 23 AND r.course_id = 89);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '요청한 자료를 정리해서 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 90
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 90);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '요청한 자료를 정리해서 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 25 AND e.course_id = 90
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 25 AND r.course_id = 90);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '현장 담당자분 응답이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 91
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 91);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '요청한 자료를 정리해서 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 91
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 91);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 2, '현장 조건이 설명과 달라 일정을 다시 잡아야 했습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 27 AND e.course_id = 91
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 27 AND r.course_id = 91);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '현장 담당자분 응답이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 20 AND e.course_id = 94
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 20 AND r.course_id = 94);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 3, '공간은 좋았는데 실증 시간대가 예상보다 짧았습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 26 AND e.course_id = 94
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 26 AND r.course_id = 94);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 5, '요청한 자료를 정리해서 주셨습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 22 AND e.course_id = 94
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 22 AND r.course_id = 94);
INSERT INTO reviews (enrollment_id, course_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, created_at, updated_at)
SELECT e.id, e.course_id, e.user_id, 19, 'STARTUP', 4, '현장 담당자분 응답이 빨랐습니다.', NOW(), NOW()
  FROM enrollments e WHERE e.user_id = 21 AND e.course_id = 95
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.reviewer_id = 21 AND r.course_id = 95);

-- 결과
SELECT
  (SELECT COUNT(*) FROM reviews)     AS `평가`,
  (SELECT COUNT(*) FROM enrollments) AS `신청`,
  (SELECT ROUND(AVG(rating), 2) FROM reviews) AS `평균 별점`;
