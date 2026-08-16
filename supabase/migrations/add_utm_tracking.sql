-- UTM 트래킹을 위한 users 테이블 컬럼 추가
-- 키워드 성과 분석용

-- UTM 파라미터 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100),  -- 키워드 (가장 중요!)
ADD COLUMN IF NOT EXISTS first_visit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS referrer TEXT;

-- 인덱스 생성 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_utm_source ON users(utm_source);
CREATE INDEX IF NOT EXISTS idx_users_utm_term ON users(utm_term);
CREATE INDEX IF NOT EXISTS idx_users_first_visit_at ON users(first_visit_at);

-- 코멘트 추가
COMMENT ON COLUMN users.utm_source IS '유입 소스 (google, naver, etc)';
COMMENT ON COLUMN users.utm_medium IS '유입 매체 (cpc, organic, etc)';
COMMENT ON COLUMN users.utm_campaign IS '캠페인명';
COMMENT ON COLUMN users.utm_content IS '광고 콘텐츠 ID';
COMMENT ON COLUMN users.utm_term IS '검색 키워드 (키워드 성과 분석용)';
COMMENT ON COLUMN users.first_visit_at IS '최초 방문 시각';
COMMENT ON COLUMN users.referrer IS '유입 URL';
