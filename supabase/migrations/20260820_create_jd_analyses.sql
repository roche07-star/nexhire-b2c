-- JD 분석 테이블 생성 (헤드헌터 전용)
CREATE TABLE IF NOT EXISTS jd_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_jd_analyses_user_email ON jd_analyses(user_email);
CREATE INDEX IF NOT EXISTS idx_jd_analyses_created_at ON jd_analyses(created_at DESC);

-- RLS 활성화
ALTER TABLE jd_analyses ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회/삭제
CREATE POLICY "Users can view own JD analyses"
  ON jd_analyses
  FOR SELECT
  USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert own JD analyses"
  ON jd_analyses
  FOR INSERT
  WITH CHECK (user_email = auth.jwt()->>'email');

CREATE POLICY "Users can delete own JD analyses"
  ON jd_analyses
  FOR DELETE
  USING (user_email = auth.jwt()->>'email');
