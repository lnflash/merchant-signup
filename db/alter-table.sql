-- Add missing columns to the signups table to match submission data

-- Add client_version (text type, nullable) 
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS client_version TEXT;

-- Add submission_source (text type, nullable)
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS submission_source TEXT;

-- Add user_agent (text type, nullable) 
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add submitted_at (timestamp with timezone, nullable)
-- This is different from created_at as it represents client-side submission time
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Also add timestamp for completeness
-- This will store client-side timestamp where available
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS timestamp TEXT;

-- Add attempt field that tracks fallback mechanisms
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS attempt TEXT;

-- Add device_info for potential future use
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Update description for clarity
COMMENT ON TABLE signups IS 'Merchant signup form submissions with fallback mechanisms';

-- Ensure columns have descriptions
COMMENT ON COLUMN signups.client_version IS 'Client application version that submitted the form';
COMMENT ON COLUMN signups.submission_source IS 'Source of the submission (api, direct_client, test_static_client, etc.)';
COMMENT ON COLUMN signups.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN signups.submitted_at IS 'Client-side timestamp when form was submitted';
COMMENT ON COLUMN signups.timestamp IS 'String representation of client timestamp';
COMMENT ON COLUMN signups.attempt IS 'Indicates if this was a direct submission or fallback attempt';
COMMENT ON COLUMN signups.device_info IS 'Additional device information as JSON';