-- ============================================
-- 마이그레이션: 기존 매니저를 SUPER_ADMIN으로 설정
-- ============================================
--
-- 실행 방법:
-- 1. .env.local에서 MANAGER_EMAILS 확인
-- 2. 아래 이메일 목록 업데이트
-- 3. Supabase Dashboard → SQL Editor에서 실행
--
-- ⚠️ 주의: 이 마이그레이션 후 auth.ts 배포 필요
-- ============================================

-- STEP 1: 기존 매니저 이메일을 SUPER_ADMIN으로 설정
-- TODO: 실제 MANAGER_EMAILS 환경변수 값으로 교체
UPDATE users
SET
  user_type = 'SUPER_ADMIN',
  plan = 'EXPERT'
WHERE email IN (
  -- ✅ 여기에 실제 매니저 이메일 입력
  'roche07he@gmail.com'
  -- 'admin@example.com',
  -- 'manager@example.com'
);

-- STEP 2: 설정 확인
SELECT
  email,
  user_type,
  plan,
  created_at
FROM users
WHERE user_type = 'SUPER_ADMIN'
ORDER BY email;

-- 예상 결과: SUPER_ADMIN 사용자 목록 표시
