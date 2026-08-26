-- PoCket 확장: 상호 평가 (review-service 소유)
-- 기존 테이블은 변경하지 않는다 — reviews 테이블만 신규 생성한다.
--
-- 호스트(테스트베드 제공자)와 스타트업(실증 신청자)이
-- 확정된 실증 건(enrollments.status = 'ACTIVE')에 대해 서로 1회씩 평가한다.

CREATE TABLE IF NOT EXISTS reviews (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    enrollment_id BIGINT       NOT NULL COMMENT '평가 근거가 되는 실증 신청 (enrollments.id)',
    course_id     BIGINT       NOT NULL COMMENT '실증 슬롯 (courses.id)',
    reviewer_id   BIGINT       NOT NULL COMMENT '평가한 사람 (users.id)',
    reviewee_id   BIGINT       NOT NULL COMMENT '평가받은 사람 (users.id)',
    reviewer_role VARCHAR(20)  NOT NULL COMMENT 'HOST | STARTUP',
    rating        SMALLINT     NOT NULL COMMENT '1~5',
    comment       TEXT,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    -- 한 실증 건당 각자 1회만 평가
    UNIQUE KEY uq_enrollment_reviewer (enrollment_id, reviewer_id),
    KEY idx_reviews_reviewee (reviewee_id),
    KEY idx_reviews_enrollment (enrollment_id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_self   CHECK (reviewer_id <> reviewee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
