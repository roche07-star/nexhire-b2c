-- 테이블 생성
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  company text NOT NULL,
  position text NOT NULL,
  status text DEFAULT '지원 완료',
  priority text DEFAULT 'medium',
  applied_at timestamptz,
  deadline timestamptz,
  schedule_at timestamptz,
  headhunter_status text DEFAULT 'self',
  headhunter_id text,
  headhunter_name text,
  headhunter_requested_at timestamptz,
  headhunter_assigned_at timestamptz,
  eve_request_id text,
  notes text,
  request_message text,
  jd_analysis_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  application_id uuid,
  title text NOT NULL,
  schedule_at timestamptz NOT NULL,
  type text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_email, created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(user_email, headhunter_status);
CREATE INDEX IF NOT EXISTS idx_job_schedules_user ON job_schedules(user_email, schedule_at);
