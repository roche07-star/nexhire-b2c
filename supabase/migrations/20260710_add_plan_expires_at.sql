-- users 테이블에 plan_expires_at 컬럼 추가
-- 기간제 이용권 시스템을 위한 플랜 만료일 추가

-- plan_expires_at 컬럼 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMP;
  END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at);

-- 주석
COMMENT ON COLUMN users.plan_expires_at IS '플랜 만료 일시 (기간제 이용권 시스템)';
