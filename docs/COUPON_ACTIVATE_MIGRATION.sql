-- 사용자 테이블에 추가 사용 횟수 컬럼 추가
-- 쿠폰 활성화 시 이 컬럼에 credits 누적

ALTER TABLE users
ADD COLUMN IF NOT EXISTS extra_credits jsonb DEFAULT '{}'::jsonb;

-- 예시 데이터 구조:
-- {
--   "resume": 2,
--   "jd": 1,
--   "interview": 1
-- }

COMMENT ON COLUMN users.extra_credits IS '쿠폰으로 획득한 추가 사용 횟수 (feature별)';
