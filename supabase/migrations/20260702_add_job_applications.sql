-- 구직 활동 테이블 생성
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,

  -- 지원 정보
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '지원 완료', -- '지원 완료', '서류 통과', '1차 면접', '2차 면접', '최종 합격', '불합격'
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'

  -- 일정
  applied_at TIMESTAMP,
  deadline TIMESTAMP,
  schedule_at TIMESTAMP, -- 면접 일정

  -- 헤드헌터 지원
  headhunter_status TEXT DEFAULT 'self', -- 'self' (녹색), 'requested' (빨강), 'assigned' (파랑)
  headhunter_id TEXT, -- Eve의 헤드헌터 이메일
  headhunter_name TEXT,
  headhunter_requested_at TIMESTAMP,
  headhunter_assigned_at TIMESTAMP,
  eve_request_id TEXT, -- Eve DB의 job_seeker_requests.id

  -- 메모
  notes TEXT,
  request_message TEXT, -- 헤드헌터 요청 시 메시지

  -- JD 연동
  jd_analysis_id UUID REFERENCES jd_analyses(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_job_applications_user_email
ON job_applications(user_email, created_at);

CREATE INDEX IF NOT EXISTS idx_job_applications_headhunter_status
ON job_applications(user_email, headhunter_status);

-- 일정 테이블 생성
CREATE TABLE IF NOT EXISTS job_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  schedule_at TIMESTAMP NOT NULL,
  type TEXT NOT NULL, -- 'interview', 'deadline', 'follow-up', 'other'
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_job_schedules_user_email
ON job_schedules(user_email, schedule_at);

CREATE INDEX IF NOT EXISTS idx_job_schedules_date
ON job_schedules(user_email, schedule_at)
WHERE is_completed = false;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
DROP TRIGGER IF EXISTS update_job_schedules_updated_at ON job_schedules;

-- 트리거 생성
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_schedules_updated_at
  BEFORE UPDATE ON job_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
