-- ============================================================
-- users 테이블에 user_type 추가
-- ============================================================

-- user_type ENUM 타입 생성
DO $$ BEGIN
  CREATE TYPE user_type_enum AS ENUM ('JOBSEEKER', 'HEADHUNTER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- user_type 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type user_type_enum DEFAULT 'JOBSEEKER';

-- 기존 사용자는 모두 JOBSEEKER로 설정
UPDATE users
SET user_type = 'JOBSEEKER'
WHERE user_type IS NULL;

-- NOT NULL 제약 조건 추가
ALTER TABLE users
ALTER COLUMN user_type SET NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- 통계 뷰
CREATE OR REPLACE VIEW user_type_stats AS
SELECT user_type, COUNT(*) as count
FROM users
GROUP BY user_type;
