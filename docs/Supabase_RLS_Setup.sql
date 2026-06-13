-- ========================================
-- Jobizic - Supabase RLS (Row Level Security) 정책
-- 작성일: 2026년 6월 13일
-- 작성자: 미르팀 (코난 - 보안 전문가)
-- ========================================
--
-- 사용 방법:
-- 1. Supabase Dashboard 접속
-- 2. SQL Editor 메뉴 클릭
-- 3. 이 스크립트 전체를 붙여넣기
-- 4. "RUN" 버튼 클릭
--
-- ========================================

-- ========================================
-- 1. analyses 테이블 - 이력서 분석 결과
-- ========================================

-- RLS 활성화
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "사용자는 본인 데이터만 조회" ON analyses;
DROP POLICY IF EXISTS "사용자는 본인 데이터만 삽입" ON analyses;
DROP POLICY IF EXISTS "사용자는 본인 데이터만 수정" ON analyses;
DROP POLICY IF EXISTS "사용자는 본인 데이터만 삭제" ON analyses;

-- SELECT 정책: 본인 데이터만 조회
CREATE POLICY "사용자는 본인 데이터만 조회"
ON analyses FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

-- INSERT 정책: 본인 이메일로만 삽입
CREATE POLICY "사용자는 본인 데이터만 삽입"
ON analyses FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- UPDATE 정책: 본인 데이터만 수정
CREATE POLICY "사용자는 본인 데이터만 수정"
ON analyses FOR UPDATE
USING (auth.jwt() ->> 'email' = user_email);

-- DELETE 정책: 본인 데이터만 삭제
CREATE POLICY "사용자는 본인 데이터만 삭제"
ON analyses FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);

-- ========================================
-- 2. users 테이블 - 사용자 정보 및 사용량
-- ========================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "사용자는 본인 정보만 조회" ON users;
DROP POLICY IF EXISTS "사용자는 본인 정보만 수정" ON users;

-- SELECT 정책: 본인 정보만 조회
CREATE POLICY "사용자는 본인 정보만 조회"
ON users FOR SELECT
USING (auth.jwt() ->> 'email' = email);

-- UPDATE 정책: 본인 정보만 수정 (사용량 카운트 업데이트용)
CREATE POLICY "사용자는 본인 정보만 수정"
ON users FOR UPDATE
USING (auth.jwt() ->> 'email' = email);

-- ========================================
-- 3. 추가 테이블 RLS 정책
-- ========================================

-- jd_analyses 테이블 - JD 분석 결과
ALTER TABLE jd_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "사용자는 본인 JD 분석만 조회" ON jd_analyses;
DROP POLICY IF EXISTS "사용자는 본인 JD 분석만 삽입" ON jd_analyses;
DROP POLICY IF EXISTS "사용자는 본인 JD 분석만 삭제" ON jd_analyses;

CREATE POLICY "사용자는 본인 JD 분석만 조회"
ON jd_analyses FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 JD 분석만 삽입"
ON jd_analyses FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 JD 분석만 삭제"
ON jd_analyses FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);

-- interview_guides 테이블 - 면접 가이드
ALTER TABLE interview_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "사용자는 본인 면접 가이드만 조회" ON interview_guides;
DROP POLICY IF EXISTS "사용자는 본인 면접 가이드만 삽입" ON interview_guides;
DROP POLICY IF EXISTS "사용자는 본인 면접 가이드만 삭제" ON interview_guides;

CREATE POLICY "사용자는 본인 면접 가이드만 조회"
ON interview_guides FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 면접 가이드만 삽입"
ON interview_guides FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 면접 가이드만 삭제"
ON interview_guides FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);

-- ========================================
-- 4. 관리자 정책 (선택 사항)
-- ========================================
-- 관리자가 모든 데이터를 볼 수 있도록 허용
-- CTO 이메일: roche07he@gmail.com

-- analyses 테이블 - 관리자 조회
CREATE POLICY "관리자는 모든 이력서 분석 조회 가능"
ON analyses FOR SELECT
USING (auth.jwt() ->> 'email' = 'roche07he@gmail.com');

-- jd_analyses 테이블 - 관리자 조회
CREATE POLICY "관리자는 모든 JD 분석 조회 가능"
ON jd_analyses FOR SELECT
USING (auth.jwt() ->> 'email' = 'roche07he@gmail.com');

-- interview_guides 테이블 - 관리자 조회
CREATE POLICY "관리자는 모든 면접 가이드 조회 가능"
ON interview_guides FOR SELECT
USING (auth.jwt() ->> 'email' = 'roche07he@gmail.com');

-- users 테이블 - 관리자 조회
CREATE POLICY "관리자는 모든 사용자 정보 조회 가능"
ON users FOR SELECT
USING (auth.jwt() ->> 'email' = 'roche07he@gmail.com');

-- ========================================
-- 5. 확인 쿼리
-- ========================================
-- 실행 후 아래 쿼리로 정책이 정상적으로 적용되었는지 확인

/*
-- 모든 테이블의 RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('analyses', 'users', 'jd_analyses', 'interview_guides')
ORDER BY tablename, policyname;

-- RLS가 활성화된 테이블 확인
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('analyses', 'users', 'jd_analyses', 'interview_guides');
*/

-- ========================================
-- 완료!
-- ========================================
-- RLS 정책이 성공적으로 적용되었습니다.
-- 이제 각 사용자는 본인의 데이터만 조회/수정/삭제할 수 있습니다.
-- ========================================
