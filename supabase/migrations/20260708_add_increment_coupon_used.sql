-- RPC 함수: 쿠폰 사용 카운트 증가
CREATE OR REPLACE FUNCTION increment_coupon_used(coupon_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE coupons
  SET used = COALESCE(used, 0) + 1
  WHERE id = coupon_id;
END;
$$;
