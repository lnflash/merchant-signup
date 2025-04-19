-- Create enum type for account_type
CREATE TYPE account_type AS ENUM ('personal', 'business', 'merchant');

-- Create signups table
CREATE TABLE signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  account_type account_type NOT NULL DEFAULT 'personal',
  business_name TEXT,
  business_address TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  bank_name TEXT,
  bank_account_type TEXT,
  account_currency TEXT,
  bank_account_number TEXT,
  bank_branch TEXT,
  id_image_url TEXT,
  terms_accepted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create storage bucket for ID uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('id_uploads', 'id_uploads', false);

-- Set up storage policies for authenticated uploads only
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'id_uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'id_uploads');
