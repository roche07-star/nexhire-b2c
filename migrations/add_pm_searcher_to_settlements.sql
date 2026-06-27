-- ============================================================
-- settlements 테이블에 역할/파트너 필드 추가
-- ============================================================

-- 역할 ENUM 타입 생성
DO $$ BEGIN
  CREATE TYPE headhunter_role AS ENUM ('PM_SOLO', 'PM', 'SEARCHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 나의 역할 컬럼 추가
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS my_role headhunter_role DEFAULT 'PM';

-- 파트너 이름 컬럼 추가
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- 내 비율 컬럼 추가 (%)
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS my_ratio INTEGER DEFAULT 50;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_settlements_my_role ON settlements(my_role);
CREATE INDEX IF NOT EXISTS idx_settlements_partner_name ON settlements(partner_name);

-- 제약 조건
ALTER TABLE settlements
ADD CONSTRAINT IF NOT EXISTS valid_my_ratio CHECK (my_ratio >= 0 AND my_ratio <= 100);

-- 코멘트
COMMENT ON COLUMN settlements.my_role IS '나의 역할 (PM_SOLO: PM 단독, PM: PM, SEARCHER: 써처)';
COMMENT ON COLUMN settlements.partner_name IS '파트너 이름 (함께 일한 PM 또는 써처)';
COMMENT ON COLUMN settlements.my_ratio IS '내 비율 (0-100%)';
