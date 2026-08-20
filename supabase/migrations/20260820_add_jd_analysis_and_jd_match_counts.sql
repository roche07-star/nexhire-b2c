-- Migration: JD분석과 JD 적합도 분석 분리
-- Date: 2026-08-20
-- Description: jd_count를 jd_analysis_count, jd_match_count로 분리

BEGIN;

-- STEP 1: jd_analysis_count 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS jd_analysis_count INTEGER DEFAULT 0;

-- STEP 2: jd_match_count 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS jd_match_count INTEGER DEFAULT 0;

-- STEP 3: 기존 jd_count 데이터를 jd_match_count로 복사 (JD 적합도 분석이 기존 기능)
UPDATE users SET jd_match_count = COALESCE(jd_count, 0) WHERE jd_match_count = 0;

-- STEP 4: increment_jd_analysis_count RPC 함수 생성
CREATE OR REPLACE FUNCTION increment_jd_analysis_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET jd_analysis_count = jd_analysis_count + 1
  WHERE email = user_email;
END;
$$;

-- STEP 5: increment_jd_match_count RPC 함수 생성
CREATE OR REPLACE FUNCTION increment_jd_match_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET jd_match_count = jd_match_count + 1
  WHERE email = user_email;
END;
$$;

-- STEP 6: check_and_reset_usage RPC 함수 업데이트
DROP FUNCTION IF EXISTS check_and_reset_usage(TEXT);

CREATE OR REPLACE FUNCTION check_and_reset_usage(user_email TEXT)
RETURNS TABLE(
  was_reset BOOLEAN,
  analyze_count INT,
  jd_analysis_count INT,
  jd_match_count INT,
  rewrite_count INT,
  interview_count INT,
  proposal_count INT,
  resume_count INT,
  weekly_report_count INT,
  monthly_report_count INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_monthly_reset_at TIMESTAMP WITH TIME ZONE;
  v_next_reset TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_was_reset BOOLEAN := FALSE;
  v_analyze_count INT;
  v_jd_analysis_count INT;
  v_jd_match_count INT;
  v_rewrite_count INT;
  v_interview_count INT;
  v_proposal_count INT;
  v_resume_count INT;
  v_weekly_report_count INT;
  v_monthly_report_count INT;
BEGIN
  -- 현재 사용량 및 리셋 시점 조회
  SELECT
    monthly_reset_at,
    users.analyze_count,
    users.jd_analysis_count,
    users.jd_match_count,
    users.rewrite_count,
    users.interview_count,
    users.proposal_count,
    users.resume_count,
    users.weekly_report_count,
    users.monthly_report_count
  INTO
    v_monthly_reset_at,
    v_analyze_count,
    v_jd_analysis_count,
    v_jd_match_count,
    v_rewrite_count,
    v_interview_count,
    v_proposal_count,
    v_resume_count,
    v_weekly_report_count,
    v_monthly_report_count
  FROM users
  WHERE email = user_email;

  -- 리셋 필요 여부 확인
  IF v_monthly_reset_at IS NULL THEN
    v_monthly_reset_at := v_now;
  END IF;

  v_next_reset := v_monthly_reset_at + INTERVAL '1 month';

  IF v_now >= v_next_reset THEN
    -- 리셋 실행
    UPDATE users
    SET
      analyze_count = 0,
      jd_analysis_count = 0,
      jd_match_count = 0,
      rewrite_count = 0,
      interview_count = 0,
      proposal_count = 0,
      resume_count = 0,
      weekly_report_count = 0,
      monthly_report_count = 0,
      monthly_reset_at = v_next_reset
    WHERE email = user_email;

    v_was_reset := TRUE;
    v_analyze_count := 0;
    v_jd_analysis_count := 0;
    v_jd_match_count := 0;
    v_rewrite_count := 0;
    v_interview_count := 0;
    v_proposal_count := 0;
    v_resume_count := 0;
    v_weekly_report_count := 0;
    v_monthly_report_count := 0;
  END IF;

  -- 결과 반환
  RETURN QUERY SELECT
    v_was_reset,
    v_analyze_count,
    v_jd_analysis_count,
    v_jd_match_count,
    v_rewrite_count,
    v_interview_count,
    v_proposal_count,
    v_resume_count,
    v_weekly_report_count,
    v_monthly_report_count;
END;
$$;

COMMIT;

-- 확인 쿼리
SELECT
  COUNT(*) as total_users,
  COUNT(jd_analysis_count) as users_with_jd_analysis_count,
  COUNT(jd_match_count) as users_with_jd_match_count
FROM users;
