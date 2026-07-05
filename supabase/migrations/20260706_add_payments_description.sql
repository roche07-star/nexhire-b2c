-- ====================================================================
-- payments 테이블에 description 컬럼 추가 (STORE 상품 정보)
-- 작성일: 2026-07-06
-- ====================================================================

-- 1. description 컬럼 추가
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. 코멘트 추가
COMMENT ON COLUMN payments.description IS 'STORE 구매 시 상품명 (예: 이력서 분석, JD 분석)';
