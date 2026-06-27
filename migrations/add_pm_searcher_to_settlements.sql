-- ============================================================
-- settlements 테이블에 역할/파트너 필드 추가
-- ============================================================

-- 역할 ENUM 타입 생성
DO $$ BEGIN
  CREATE TYPE headhunter_role AS ENUM ('PM_SOLO', 'PM', 'SEARCHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 컬럼 추가 (안전하게)
DO $$
BEGIN
  -- my_role 컬럼
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='settlements' AND column_name='my_role'
  ) THEN
    ALTER TABLE settlements ADD COLUMN my_role headhunter_role DEFAULT 'PM';
  END IF;

  -- partner_name 컬럼
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='settlements' AND column_name='partner_name'
  ) THEN
    ALTER TABLE settlements ADD COLUMN partner_name TEXT;
  END IF;

  -- my_ratio 컬럼
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='settlements' AND column_name='my_ratio'
  ) THEN
    ALTER TABLE settlements ADD COLUMN my_ratio INTEGER DEFAULT 50;
  END IF;
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_settlements_my_role ON settlements(my_role);
CREATE INDEX IF NOT EXISTS idx_settlements_partner_name ON settlements(partner_name);

-- 제약 조건 추가 (에러 무시)
DO $$ BEGIN
  ALTER TABLE settlements
  ADD CONSTRAINT valid_my_ratio CHECK (my_ratio >= 0 AND my_ratio <= 100);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 코멘트
DO $$ BEGIN
  EXECUTE 'COMMENT ON COLUMN settlements.my_role IS ''나의 역할 (PM_SOLO: PM 단독, PM: PM, SEARCHER: 써처)''';
  EXECUTE 'COMMENT ON COLUMN settlements.partner_name IS ''파트너 이름 (함께 일한 PM 또는 써처)''';
  EXECUTE 'COMMENT ON COLUMN settlements.my_ratio IS ''내 비율 (0-100%)''';
EXCEPTION
  WHEN OTHERS THEN null;
END $$;
