-- Adam DB에서 확인
SELECT 
  email,
  analyzed_json IS NOT NULL as has_analysis,
  LENGTH(analyzed_json::text) as json_size,
  created_at
FROM analyses
WHERE email = 'roche07he@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
