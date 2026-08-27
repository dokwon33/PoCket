-- ═══════════════════════════════════════════════════════════════
--  PoCket 데모 데이터 초기화
-- ═══════════════════════════════════════════════════════════════
--  시연·녹화 중 쌓인 신청·결제·평가를 지우고 처음 상태로 되돌립니다.
--  실증 슬롯(courses)과 계정(users)은 건드리지 않습니다.
--
--  실행:
--    docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < seed/reset-demo.sql
--
--  개발 서버가 떠 있으면 화면에서도 부를 수 있습니다.
--  Ctrl(⌘) + Alt + D 로 개발 패널을 열면 버튼이 있습니다.
--
--  주의
--   1. 특정 계정이 아니라 신청·결제·평가 전체를 지웁니다.
--   2. 시연 중 호스트가 등록한 슬롯은 지우지 않습니다.
--      그것까지 없애려면 courses 에서 직접 지우세요.
--   3. 되돌릴 수 없습니다.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. 신청 전 enrollment_count 를 기억해 둔다 ────────────────────
--
-- enrollment-service 가 결제 완료 시 course-service 의
-- POST /internal/{id}/enrollment-count 를 불러 값을 올린다
-- (EnrollmentService.java:65). 신청만 지우면 이 값이 부풀린 채 남는다.
--
-- 이 표는 처음 한 번만 채워진다. 그때의 값에서 "그 시점에 실제로 존재하던
-- 신청 건수"를 빼서, 시연 이전의 값을 복원한다.
CREATE TABLE IF NOT EXISTS demo_baseline_counts (
  course_id        BIGINT PRIMARY KEY,
  enrollment_count INT NOT NULL
);

INSERT IGNORE INTO demo_baseline_counts (course_id, enrollment_count)
SELECT c.id,
       GREATEST(
         c.enrollment_count - (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id),
         0
       )
FROM courses c;

-- 새로 등록된 슬롯도 표에 넣어 둔다 (다음 초기화 때 기준이 된다)
INSERT IGNORE INTO demo_baseline_counts (course_id, enrollment_count)
SELECT c.id, 0 FROM courses c;

-- ── 2. 시연 중 쌓인 것을 지운다 ──────────────────────────────────
-- 평가가 신청을 참조하므로 평가부터 지운다.
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM enrollments;

-- ── 3. 실증 진행 건수를 되돌린다 ─────────────────────────────────
UPDATE courses c
  JOIN demo_baseline_counts b ON b.course_id = c.id
   SET c.enrollment_count = b.enrollment_count;

-- ── 4. 결과 ─────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM enrollments) AS `남은 신청`,
  (SELECT COUNT(*) FROM payments)    AS `남은 결제`,
  (SELECT COUNT(*) FROM reviews)     AS `남은 평가`,
  (SELECT COUNT(*) FROM courses)     AS `실증 슬롯`;
