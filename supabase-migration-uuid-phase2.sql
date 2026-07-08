-- ============================================
-- UUID 마이그레이션 Phase 2: 외래 키 테이블 확장
-- ============================================
--
-- 목표: 모든 테이블에 user_id (UUID) 추가, 기존 user_email 유지
-- 다운타임: 0분
-- 롤백: 각 테이블의 user_id 컬럼 삭제
--
-- ⚠️ 주의: Phase 1 완료 후 실행
-- ============================================

BEGIN;

-- ============================================
-- 1. analyses 테이블
-- ============================================
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE analyses a
SET user_id = u.id
FROM users u
WHERE a.user_email = u.email
  AND a.user_id IS NULL;

ALTER TABLE analyses ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_analyses_user_id'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT fk_analyses_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

-- ============================================
-- 2. jd_analyses 테이블
-- ============================================
ALTER TABLE jd_analyses ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE jd_analyses a
SET user_id = u.id
FROM users u
WHERE a.user_email = u.email
  AND a.user_id IS NULL;

ALTER TABLE jd_analyses ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_jd_analyses_user_id'
  ) THEN
    ALTER TABLE jd_analyses
    ADD CONSTRAINT fk_jd_analyses_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jd_analyses_user_id ON jd_analyses(user_id);

-- ============================================
-- 3. interview_guides 테이블
-- ============================================
ALTER TABLE interview_guides ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE interview_guides i
SET user_id = u.id
FROM users u
WHERE i.user_email = u.email
  AND i.user_id IS NULL;

ALTER TABLE interview_guides ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_interview_guides_user_id'
  ) THEN
    ALTER TABLE interview_guides
    ADD CONSTRAINT fk_interview_guides_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_interview_guides_user_id ON interview_guides(user_id);

-- ============================================
-- 4. coupons 테이블 (claimed_by만 변경, issued_to는 email 유지)
-- ============================================
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS claimed_by_id UUID;

UPDATE coupons c
SET claimed_by_id = u.id
FROM users u
WHERE c.claimed_by = u.email
  AND c.claimed_by_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_coupons_claimed_by_id'
  ) THEN
    ALTER TABLE coupons
    ADD CONSTRAINT fk_coupons_claimed_by_id
    FOREIGN KEY (claimed_by_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coupons_claimed_by_id ON coupons(claimed_by_id);

-- ============================================
-- 5. payments 테이블
-- ============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE payments p
SET user_id = u.id
FROM users u
WHERE p.user_email = u.email
  AND p.user_id IS NULL;

ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_user_id'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT fk_payments_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- ============================================
-- 6. consents 테이블
-- ============================================
ALTER TABLE consents ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE consents c
SET user_id = u.id
FROM users u
WHERE c.user_email = u.email
  AND c.user_id IS NULL;

ALTER TABLE consents ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_consents_user_id'
  ) THEN
    ALTER TABLE consents
    ADD CONSTRAINT fk_consents_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consents_user_id ON consents(user_id);

-- ============================================
-- 7. jobs 테이블
-- ============================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE jobs j
SET user_id = u.id
FROM users u
WHERE j.user_email = u.email
  AND j.user_id IS NULL;

ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_jobs_user_id'
  ) THEN
    ALTER TABLE jobs
    ADD CONSTRAINT fk_jobs_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

-- ============================================
-- 검증
-- ============================================
DO $$
DECLARE
  analyses_null INTEGER;
  jd_null INTEGER;
  interview_null INTEGER;
  payments_null INTEGER;
  consents_null INTEGER;
  jobs_null INTEGER;
BEGIN
  SELECT COUNT(*) INTO analyses_null FROM analyses WHERE user_id IS NULL;
  SELECT COUNT(*) INTO jd_null FROM jd_analyses WHERE user_id IS NULL;
  SELECT COUNT(*) INTO interview_null FROM interview_guides WHERE user_id IS NULL;
  SELECT COUNT(*) INTO payments_null FROM payments WHERE user_id IS NULL;
  SELECT COUNT(*) INTO consents_null FROM consents WHERE user_id IS NULL;
  SELECT COUNT(*) INTO jobs_null FROM jobs WHERE user_id IS NULL;

  IF analyses_null > 0 OR jd_null > 0 OR interview_null > 0 OR
     payments_null > 0 OR consents_null > 0 OR jobs_null > 0 THEN
    RAISE EXCEPTION 'user_id NULL 발견: analyses=%, jd=%, interview=%, payments=%, consents=%, jobs=%',
      analyses_null, jd_null, interview_null, payments_null, consents_null, jobs_null;
  END IF;

  RAISE NOTICE '✅ Phase 2 완료: 모든 테이블에 user_id 생성됨';
END $$;

COMMIT;

-- 확인 쿼리
SELECT
  'analyses' as table_name,
  COUNT(*) as total,
  COUNT(user_id) as with_user_id,
  COUNT(*) - COUNT(user_id) as null_count
FROM analyses
UNION ALL
SELECT 'jd_analyses', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM jd_analyses
UNION ALL
SELECT 'interview_guides', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM interview_guides
UNION ALL
SELECT 'payments', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM payments
UNION ALL
SELECT 'consents', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM consents
UNION ALL
SELECT 'jobs', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM jobs
UNION ALL
SELECT 'coupons', COUNT(*), COUNT(claimed_by_id), COUNT(*) - COUNT(claimed_by_id) FROM coupons;
