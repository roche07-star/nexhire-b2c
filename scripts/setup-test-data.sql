-- Cron Job 테스트용 데이터 생성
-- Supabase SQL Editor에서 실행

-- 1. 테스트 사용자 생성 (없으면)
INSERT INTO users (email, name, plan, user_type)
VALUES
  ('cron-test-downgrade@test.com', 'Downgrade Test', 'PRO', 'JOBSEEKER'),
  ('cron-test-withdraw@test.com', 'Withdraw Test', 'PRO', 'JOBSEEKER'),
  ('cron-test-delete@test.com', 'Delete Test', 'FREE', 'JOBSEEKER')
ON CONFLICT (email) DO NOTHING;

-- 2. 다운그레이드 테스트 데이터
UPDATE users
SET
  plan = 'PRO',
  plan_end_date = CURRENT_DATE - INTERVAL '1 day',  -- 어제
  downgrade_to = 'FREE',
  downgrade_requested_at = NOW() - INTERVAL '1 day',
  analyze_count = 10,
  jd_count = 8
WHERE email = 'cron-test-downgrade@test.com';

-- 3. 탈퇴 테스트 데이터
UPDATE users
SET
  plan = 'PRO',
  status = 'withdrawing',
  plan_end_date = CURRENT_DATE - INTERVAL '1 day',  -- 어제
  withdraw_requested_at = NOW() - INTERVAL '1 day',
  data_delete_at = NOW() + INTERVAL '6 months'
WHERE email = 'cron-test-withdraw@test.com';

-- 4. 데이터 삭제 테스트 데이터
UPDATE users
SET
  status = 'withdrawn',
  data_delete_at = NOW() - INTERVAL '1 day'  -- 어제
WHERE email = 'cron-test-delete@test.com';

-- 5. 확인
SELECT
  email,
  plan,
  status,
  plan_end_date,
  downgrade_to,
  analyze_count,
  jd_count
FROM users
WHERE email IN (
  'cron-test-downgrade@test.com',
  'cron-test-withdraw@test.com',
  'cron-test-delete@test.com'
);
