-- Create the signup_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.signup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id UUID REFERENCES signups(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create the log_signup_action function
CREATE OR REPLACE FUNCTION log_signup_action(
  p_signup_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO signup_logs (signup_id, action, details)
  VALUES (p_signup_id, p_action, p_details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;