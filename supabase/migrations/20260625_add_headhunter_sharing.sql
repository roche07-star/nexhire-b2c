-- Migration: 헤드헌터 추천 서비스 관련 필드 추가
-- Created: 2026-06-25
-- Description: users 테이블에 헤드헌터 공유 동의 관련 필드 추가

-- 1. users 테이블에 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  headhunter_sharing_enabled BOOLEAN DEFAULT false;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  headhunter_sharing_consented_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  headhunter_sharing_consent_ip TEXT;

-- 2. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_headhunter_sharing
ON users(headhunter_sharing_enabled)
WHERE headhunter_sharing_enabled = true;

-- 3. 코멘트 추가
COMMENT ON COLUMN users.headhunter_sharing_enabled IS '헤드헌터 추천 서비스 동의 여부';
COMMENT ON COLUMN users.headhunter_sharing_consented_at IS '동의 일시';
COMMENT ON COLUMN users.headhunter_sharing_consent_ip IS '동의 시 IP 주소 (법적 증빙)';

-- 4. 확인 쿼리
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE 'headhunter%'
ORDER BY column_name;
