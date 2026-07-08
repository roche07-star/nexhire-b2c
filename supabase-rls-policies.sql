-- ============================================
-- Supabase RLS (Row Level Security) 정책 설정
-- NexHire Adam (B2C)
-- ============================================
--
-- 실행 방법:
-- 1. Supabase Dashboard 접속 (https://app.supabase.com)
-- 2. SQL Editor 메뉴 선택
-- 3. 아래 SQL 전체 복사하여 실행
--
-- ⚠️ 주의:
-- - 프로덕션 환경에서 실행 전 스테이징에서 먼저 테스트
-- - Service Role Key 사용 중인 코드는 계속 동작함 (기존 호환성 유지)
-- - 단계적으로 anon key로 전환 권장
-- ============================================

-- ============================================
-- 1. users 테이블 RLS 정책
-- ============================================
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인 데이터 읽기 (이메일 기반)
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- 정책 2: 본인 데이터 업데이트
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

-- 정책 3: SUPER_ADMIN은 모든 사용자 읽기 가능
-- ⚠️ users 테이블 자체에 RLS가 걸려있어 순환 참조 발생
-- 해결: Service Role Key로 실행되는 signIn 콜백에서 처리하므로 제외
-- 또는 JWT claim을 직접 확인 (향후 Supabase Auth 전환 시)

-- 정책 4: SUPER_ADMIN은 모든 사용자 업데이트 가능
-- ⚠️ 동일한 이유로 제외

-- 정책 5: 신규 사용자 생성 (OAuth 로그인 시)
-- ⚠️ signIn 콜백은 Service Role Key로 실행되므로 RLS 우회
-- 따라서 이 정책은 supabaseClient로 직접 INSERT 시도할 때만 적용됨
-- 현재는 signIn 콜백에서만 사용자를 생성하므로 불필요하지만, 안전을 위해 유지
CREATE POLICY "users_insert_new" ON users
  FOR INSERT
  WITH CHECK (email = auth.jwt() ->> 'email');


-- ============================================
-- 2. analyses 테이블 RLS 정책
-- ============================================
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인 분석 결과 읽기
CREATE POLICY "analyses_read_own" ON analyses
  FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

-- 정책 2: 본인 분석 결과 생성
CREATE POLICY "analyses_insert_own" ON analyses
  FOR INSERT
  WITH CHECK (user_email = auth.jwt() ->> 'email');

-- 정책 3: 본인 분석 결과 업데이트
CREATE POLICY "analyses_update_own" ON analyses
  FOR UPDATE
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

-- 정책 4: 본인 분석 결과 삭제
CREATE POLICY "analyses_delete_own" ON analyses
  FOR DELETE
  USING (user_email = auth.jwt() ->> 'email');

-- 정책 5: SUPER_ADMIN은 모든 분석 결과 접근 가능
CREATE POLICY "analyses_admin_all" ON analyses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt() ->> 'email'
        AND user_type = 'SUPER_ADMIN'
    )
  );


-- ============================================
-- 3. jd_analyses 테이블 RLS 정책
-- ============================================
ALTER TABLE jd_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jd_analyses_read_own" ON jd_analyses
  FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "jd_analyses_insert_own" ON jd_analyses
  FOR INSERT
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "jd_analyses_update_own" ON jd_analyses
  FOR UPDATE
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "jd_analyses_delete_own" ON jd_analyses
  FOR DELETE
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "jd_analyses_admin_all" ON jd_analyses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt() ->> 'email'
        AND user_type = 'SUPER_ADMIN'
    )
  );


-- ============================================
-- 4. interview_guides 테이블 RLS 정책
-- ============================================
ALTER TABLE interview_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interview_guides_read_own" ON interview_guides
  FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "interview_guides_insert_own" ON interview_guides
  FOR INSERT
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "interview_guides_update_own" ON interview_guides
  FOR UPDATE
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "interview_guides_delete_own" ON interview_guides
  FOR DELETE
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "interview_guides_admin_all" ON interview_guides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt() ->> 'email'
        AND user_type = 'SUPER_ADMIN'
    )
  );


-- ============================================
-- 5. coupons 테이블 RLS 정책
-- ============================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인이 등록한 쿠폰 읽기
CREATE POLICY "coupons_read_own" ON coupons
  FOR SELECT
  USING (claimed_by = auth.jwt() ->> 'email');

-- 정책 2: 쿠폰 등록 (claim)
CREATE POLICY "coupons_update_claim" ON coupons
  FOR UPDATE
  USING (
    claimed_by IS NULL OR claimed_by = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    claimed_by = auth.jwt() ->> 'email'
  );

-- 정책 3: SUPER_ADMIN은 모든 쿠폰 관리 가능
CREATE POLICY "coupons_admin_all" ON coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt() ->> 'email'
        AND user_type = 'SUPER_ADMIN'
    )
  );


-- ============================================
-- 6. consents 테이블 RLS 정책
-- ============================================
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consents_read_own" ON consents
  FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "consents_insert_own" ON consents
  FOR INSERT
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "consents_update_own" ON consents
  FOR UPDATE
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "consents_delete_own" ON consents
  FOR DELETE
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "consents_admin_all" ON consents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt() ->> 'email'
        AND user_type = 'SUPER_ADMIN'
    )
  );


-- ============================================
-- 7. jobs 테이블 RLS 정책
-- ============================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_read_own" ON jobs
  FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "jobs_admin_all" ON jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE email = auth.jwt() ->> 'email'
        AND user_type = 'SUPER_ADMIN'
    )
  );


-- ============================================
-- 완료 확인
-- ============================================
-- 아래 쿼리로 RLS가 활성화되었는지 확인
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'analyses', 'jd_analyses', 'interview_guides', 'coupons', 'consents', 'jobs')
ORDER BY tablename;

-- 정책 목록 확인
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
