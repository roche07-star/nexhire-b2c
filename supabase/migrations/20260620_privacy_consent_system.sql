-- =============================================
-- 개인정보 동의 및 제3자 제공 시스템
-- 생성일: 2026-06-20
-- =============================================

-- 1. consents 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  is_agreed BOOLEAN DEFAULT TRUE,
  agreed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  withdrawn_at TIMESTAMP WITH TIME ZONE,

  -- 제3자 제공 동의 관련 (consent_type = 'third_party_provision')
  recipient_company TEXT,
  provision_purpose TEXT,
  provided_items TEXT[],
  provision_period TEXT,

  -- 메타데이터
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE consents IS '개인정보 수집·이용 및 제3자 제공 동의 기록';
COMMENT ON COLUMN consents.consent_type IS 'privacy_required, privacy_optional, third_party_provision, marketing 등';
COMMENT ON COLUMN consents.withdrawn_at IS '동의 철회 일시';

CREATE INDEX IF NOT EXISTS idx_consents_user_email
  ON consents(user_email);
CREATE INDEX IF NOT EXISTS idx_consents_type
  ON consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_recipient
  ON consents(recipient_company);

-- 2. consents 테이블에 오프라인 동의 관련 컬럼 추가
ALTER TABLE consents
ADD COLUMN IF NOT EXISTS consent_method TEXT,
ADD COLUMN IF NOT EXISTS consent_document_url TEXT,
ADD COLUMN IF NOT EXISTS recorded_by TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN consents.consent_method IS '동의 받은 방법: phone, email, in-person, document';
COMMENT ON COLUMN consents.consent_document_url IS '동의서 파일 URL (Supabase Storage)';
COMMENT ON COLUMN consents.recorded_by IS '동의를 기록한 헤드헌터 이메일';
COMMENT ON COLUMN consents.notes IS '동의 관련 메모';

-- 2. external_candidates 테이블 (Adam B2C 회원이 아닌 후보자)
CREATE TABLE IF NOT EXISTS external_candidates (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  source TEXT DEFAULT 'offline',
  registered_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE external_candidates IS 'Eve에서 관리하는 외부 후보자 (Adam 회원 아님)';
COMMENT ON COLUMN external_candidates.source IS '출처: offline, referral, linkedin 등';
COMMENT ON COLUMN external_candidates.registered_by IS '등록한 헤드헌터 이메일';

CREATE INDEX IF NOT EXISTS idx_external_candidates_registered_by
  ON external_candidates(registered_by);

-- 3. third_party_provision_logs 테이블 (제3자 제공 기록)
CREATE TABLE IF NOT EXISTS third_party_provision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_email TEXT NOT NULL,
  recipient_company TEXT NOT NULL,
  position TEXT,
  provided_items TEXT[] NOT NULL,
  resume_file_url TEXT,
  provided_by TEXT NOT NULL,
  provided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
  consent_id UUID REFERENCES consents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE third_party_provision_logs IS '제3자 제공 기록 (3년 보관)';
COMMENT ON COLUMN third_party_provision_logs.retention_until IS '보관 만료일 (제공일로부터 3년)';
COMMENT ON COLUMN third_party_provision_logs.consent_id IS '관련 동의 기록 ID';

CREATE INDEX IF NOT EXISTS idx_provision_logs_candidate
  ON third_party_provision_logs(candidate_email);
CREATE INDEX IF NOT EXISTS idx_provision_logs_company
  ON third_party_provision_logs(recipient_company);
CREATE INDEX IF NOT EXISTS idx_provision_logs_retention
  ON third_party_provision_logs(retention_until);
CREATE INDEX IF NOT EXISTS idx_provision_logs_provided_by
  ON third_party_provision_logs(provided_by);

-- 4. data_deletion_logs 테이블 (파기 기록)
CREATE TABLE IF NOT EXISTS data_deletion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  deletion_reason TEXT NOT NULL,
  deleted_data_summary JSONB,
  deleted_by TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  legal_retention_data JSONB,
  legal_retention_until TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE data_deletion_logs IS '개인정보 파기 기록';
COMMENT ON COLUMN data_deletion_logs.deletion_reason IS 'withdrawal, dormant, retention_expired';
COMMENT ON COLUMN data_deletion_logs.deleted_by IS 'user, system, admin';
COMMENT ON COLUMN data_deletion_logs.legal_retention_data IS '법적 보관 의무 데이터';

CREATE INDEX IF NOT EXISTS idx_deletion_logs_user_email
  ON data_deletion_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_deleted_at
  ON data_deletion_logs(deleted_at);

-- 5. audit_logs 테이블 (감사 로그)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  target_email TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS '개인정보 접근/처리 감사 로그';
COMMENT ON COLUMN audit_logs.action IS 'record_consent, provide_candidate_info, view_candidate, delete_data 등';

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at);

-- 6. users 테이블에 휴면 계정 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_service_use_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_dormant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dormant_notified_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.last_service_use_at IS '최종 서비스 이용 일시 (휴면 판단 기준)';
COMMENT ON COLUMN users.is_dormant IS '휴면 계정 여부';
COMMENT ON COLUMN users.dormant_notified_at IS '휴면 전환 안내 발송 일시';

CREATE INDEX IF NOT EXISTS idx_users_last_service_use
  ON users(last_service_use_at);
CREATE INDEX IF NOT EXISTS idx_users_dormant
  ON users(is_dormant);

-- 7. dormant_users_separated 테이블 (휴면 계정 분리 보관)
CREATE TABLE IF NOT EXISTS dormant_users_separated (
  email TEXT PRIMARY KEY,
  separated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  legal_retention_data JSONB,
  original_data_hash TEXT,
  restore_token TEXT UNIQUE
);

COMMENT ON TABLE dormant_users_separated IS '휴면 계정 분리 보관 데이터';
COMMENT ON COLUMN dormant_users_separated.original_data_hash IS '원본 데이터 해시 (복구 시 검증용)';
COMMENT ON COLUMN dormant_users_separated.restore_token IS '계정 복구 토큰';

-- 8. RLS (Row Level Security) 정책 설정

-- consents 테이블: B2C 사용자는 본인 동의만, B2B 헤드헌터는 관련 동의만
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents" ON consents;
CREATE POLICY "Users can view own consents" ON consents
  FOR SELECT USING (
    auth.email() = user_email
    OR
    auth.email() = recorded_by
  );

DROP POLICY IF EXISTS "Headhunters can record consents" ON consents;
CREATE POLICY "Headhunters can record consents" ON consents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.email()
        AND users.service_type = 'B2B'
    )
  );

-- external_candidates 테이블: B2B 헤드헌터만 접근
ALTER TABLE external_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Headhunters can manage external candidates" ON external_candidates;
CREATE POLICY "Headhunters can manage external candidates" ON external_candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.email()
        AND users.service_type = 'B2B'
    )
  );

-- third_party_provision_logs 테이블: B2B 헤드헌터만 조회
ALTER TABLE third_party_provision_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Headhunters can view provision logs" ON third_party_provision_logs;
CREATE POLICY "Headhunters can view provision logs" ON third_party_provision_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.email()
        AND users.service_type = 'B2B'
    )
  );

DROP POLICY IF EXISTS "Headhunters can create provision logs" ON third_party_provision_logs;
CREATE POLICY "Headhunters can create provision logs" ON third_party_provision_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.email()
        AND users.service_type = 'B2B'
    )
  );

-- audit_logs 테이블: 관리자만 조회
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view audit logs" ON audit_logs;
CREATE POLICY "Managers can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.email()
        AND users.user_type = 'MANAGER'
    )
  );

-- 9. 함수: 제공 기록 자동 파기 (3년 경과)
CREATE OR REPLACE FUNCTION delete_expired_provision_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM third_party_provision_logs
  WHERE retention_until < NOW();

  RAISE NOTICE 'Deleted % expired provision logs',
    (SELECT COUNT(*) FROM third_party_provision_logs WHERE retention_until < NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_expired_provision_logs IS '보관 기간 경과 제공 기록 자동 파기';

-- 10. 트리거: last_service_use_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_last_service_use()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_service_use_at = NOW()
  WHERE email = NEW.user_email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- analyses 테이블에서 새 분석 생성 시
DROP TRIGGER IF EXISTS tr_update_last_service_use_on_analysis ON analyses;
CREATE TRIGGER tr_update_last_service_use_on_analysis
  AFTER INSERT ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_last_service_use();

-- jd_analyses 테이블에서 새 JD 분석 생성 시
DROP TRIGGER IF EXISTS tr_update_last_service_use_on_jd ON jd_analyses;
CREATE TRIGGER tr_update_last_service_use_on_jd
  AFTER INSERT ON jd_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_last_service_use();

-- 완료
SELECT 'Privacy consent system migration completed successfully!' AS status;
