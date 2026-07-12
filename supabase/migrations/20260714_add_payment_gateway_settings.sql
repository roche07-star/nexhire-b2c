-- 결제 게이트웨이 설정 테이블
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id SERIAL PRIMARY KEY,
  mode VARCHAR(10) NOT NULL DEFAULT 'TEST',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255),
  CONSTRAINT mode_check CHECK (mode IN ('TEST', 'REAL'))
);

-- 초기값 삽입 (TEST 모드로 시작)
INSERT INTO payment_gateway_settings (mode, updated_by)
VALUES ('TEST', 'system')
ON CONFLICT DO NOTHING;

-- RLS 활성화
ALTER TABLE payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- SUPER_ADMIN만 수정 가능
CREATE POLICY "SUPER_ADMIN can update payment gateway settings"
  ON payment_gateway_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt() ->> 'email'
      AND user_type = 'SUPER_ADMIN'
    )
  );

-- 모든 인증된 사용자는 읽기 가능
CREATE POLICY "Authenticated users can read payment gateway settings"
  ON payment_gateway_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');
