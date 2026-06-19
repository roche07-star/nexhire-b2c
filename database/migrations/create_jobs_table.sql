-- ============================================
-- Jobs 테이블 생성
-- 용도: 백그라운드 작업 관리 (이력서 분석, JD 분석, 리라이팅, 면접 가이드)
-- ============================================

-- 1. jobs 테이블 생성
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'analyze', 'jd', 'rewrite', 'interview'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

  -- 입력 데이터
  input_data JSONB NOT NULL,

  -- 결과 데이터
  result JSONB,
  error TEXT,

  -- 진행 상황
  progress_message TEXT,
  progress_step INTEGER DEFAULT 0,
  progress_total INTEGER DEFAULT 1,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- 만료 시간 (자동 삭제용)
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS jobs_user_email_idx ON jobs(user_email);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_user_status_idx ON jobs(user_email, status);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 job만 조회 가능
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Service role은 모든 작업 가능
CREATE POLICY "Service role full access" ON jobs
  FOR ALL USING (true);

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 만료된 job 자동 삭제 함수 (선택)
-- Supabase Cron으로 매일 실행
CREATE OR REPLACE FUNCTION delete_expired_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM jobs
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 실행 후 확인:
-- SELECT * FROM jobs LIMIT 10;
-- ============================================
