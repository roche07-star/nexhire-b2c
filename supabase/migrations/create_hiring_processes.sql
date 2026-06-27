-- 채용 프로세스 관리 테이블
CREATE TABLE IF NOT EXISTS hiring_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  jd_analysis_id UUID REFERENCES jd_analyses(id) ON DELETE SET NULL,
  position_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  current_stage INTEGER NOT NULL DEFAULT 0, -- 0: 서류, 1: 1차, 2: 2차, 3: 최종, 4: 합격
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PASSED, FAILED, HIRED
  next_action TEXT,
  next_action_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hiring_processes_user_email ON hiring_processes(user_email);
CREATE INDEX IF NOT EXISTS idx_hiring_processes_analysis_id ON hiring_processes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_hiring_processes_status ON hiring_processes(status);
CREATE INDEX IF NOT EXISTS idx_hiring_processes_next_action_date ON hiring_processes(next_action_date);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_hiring_processes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hiring_processes_updated_at
  BEFORE UPDATE ON hiring_processes
  FOR EACH ROW
  EXECUTE FUNCTION update_hiring_processes_updated_at();

-- RLS 활성화
ALTER TABLE hiring_processes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회/수정 가능
CREATE POLICY "Users can view their own hiring processes"
  ON hiring_processes FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert their own hiring processes"
  ON hiring_processes FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update their own hiring processes"
  ON hiring_processes FOR UPDATE
  USING (auth.email() = user_email);

CREATE POLICY "Users can delete their own hiring processes"
  ON hiring_processes FOR DELETE
  USING (auth.email() = user_email);
