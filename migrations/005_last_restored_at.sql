-- 마지막 복원 시각 추가
-- 2026-07-05

-- 재가입 후 복원한 시각을 기록
-- 재탈퇴 시 이 시각 이전 데이터는 삭제, 이후 데이터만 보존
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_restored_at TIMESTAMP;

COMMENT ON COLUMN users.last_restored_at IS '마지막 데이터 복원 시각 (재탈퇴 시 이 시각 이전 데이터 삭제)';
