-- Replace the notify_support function with a version that doesn't use HTTP
CREATE OR REPLACE FUNCTION notify_support()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_type IN ('business', 'merchant') THEN
    -- Instead of calling HTTP, just log that a notification is needed
    
    -- First make sure we have the notification_sent column
    BEGIN
      -- Try to update the notification_sent column
      UPDATE signups SET notification_sent = false WHERE id = NEW.id;
    EXCEPTION WHEN undefined_column THEN
      -- Column doesn't exist, add it
      ALTER TABLE signups ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
      UPDATE signups SET notification_sent = false WHERE id = NEW.id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the signup_logs table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signup_logs'
  ) THEN
    -- Create the signup_logs table
    CREATE TABLE public.signup_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      signup_id UUID REFERENCES signups(id),
      action TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Create the log function
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