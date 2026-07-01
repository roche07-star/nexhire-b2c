-- roche07zn@gmail.com 이번 달 활동 건수 확인

-- 1. 이번 달 시작일 확인
SELECT
  DATE_TRUNC('month', NOW()) as first_day_of_month,
  NOW() as current_time;

-- 2. 이력서 분석 건수 (analyses 테이블)
SELECT
  COUNT(*) as thisMonth_resumes,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM analyses
WHERE user_email = 'roche07zn@gmail.com'
  AND created_at >= DATE_TRUNC('month', NOW());

-- 3. JD 분석 건수 (jd_analyses 테이블)
SELECT
  COUNT(*) as thisMonth_jds,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM jd_analyses
WHERE user_email = 'roche07zn@gmail.com'
  AND created_at >= DATE_TRUNC('month', NOW());

-- 4. 면접 가이드 건수 (interview_guides 테이블)
SELECT
  COUNT(*) as thisMonth_interviews,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM interview_guides
WHERE user_email = 'roche07zn@gmail.com'
  AND created_at >= DATE_TRUNC('month', NOW());

-- 5. 이번 달 모든 이력서 분석 데이터 보기
SELECT
  id,
  candidate_name,
  created_at,
  TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as created_at_kst
FROM analyses
WHERE user_email = 'roche07zn@gmail.com'
  AND created_at >= DATE_TRUNC('month', NOW())
ORDER BY created_at DESC;

-- 6. 이번 달 모든 JD 분석 데이터 보기
SELECT
  id,
  created_at,
  TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as created_at_kst
FROM jd_analyses
WHERE user_email = 'roche07zn@gmail.com'
  AND created_at >= DATE_TRUNC('month', NOW())
ORDER BY created_at DESC;

-- 7. 전체 기간 건수 (참고)
SELECT
  (SELECT COUNT(*) FROM analyses WHERE user_email = 'roche07zn@gmail.com') as total_resumes,
  (SELECT COUNT(*) FROM jd_analyses WHERE user_email = 'roche07zn@gmail.com') as total_jds,
  (SELECT COUNT(*) FROM interview_guides WHERE user_email = 'roche07zn@gmail.com') as total_interviews;
