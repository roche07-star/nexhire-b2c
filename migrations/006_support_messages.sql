-- Support 문의 테이블 생성
-- 2026-07-05

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  admin_reply TEXT,
  replied_at TIMESTAMP,
  replied_by VARCHAR(255)
);

-- 인덱스 생성
CREATE INDEX idx_support_messages_user_email ON support_messages(user_email);
CREATE INDEX idx_support_messages_status ON support_messages(status);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at DESC);

-- 코멘트
COMMENT ON TABLE support_messages IS '사용자 문의 메시지';
COMMENT ON COLUMN support_messages.status IS 'new: 신규, in_progress: 처리중, resolved: 해결완료';
COMMENT ON COLUMN support_messages.admin_reply IS '관리자 답변';
COMMENT ON COLUMN support_messages.replied_by IS '답변한 관리자 이메일';
