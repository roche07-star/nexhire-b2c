-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_user_type TEXT NOT NULL CHECK (target_user_type IN ('HEADHUNTER', 'JOBSEEKER', 'ALL')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 읽음 처리 테이블 생성
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  read_at TIMESTAMP DEFAULT NOW(),
  dismissed_until TIMESTAMP,
  UNIQUE(announcement_id, user_email)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_announcements_target_type ON announcements(target_user_type);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_email);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);

-- RLS 활성화
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모두 읽기 가능 (대상 사용자에게만 보임)
CREATE POLICY "Users can view announcements for their type"
  ON announcements
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- RLS 정책: 관리자만 작성/수정/삭제
CREATE POLICY "Admins can manage announcements"
  ON announcements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS 정책: 사용자는 자신의 읽음 기록만 조회/생성
CREATE POLICY "Users can manage their own reads"
  ON announcement_reads
  FOR ALL
  USING (user_email = current_setting('request.jwt.claims')::json->>'email')
  WITH CHECK (user_email = current_setting('request.jwt.claims')::json->>'email');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at_trigger
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- 주석
COMMENT ON TABLE announcements IS '관리자 공지사항';
COMMENT ON TABLE announcement_reads IS '공지사항 읽음 처리';
COMMENT ON COLUMN announcements.target_user_type IS '대상: HEADHUNTER, JOBSEEKER, ALL';
COMMENT ON COLUMN announcements.priority IS '우선순위: normal, urgent';
COMMENT ON COLUMN announcement_reads.dismissed_until IS '오늘 하루 보지 않기 만료 시간';
