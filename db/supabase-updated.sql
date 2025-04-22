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

-- Modified policy to allow inserts from BOTH authenticated AND anonymous users
CREATE POLICY "Allow inserts for everyone" ON signups FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Create policy to allow reads for authenticated users only (unchanged)
CREATE POLICY "Allow reads for authenticated users only" ON signups FOR SELECT USING (auth.role() = 'authenticated');

-- Create storage bucket for ID documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-uploads', 'ID Document Uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create a private storage bucket for form submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('formdata', 'Form Submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Allow only authenticated uploads to formdata bucket
CREATE POLICY "Allow authenticated uploads to formdata" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'formdata'
  );

-- Allow only authenticated users to read from formdata bucket
CREATE POLICY "Allow authenticated access to formdata" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'formdata'
  );

-- Modified policy to allow authenticated uploads to id-uploads - enforce owner check
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'id-uploads' AND auth.uid() = owner
  );

-- Modified policy to allow authenticated users to read only their own uploads in id-uploads
CREATE POLICY "Allow authenticated downloads" ON storage.objects 
  FOR SELECT TO authenticated USING (
    bucket_id = 'id-uploads' AND auth.uid() = owner
  );

-- Create indices for better performance
CREATE INDEX idx_signups_account_type ON signups(account_type);
CREATE INDEX idx_signups_created_at ON signups(created_at);