-- JD 템플릿 저장 테이블
CREATE TABLE IF NOT EXISTS jd_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 사용자별 조회 성능
CREATE INDEX IF NOT EXISTS idx_jd_templates_user_email ON jd_templates(user_email);

-- RLS 활성화
ALTER TABLE jd_templates ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인이 작성한 템플릿만 조회/삭제 가능
CREATE POLICY jd_templates_select_own ON jd_templates
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY jd_templates_insert_own ON jd_templates
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY jd_templates_delete_own ON jd_templates
  FOR DELETE USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');
