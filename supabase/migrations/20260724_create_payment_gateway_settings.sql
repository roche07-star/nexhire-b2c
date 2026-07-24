-- 결제 게이트웨이 설정 테이블 생성
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  mode TEXT NOT NULL DEFAULT 'TEST' CHECK (mode IN ('TEST', 'REAL')),
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 단일 레코드만 허용 (CHECK constraint)
CREATE UNIQUE INDEX IF NOT EXISTS payment_gateway_settings_single_row
ON payment_gateway_settings (id) WHERE id = 1;

-- 초기 데이터 삽입 (TEST 모드로 시작)
INSERT INTO payment_gateway_settings (id, mode, updated_at, created_at)
VALUES (1, 'TEST', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 감사 로그 테이블 생성
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  actor_email TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_actor_email_idx ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- 코멘트
COMMENT ON TABLE payment_gateway_settings IS '결제 게이트웨이 모드 설정 (TEST: 토스페이먼츠, REAL: PortOne NHN KCP)';
COMMENT ON TABLE audit_logs IS '시스템 감사 로그';
