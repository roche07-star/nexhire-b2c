-- blocked_ips 테이블 생성
-- 침입 탐지 시스템에서 차단된 IP 주소 관리

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unblocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 추가 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_at ON blocked_ips(blocked_at);

-- RLS 활성화 (관리자만 조회 가능)
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- 정책: 인증된 사용자만 조회 가능
CREATE POLICY "Allow authenticated read" ON blocked_ips
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 정책: Service role만 삽입/수정 가능
CREATE POLICY "Allow service role all" ON blocked_ips
  FOR ALL
  USING (auth.role() = 'service_role');

-- 주석
COMMENT ON TABLE blocked_ips IS '침입 탐지 시스템에서 차단된 IP 주소';
COMMENT ON COLUMN blocked_ips.ip_address IS '차단된 IP 주소';
COMMENT ON COLUMN blocked_ips.reason IS '차단 사유';
COMMENT ON COLUMN blocked_ips.blocked_at IS '차단 시간';
COMMENT ON COLUMN blocked_ips.unblocked_at IS '차단 해제 시간 (NULL = 차단 중)';
