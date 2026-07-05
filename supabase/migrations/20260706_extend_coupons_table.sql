-- ====================================================================
-- coupons 테이블 확장 (STORE 구매 시스템 지원)
-- 작성일: 2026-07-06
-- ====================================================================

-- 1. 새로운 컬럼 추가
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS issued_by TEXT DEFAULT 'ADMIN';

-- 2. code 컬럼을 nullable로 변경 (STORE 구매는 코드 불필요)
ALTER TABLE coupons
  ALTER COLUMN code DROP NOT NULL;

-- 3. 기존 쿠폰 데이터 마이그레이션
-- 기존 쿠폰은 모두 1회 사용으로 설정
UPDATE coupons
SET
  credits = 1,
  used = CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END,
  issued_by = 'ADMIN'
WHERE credits IS NULL;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_coupons_claimed_by_feature
  ON coupons(claimed_by, feature)
  WHERE claimed_by IS NOT NULL;

-- 5. 코멘트 추가
COMMENT ON COLUMN coupons.credits IS '총 사용 가능 횟수 (기본값 1)';
COMMENT ON COLUMN coupons.used IS '사용한 횟수 (기본값 0)';
COMMENT ON COLUMN coupons.issued_by IS '발급처 (ADMIN, STORE, MANAGER 등)';
COMMENT ON COLUMN coupons.code IS '쿠폰 코드 (STORE 구매는 NULL 가능)';
