-- Update the signup_logs table for tracking notification status
CREATE TABLE IF NOT EXISTS public.signup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id UUID REFERENCES signups(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create a function to track notifications that need to be sent
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

-- Update the notify_support function to track signups for notification
-- without directly calling HTTP
CREATE OR REPLACE FUNCTION notify_support()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_type IN ('business', 'merchant') THEN
    -- Add record to the notification tracking table
    PERFORM log_signup_action(
      NEW.id,
      'notification_needed',
      jsonb_build_object(
        'account_type', NEW.account_type,
        'email', NEW.email,
        'business_name', NEW.business_name,
        'created_at', NEW.created_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;