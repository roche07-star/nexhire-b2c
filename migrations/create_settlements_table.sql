-- ============================================================
-- 정산(Settlements) 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  company TEXT,
  position TEXT,
  start_date DATE NOT NULL,
  salary BIGINT NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 17.00,
  incentive_rate NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  personal_override BIGINT DEFAULT 0,
  memo TEXT,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM start_date)) STORED,
  headhunter_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_salary CHECK (salary >= 0),
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100),
  CONSTRAINT valid_incentive_rate CHECK (incentive_rate >= 0 AND incentive_rate <= 100)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_settlements_headhunter ON settlements(headhunter_email);
CREATE INDEX IF NOT EXISTS idx_settlements_year ON settlements(year);
CREATE INDEX IF NOT EXISTS idx_settlements_headhunter_year ON settlements(headhunter_email, year);

-- RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "헤드헌터는 자신의 정산만 조회 가능"
ON settlements FOR SELECT TO authenticated
USING (headhunter_email = auth.jwt() ->> 'email');

CREATE POLICY "헤드헌터는 자신의 정산만 생성 가능"
ON settlements FOR INSERT TO authenticated
WITH CHECK (headhunter_email = auth.jwt() ->> 'email');

CREATE POLICY "헤드헌터는 자신의 정산만 수정 가능"
ON settlements FOR UPDATE TO authenticated
USING (headhunter_email = auth.jwt() ->> 'email')
WITH CHECK (headhunter_email = auth.jwt() ->> 'email');

CREATE POLICY "헤드헌터는 자신의 정산만 삭제 가능"
ON settlements FOR DELETE TO authenticated
USING (headhunter_email = auth.jwt() ->> 'email');

-- 트리거
CREATE OR REPLACE FUNCTION update_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settlements_updated_at_trigger
BEFORE UPDATE ON settlements
FOR EACH ROW
EXECUTE FUNCTION update_settlements_updated_at();
