-- ============================================
-- Supabase RPC: 사용량 원자적 리셋
-- ============================================
--
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 아래 SQL 실행
--
-- ============================================

-- 사용량 체크 및 리셋 (원자적)
CREATE OR REPLACE FUNCTION check_and_reset_usage(user_email TEXT)
RETURNS TABLE(
  was_reset BOOLEAN,
  analyze_count INT,
  jd_count INT,
  rewrite_count INT,
  interview_count INT,
  proposal_count INT
) AS $$
DECLARE
  current_reset TIMESTAMP;
  next_reset TIMESTAMP;
  now_ts TIMESTAMP := NOW();
  rows_affected INT;
BEGIN
  -- 현재 monthly_reset_at 조회
  SELECT monthly_reset_at INTO current_reset
  FROM users
  WHERE email = user_email;

  -- 다음 리셋 시각 계산
  next_reset := current_reset + INTERVAL '1 month';

  -- ✅ 리셋이 필요한지 체크하고, 필요하면 원자적으로 업데이트
  IF now_ts >= next_reset THEN
    -- 리셋 실행
    UPDATE users
    SET
      analyze_count = 0,
      jd_count = 0,
      rewrite_count = 0,
      interview_count = 0,
      proposal_count = 0,
      monthly_reset_at = next_reset
    WHERE email = user_email
      AND now_ts >= monthly_reset_at + INTERVAL '1 month'; -- 조건 재확인

    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    -- 리셋 성공
    IF rows_affected > 0 THEN
      RETURN QUERY SELECT
        TRUE as was_reset,
        0 as analyze_count,
        0 as jd_count,
        0 as rewrite_count,
        0 as interview_count,
        0 as proposal_count;
      RETURN;
    END IF;
  END IF;

  -- 리셋 불필요 또는 다른 요청이 먼저 리셋함 → 현재 카운트 반환
  RETURN QUERY
  SELECT
    FALSE as was_reset,
    COALESCE(u.analyze_count, 0) as analyze_count,
    COALESCE(u.jd_count, 0) as jd_count,
    COALESCE(u.rewrite_count, 0) as rewrite_count,
    COALESCE(u.interview_count, 0) as interview_count,
    COALESCE(u.proposal_count, 0) as proposal_count
  FROM users u
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- 테스트 쿼리
-- SELECT * FROM check_and_reset_usage('test@example.com');
--
-- 결과:
-- was_reset | analyze_count | jd_count | ...
-- true      | 0             | 0        | ... (리셋됨)
-- false     | 5             | 3        | ... (리셋 안 됨, 현재 값)
