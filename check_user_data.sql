-- 사용자 정보 확인 (이메일로 변경 필요)
SELECT 
  email,
  status,
  last_restored_at,
  created_at,
  (SELECT COUNT(*) 
   FROM analyses 
   WHERE user_email = users.email 
   AND result->>'_file_path' IS NOT NULL) as total_analyses,
  (SELECT COUNT(*) 
   FROM analyses 
   WHERE user_email = users.email 
   AND result->>'_file_path' IS NOT NULL
   AND created_at >= COALESCE(users.last_restored_at, '1970-01-01')) as filtered_analyses
FROM users
WHERE email = 'YOUR_EMAIL_HERE';
