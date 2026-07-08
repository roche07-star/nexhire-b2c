-- ============================================
-- 마이그레이션: Soft Delete 구조 추가
-- ============================================
--
-- 목표: Hard delete → Soft delete 전환
-- 목적: 데이터 복구 가능, 법적 준수, 감사 추적
--
-- ============================================

BEGIN;

-- ============================================
-- 1. deleted_at 컬럼 추가
-- ============================================

-- analyses
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_analyses_deleted_at
ON analyses(deleted_at) WHERE deleted_at IS NOT NULL;

-- jd_analyses
ALTER TABLE jd_analyses
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jd_analyses_deleted_at
ON jd_analyses(deleted_at) WHERE deleted_at IS NOT NULL;

-- interview_guides
ALTER TABLE interview_guides
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_interview_guides_deleted_at
ON interview_guides(deleted_at) WHERE deleted_at IS NOT NULL;

-- jobs (백그라운드 작업도 soft delete)
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at
ON jobs(deleted_at) WHERE deleted_at IS NOT NULL;

-- consents는 이미 withdrawn_at 있음 (활용)

-- ============================================
-- 2. audit_logs 테이블 확장 (삭제 기록용)
-- ============================================

-- audit_logs에 deletion_stage 컬럼 추가
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS deletion_stage TEXT;

COMMENT ON COLUMN audit_logs.deletion_stage IS
'삭제 단계: immediate (즉시 익명화), soft (30일), hard (90일), permanent (5년)';

-- ============================================
-- 3. 검증
-- ============================================

DO $$
DECLARE
  analyses_has_deleted BOOLEAN;
  jd_has_deleted BOOLEAN;
  interview_has_deleted BOOLEAN;
  jobs_has_deleted BOOLEAN;
BEGIN
  -- deleted_at 컬럼 존재 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'deleted_at'
  ) INTO analyses_has_deleted;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jd_analyses' AND column_name = 'deleted_at'
  ) INTO jd_has_deleted;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_guides' AND column_name = 'deleted_at'
  ) INTO interview_has_deleted;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'deleted_at'
  ) INTO jobs_has_deleted;

  IF NOT (analyses_has_deleted AND jd_has_deleted AND interview_has_deleted AND jobs_has_deleted) THEN
    RAISE EXCEPTION 'deleted_at 컬럼 추가 실패';
  END IF;

  RAISE NOTICE '✅ Soft delete 구조 추가 완료';
END $$;

COMMIT;

-- 확인 쿼리
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('analyses', 'jd_analyses', 'interview_guides', 'jobs')
  AND column_name = 'deleted_at'
ORDER BY table_name;
