-- ====================================================================
-- 정산 시스템 테이블 생성
-- 작성일: 2026-07-05
-- 작성자: 미르팀 (디바)
-- ====================================================================

-- 1. subscriptions 테이블 (구독 정보)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('FREE', 'PRO', 'EXPERT')),
  user_type TEXT CHECK (user_type IN ('JOBSEEKER', 'HEADHUNTER')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  billing_cycle TEXT DEFAULT 'monthly',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_subscriptions_user_email ON subscriptions(user_email);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_started_at ON subscriptions(started_at);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);

-- 2. payments 테이블 (결제 내역)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'refunded', 'pending')),
  payment_method TEXT, -- 'card', 'bank_transfer', 'coupon'
  payment_gateway TEXT, -- 'tosspayments', 'portone', etc.
  transaction_id TEXT UNIQUE,
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  paid_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_payments_user_email ON payments(user_email);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);

-- 3. refunds 테이블 (환불 내역)
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_by TEXT, -- user or admin email
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_by TEXT, -- admin email
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_user_email ON refunds(user_email);

-- 4. RLS (Row Level Security) 설정
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- SUPER_ADMIN만 모든 데이터 접근 가능
CREATE POLICY subscriptions_super_admin_all ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt()->>'email'
      AND user_type = 'SUPER_ADMIN'
    )
  );

CREATE POLICY payments_super_admin_all ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt()->>'email'
      AND user_type = 'SUPER_ADMIN'
    )
  );

CREATE POLICY refunds_super_admin_all ON refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt()->>'email'
      AND user_type = 'SUPER_ADMIN'
    )
  );

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY subscriptions_user_select ON subscriptions
  FOR SELECT USING (user_email = auth.jwt()->>'email');

CREATE POLICY payments_user_select ON payments
  FOR SELECT USING (user_email = auth.jwt()->>'email');

-- 5. 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 샘플 데이터 (테스트용)
-- 실제 서비스에서는 결제 시스템에서 자동 생성됩니다
-- INSERT INTO subscriptions (user_email, plan, user_type, amount, status)
-- VALUES
--   ('test@example.com', 'PRO', 'JOBSEEKER', 6930, 'active'),
--   ('headhunter@example.com', 'EXPERT', 'HEADHUNTER', 34930, 'active');
