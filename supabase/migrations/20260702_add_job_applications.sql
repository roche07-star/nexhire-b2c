-- 구직자 대시보드: 지원 정보 및 일정 테이블
BEGIN;

-- 1. 구직 활동 테이블
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '지원 완료',
  priority TEXT DEFAULT 'medium',
  applied_at TIMESTAMP,
  deadline TIMESTAMP,
  schedule_at TIMESTAMP,
  headhunter_status TEXT DEFAULT 'self',
  headhunter_id TEXT,
  headhunter_name TEXT,
  headhunter_requested_at TIMESTAMP,
  headhunter_assigned_at TIMESTAMP,
  eve_request_id TEXT,
  notes TEXT,
  request_message TEXT,
  jd_analysis_id UUID REFERENCES jd_analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 일정 테이블
CREATE TABLE IF NOT EXISTS job_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  schedule_at TIMESTAMP NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_job_applications_user_email ON job_applications(user_email, created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_headhunter_status ON job_applications(user_email, headhunter_status);
CREATE INDEX IF NOT EXISTS idx_job_schedules_user_email ON job_schedules(user_email, schedule_at);
CREATE INDEX IF NOT EXISTS idx_job_schedules_date ON job_schedules(user_email, schedule_at) WHERE is_completed = false;

-- 4. 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
DROP TRIGGER IF EXISTS update_job_schedules_updated_at ON job_schedules;

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_schedules_updated_at
  BEFORE UPDATE ON job_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
