-- Orders 테이블 생성 (PortOne V2 결제 시스템)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
  payment_id TEXT NOT NULL,
  portone_transaction_id TEXT,
  portone_response JSONB,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- RLS 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 주문만 조회 가능
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (user_email = current_setting('request.jwt.claims')::json->>'email');

-- RLS 정책: 서비스 역할은 모든 작업 가능 (API에서 사용)
CREATE POLICY "Service role can do everything"
  ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 주문 상태 검증 함수
CREATE OR REPLACE FUNCTION validate_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 주문 상태 검증 트리거
CREATE TRIGGER validate_order_status_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_status();

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- 주석
COMMENT ON TABLE orders IS 'PortOne V2 결제 시스템 주문 정보';
COMMENT ON COLUMN orders.id IS '주문 ID (order_${productId}_${timestamp}_${random})';
COMMENT ON COLUMN orders.payment_id IS 'PortOne paymentId';
COMMENT ON COLUMN orders.portone_transaction_id IS 'PortOne 트랜잭션 ID (결제 완료 후 저장)';
COMMENT ON COLUMN orders.portone_response IS 'PortOne API 응답 전체 (JSON)';
COMMENT ON COLUMN orders.status IS '주문 상태: pending(대기), paid(완료), failed(실패), cancelled(취소)';
