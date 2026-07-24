-- NHN KCP 심사용 테스트 계정 추가
INSERT INTO users (
  email,
  name,
  user_type,
  plan,
  status,
  analyze_count,
  jd_count,
  rewrite_count,
  interview_count,
  proposal_count,
  created_at
) VALUES (
  'kcp-test@jobizic.com',
  'KCP Test',
  'JOBSEEKER',
  'FREE',
  'active',
  0,
  0,
  0,
  0,
  0,
  NOW()
)
ON CONFLICT (email) DO NOTHING;
