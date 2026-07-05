-- Add proposal_count column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS proposal_count INTEGER DEFAULT 0;

-- Create RPC function to increment proposal_count
CREATE OR REPLACE FUNCTION increment_proposal_count(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET proposal_count = proposal_count + 1
  WHERE email = user_email;
END;
$$;
