-- Migration: 연락처 정보 및 Eve 연동 필드 추가
-- Created: 2026-06-25
-- Description: users 테이블에 phone, address, eve_candidate_id 필드 추가

-- 1. users 테이블에 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS eve_candidate_id UUID;

-- 2. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_eve_candidate_id
ON users(eve_candidate_id)
WHERE eve_candidate_id IS NOT NULL;

-- 3. 코멘트 추가
COMMENT ON COLUMN users.phone IS '전화번호 (헤드헌터 추천 서비스용)';
COMMENT ON COLUMN users.address IS '주소 (선택, 헤드헌터 추천 서비스용)';
COMMENT ON COLUMN users.eve_candidate_id IS 'Eve 후보자 ID (연동 추적용)';

-- 4. 확인 쿼리
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('phone', 'address', 'eve_candidate_id')
ORDER BY column_name;
