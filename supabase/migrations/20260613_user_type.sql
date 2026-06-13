-- 사용자 유형 추가: 개인 vs 헤드헌터 분리
-- 작성일: 2026-06-13
-- 작성자: 디바 (MIR Team)

-- 1. user_type 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type TEXT
CHECK (user_type IN ('INDIVIDUAL', 'HEADHUNTER'));

-- 2. 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- 3. 기존 사용자는 NULL (첫 로그인 시 선택 팝업 표시)
-- 신규 사용자도 NULL로 시작

-- 4. user_type 선택 타임스탬프 (선택 시점 기록)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type_selected_at TIMESTAMPTZ;

-- 5. MANAGER는 자동으로 HEADHUNTER 설정 (관리자는 헤드헌터 기능 필요)
-- 이 작업은 애플리케이션 레벨에서 처리 (auth.ts에서)

-- 주석:
-- - user_type이 NULL이면 → 첫 로그인 팝업 표시
-- - user_type 선택 후 → 변경 불가 (영구 고정)
-- - INDIVIDUAL: 개인 구직자 (본인 이력서 분석, 취업 준비)
-- - HEADHUNTER: 헤드헌터 (후보자 분석, 클라이언트 제안, Eve 연동)
