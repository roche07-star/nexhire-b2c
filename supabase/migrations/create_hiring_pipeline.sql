-- 채용 파이프라인 테이블 생성
CREATE TABLE IF NOT EXISTS hiring_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'DOCUMENT_PREP',

  -- 분석 연동
  analysis_id UUID,
  jd_analysis_id UUID,

  -- 매칭 정보
  fit_score INTEGER,
  resume_title TEXT,

  -- 메모 & 액션
  notes TEXT,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hiring_pipeline_user_email ON hiring_pipeline(user_email);
CREATE INDEX IF NOT EXISTS idx_hiring_pipeline_stage ON hiring_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_hiring_pipeline_analysis_id ON hiring_pipeline(analysis_id);
CREATE INDEX IF NOT EXISTS idx_hiring_pipeline_jd_analysis_id ON hiring_pipeline(jd_analysis_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_hiring_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hiring_pipeline_updated_at
  BEFORE UPDATE ON hiring_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_hiring_pipeline_updated_at();

-- RLS (Row Level Security) 설정
ALTER TABLE hiring_pipeline ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 데이터만 조회/수정 가능
CREATE POLICY "Users can view own pipeline"
  ON hiring_pipeline FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert own pipeline"
  ON hiring_pipeline FOR INSERT
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update own pipeline"
  ON hiring_pipeline FOR UPDATE
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can delete own pipeline"
  ON hiring_pipeline FOR DELETE
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');
