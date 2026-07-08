-- ============================================
-- Supabase RPC: 쿠폰 원자적 증가
-- ============================================
--
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 아래 SQL 실행
--
-- ============================================

-- 기존 함수 삭제 (반환 타입 변경을 위해)
DROP FUNCTION IF EXISTS increment_coupon_used(TEXT);

-- 쿠폰 사용 횟수를 원자적으로 증가 (Optimistic Locking)
CREATE OR REPLACE FUNCTION increment_coupon_used(coupon_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INT;
BEGIN
  -- ✅ 원자적 업데이트: used < credits 조건으로 UPDATE
  -- 동시에 2명이 요청해도 1명만 성공
  UPDATE coupons
  SET used = used + 1
  WHERE id = coupon_id
    AND used < credits
    AND expires_at > NOW()
    AND deleted_at IS NULL;

  -- 영향받은 행 수 확인
  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  -- 1행 영향받았으면 성공, 0행이면 실패 (이미 소진 또는 만료)
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 테스트 쿼리
-- SELECT increment_coupon_used('your-coupon-id-here');
--
-- 성공: true 반환
-- 실패 (한도 초과 또는 만료): false 반환
