-- Add missing RPC functions to increment usage counts
-- These functions are called by lib/usageLimits.ts incrementUsage()

-- Increment analyze_count
CREATE OR REPLACE FUNCTION increment_analyze_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET analyze_count = analyze_count + 1
  WHERE email = user_email;
END;
$$;

-- Increment jd_count
CREATE OR REPLACE FUNCTION increment_jd_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET jd_count = jd_count + 1
  WHERE email = user_email;
END;
$$;

-- Increment rewrite_count
CREATE OR REPLACE FUNCTION increment_rewrite_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET rewrite_count = rewrite_count + 1
  WHERE email = user_email;
END;
$$;

-- Increment interview_count
CREATE OR REPLACE FUNCTION increment_interview_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET interview_count = interview_count + 1
  WHERE email = user_email;
END;
$$;
