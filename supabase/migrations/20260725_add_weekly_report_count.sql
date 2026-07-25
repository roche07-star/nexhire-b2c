-- ============================================
-- 주간/월간 Report 사용량 제한 추가
-- ============================================
--
-- 목표: users 테이블에 weekly_report_count, monthly_report_count 추가
-- 다운타임: 0분
-- 롤백: ALTER TABLE users DROP COLUMN weekly_report_count, DROP COLUMN monthly_report_count;
--
-- ============================================

BEGIN;

-- STEP 1: weekly_report_count, monthly_report_count 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS weekly_report_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS monthly_report_count INTEGER DEFAULT 0 NOT NULL;

-- STEP 2: 기존 사용자 초기화 (이미 DEFAULT 0으로 처리됨)

-- STEP 3: increment_weekly_report_count RPC 함수 생성
CREATE OR REPLACE FUNCTION increment_weekly_report_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET weekly_report_count = weekly_report_count + 1
  WHERE email = user_email;
END;
$$;

-- STEP 3-2: increment_monthly_report_count RPC 함수 생성
CREATE OR REPLACE FUNCTION increment_monthly_report_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET monthly_report_count = monthly_report_count + 1
  WHERE email = user_email;
END;
$$;

-- STEP 4: check_and_reset_usage RPC 함수 업데이트 (weekly_report_count, monthly_report_count 리셋 추가)
CREATE OR REPLACE FUNCTION check_and_reset_usage(user_email TEXT)
RETURNS TABLE (
  was_reset BOOLEAN,
  analyze_count INT,
  jd_count INT,
  rewrite_count INT,
  interview_count INT,
  proposal_count INT,
  weekly_report_count INT,
  monthly_report_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly_reset_at TIMESTAMP WITH TIME ZONE;
  v_next_reset TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_was_reset BOOLEAN := FALSE;
  v_analyze_count INT;
  v_jd_count INT;
  v_rewrite_count INT;
  v_interview_count INT;
  v_proposal_count INT;
  v_weekly_report_count INT;
  v_monthly_report_count INT;
BEGIN
  -- 현재 사용량 및 리셋 시점 조회
  SELECT monthly_reset_at, users.analyze_count, users.jd_count, users.rewrite_count, users.interview_count, users.proposal_count, users.weekly_report_count, users.monthly_report_count
  INTO v_monthly_reset_at, v_analyze_count, v_jd_count, v_rewrite_count, v_interview_count, v_proposal_count, v_weekly_report_count, v_monthly_report_count
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
      jd_count = 0,
      rewrite_count = 0,
      interview_count = 0,
      proposal_count = 0,
      weekly_report_count = 0,
      monthly_report_count = 0,
      monthly_reset_at = v_next_reset
    WHERE email = user_email;

    v_was_reset := TRUE;
    v_analyze_count := 0;
    v_jd_count := 0;
    v_rewrite_count := 0;
    v_interview_count := 0;
    v_proposal_count := 0;
    v_weekly_report_count := 0;
    v_monthly_report_count := 0;
  END IF;

  -- 결과 반환
  RETURN QUERY SELECT v_was_reset, v_analyze_count, v_jd_count, v_rewrite_count, v_interview_count, v_proposal_count, v_weekly_report_count, v_monthly_report_count;
END;
$$;

COMMIT;

-- 확인 쿼리
SELECT
  COUNT(*) as total_users,
  COUNT(weekly_report_count) as users_with_weekly_count,
  COUNT(monthly_report_count) as users_with_monthly_count
FROM users;
