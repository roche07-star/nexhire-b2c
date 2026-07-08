-- ============================================
-- Supabase RPC: Job 원자적 시작
-- ============================================
--
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 아래 SQL 실행
--
-- ============================================

-- Job 상태를 pending → processing으로 원자적 전환
CREATE OR REPLACE FUNCTION try_start_job(job_id TEXT, user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INT;
BEGIN
  -- ✅ 원자적 상태 전환: status = 'pending' 조건으로 UPDATE
  -- 동시에 2개 요청이 와도 1개만 성공
  UPDATE jobs
  SET
    status = 'processing',
    updated_at = NOW()
  WHERE id = job_id
    AND user_email = user_email
    AND status = 'pending';

  -- 영향받은 행 수 확인
  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  -- 1행 영향받았으면 성공, 0행이면 실패 (이미 처리 중 또는 완료)
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 테스트 쿼리
-- SELECT try_start_job('your-job-id-here', 'user@example.com');
--
-- 성공 (pending → processing): true 반환
-- 실패 (이미 processing 또는 completed): false 반환
