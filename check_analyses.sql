-- CTO의 분석 데이터 확인
SELECT 
  id,
  created_at,
  pipeline_stage,
  SUBSTRING(result::text, 1, 100) as result_preview
FROM analyses
WHERE user_email = 'roche07he@gmail.com'
ORDER BY created_at DESC
LIMIT 5;
