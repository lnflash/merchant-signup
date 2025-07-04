-- Create signups table
CREATE TABLE signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'business', 'merchant')),
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
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create row level security policies
ALTER TABLE signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated users and anon
CREATE POLICY "Allow inserts for everyone" ON signups FOR INSERT WITH CHECK (true);

-- Create policy to allow reads for authenticated users only
CREATE POLICY "Allow reads for authenticated users only" ON signups FOR SELECT USING (auth.role() = 'authenticated');

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('id_uploads', 'ID Document Uploads', false);

-- Set up access policies for storage
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'id_uploads' AND
    auth.uid() = owner
  );

-- Allow authenticated users to read their own uploads
CREATE POLICY "Allow authenticated downloads" ON storage.objects 
  FOR SELECT TO authenticated USING (
    bucket_id = 'id_uploads' AND
    auth.uid() = owner
  );

-- Create indices for better performance
CREATE INDEX idx_signups_account_type ON signups(account_type);
CREATE INDEX idx_signups_created_at ON signups(created_at);