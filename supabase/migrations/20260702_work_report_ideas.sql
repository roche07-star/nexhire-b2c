-- 업무 개선 아이디어 테이블 생성
CREATE TABLE IF NOT EXISTS work_report_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  month_of TEXT NOT NULL,
  ideas TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 유니크 제약: 같은 사용자의 같은 월은 하나의 아이디어만
  CONSTRAINT unique_user_month UNIQUE (user_email, month_of)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_report_ideas_user_email ON work_report_ideas(user_email);
CREATE INDEX IF NOT EXISTS idx_work_report_ideas_month_of ON work_report_ideas(month_of);
