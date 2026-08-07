-- 생성된 이력서 저장 테이블
CREATE TABLE IF NOT EXISTS generated_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  preview TEXT,
  plan TEXT DEFAULT 'FREE',
  original_preview TEXT,
  changes JSONB DEFAULT '[]'::jsonb,
  docx TEXT, -- base64 encoded (PRO/EXPERT only)
  filename TEXT,
  resume_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_generated_resumes_user_email ON generated_resumes(user_email);
CREATE INDEX IF NOT EXISTS idx_generated_resumes_created_at ON generated_resumes(created_at DESC);

-- RLS 활성화
ALTER TABLE generated_resumes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 이력서만 조회 가능
CREATE POLICY "Users can view their own generated resumes"
  ON generated_resumes
  FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS 정책: 사용자는 자신의 이력서만 생성 가능
CREATE POLICY "Users can insert their own generated resumes"
  ON generated_resumes
  FOR INSERT
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS 정책: 사용자는 자신의 이력서만 삭제 가능
CREATE POLICY "Users can delete their own generated resumes"
  ON generated_resumes
  FOR DELETE
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');
