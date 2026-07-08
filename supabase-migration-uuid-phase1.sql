-- ============================================
-- UUID 마이그레이션 Phase 1: users 테이블 확장
-- ============================================
--
-- 목표: users 테이블에 UUID 추가 (기존 email PK 유지)
-- 다운타임: 0분
-- 롤백: ALTER TABLE users DROP COLUMN id;
--
-- ============================================

BEGIN;

-- STEP 1: 백업 확인용 테이블 생성
CREATE TABLE IF NOT EXISTS migration_backup_users AS
SELECT * FROM users LIMIT 0;

INSERT INTO migration_backup_users SELECT * FROM users;

-- STEP 2: id 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- STEP 3: 기존 사용자에게 UUID 생성 (NULL인 경우만)
UPDATE users
SET id = gen_random_uuid()
WHERE id IS NULL;

-- STEP 4: NOT NULL 제약 추가
ALTER TABLE users
ALTER COLUMN id SET NOT NULL;

-- STEP 5: UNIQUE 제약 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_id_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_id_unique UNIQUE (id);
  END IF;
END $$;

-- STEP 6: 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- STEP 7: 검증
DO $$
DECLARE
  total_users INTEGER;
  users_with_id INTEGER;
  duplicate_ids INTEGER;
BEGIN
  -- 전체 사용자 수
  SELECT COUNT(*) INTO total_users FROM users;

  -- UUID가 있는 사용자 수
  SELECT COUNT(*) INTO users_with_id FROM users WHERE id IS NOT NULL;

  -- 중복 UUID 확인
  SELECT COUNT(*) INTO duplicate_ids FROM (
    SELECT id, COUNT(*)
    FROM users
    GROUP BY id
    HAVING COUNT(*) > 1
  ) duplicates;

  -- 검증 실패 시 롤백
  IF total_users != users_with_id THEN
    RAISE EXCEPTION 'UUID 생성 실패: % 사용자 중 %명만 UUID 있음', total_users, users_with_id;
  END IF;

  IF duplicate_ids > 0 THEN
    RAISE EXCEPTION 'UUID 중복 발견: %건', duplicate_ids;
  END IF;

  RAISE NOTICE '✅ Phase 1 완료: % 사용자에게 UUID 생성됨', total_users;
END $$;

COMMIT;

-- 확인 쿼리
SELECT
  COUNT(*) as total_users,
  COUNT(id) as users_with_id,
  COUNT(DISTINCT id) as unique_ids
FROM users;

-- 샘플 데이터 확인
SELECT email, id, user_type, plan, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
