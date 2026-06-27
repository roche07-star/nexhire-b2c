-- ============================================================
-- settlements 테이블에 PM/써처 필드 추가
-- ============================================================

-- PM 이름 컬럼 추가
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS pm_name TEXT;

-- 써처 이름 컬럼 추가 (null이면 PM 단독)
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS searcher_name TEXT;

-- PM 보전 금액 추가
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS pm_bonus BIGINT DEFAULT 0;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_settlements_pm_name ON settlements(pm_name);
CREATE INDEX IF NOT EXISTS idx_settlements_searcher_name ON settlements(searcher_name);

-- 코멘트
COMMENT ON COLUMN settlements.pm_name IS 'PM 이름';
COMMENT ON COLUMN settlements.searcher_name IS '써처 이름 (null이면 PM 단독 수행)';
COMMENT ON COLUMN settlements.pm_bonus IS 'PM 보전 금액 (만원)';
