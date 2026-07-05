-- 플랜 다운그레이드 및 탈퇴 지원을 위한 컬럼 추가
-- 2026-07-05

-- 1. 플랜 종료일 (유료 플랜 구독 종료 시점)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_end_date DATE;

-- 2. 다운그레이드 예약
ALTER TABLE users ADD COLUMN IF NOT EXISTS downgrade_to VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS downgrade_requested_at TIMESTAMP;

-- 3. 탈퇴 관련 (이미 있을 수 있음)
ALTER TABLE users ADD COLUMN IF NOT EXISTS withdraw_requested_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_delete_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_downgrade_to_check;
ALTER TABLE users ADD CONSTRAINT users_downgrade_to_check
  CHECK (downgrade_to IS NULL OR downgrade_to IN ('FREE', 'PRO', 'EXPERT'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'withdrawing', 'withdrawn'));

-- Comments
COMMENT ON COLUMN users.plan_end_date IS '유료 플랜 종료일 (다운그레이드/탈퇴 시 이 날짜까지 기존 플랜 유지)';
COMMENT ON COLUMN users.downgrade_to IS '다운그레이드 예약된 플랜 (plan_end_date 이후 자동 변경)';
COMMENT ON COLUMN users.downgrade_requested_at IS '다운그레이드 요청 시각';
COMMENT ON COLUMN users.withdraw_requested_at IS '탈퇴 요청 시각';
COMMENT ON COLUMN users.data_delete_at IS '데이터 완전 삭제 예정일 (탈퇴 후 6개월)';
COMMENT ON COLUMN users.status IS '사용자 상태: active(정상) / withdrawing(탈퇴대기) / withdrawn(탈퇴완료)';
