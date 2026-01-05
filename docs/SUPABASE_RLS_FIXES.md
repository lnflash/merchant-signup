# Supabase Row Level Security (RLS) Fixes

This document provides instructions for fixing the Row Level Security (RLS) issues with the Merchant Signup form. Follow these steps to implement the necessary changes in your Supabase dashboard.

## Problem

The main issues identified:

1. The form submissions were failing with error: `Could not find the 'client_version' column of 'signups' in the schema cache`
2. Storage attempts were failing with: `new row violates row-level security policy`

## Solution Overview

We've made the following code changes:

1. Fixed database submission code to avoid non-existent columns
2. Added multiple fallback mechanisms
3. Created updated SQL with proper RLS policies
4. Added a new public storage bucket for form submissions
5. Made auth attempts more robust

## Steps to Implement in Supabase Dashboard

To fully fix the issues, you need to update your Supabase database and storage settings.

### 1. Create New Storage Bucket

1. Login to your Supabase dashboard
2. Go to "Storage" in the left menu
3. Click "Create bucket"
4. Name: `formdata` (only lowercase letters, numbers, dots, and hyphens are allowed)
5. Uncheck "Public bucket" checkbox to ensure the bucket is private
6. Click "Create bucket"

### 2. Update RLS Policies for Storage

#### For the `formdata` bucket:

1. Go to the "Policies" tab of the `formdata` bucket
2. Click "Add policies"
3. Select "Create policies from scratch"
4. Add the following policies:

**INSERT Policy for Authenticated Users Only:**

- Policy name: `Allow authenticated uploads to formdata`
- Target roles: `authenticated`
- Using expression: `bucket_id = 'formdata'`

**SELECT Policy for Authenticated Users Only:**

- Policy name: `Allow authenticated access to formdata`
- Target roles: `authenticated`
- Using expression: `bucket_id = 'formdata'`

#### For the `id-uploads` bucket:

1. Go to the "Policies" tab of the `id-uploads` bucket (or `id_uploads` depending on how it was created)
2. Ensure the existing INSERT policy includes the owner check:
   - Set to: `bucket_id = 'id-uploads' AND auth.uid() = owner`

3. Ensure the existing SELECT policy includes the owner check:
   - Set to: `bucket_id = 'id-uploads' AND auth.uid() = owner`

### 3. Add Missing Columns to the Signups Table

1. Go to "SQL Editor" in the left menu
2. Create a new query
3. Copy and paste the following SQL to add all missing columns:

```sql
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
```

4. Run the query to add these columns

### 4. Update Table RLS Policies

1. Go to "Table Editor" in the left menu
2. Select the `signups` table
3. Go to the "Policies" tab
4. Modify the existing INSERT policy:
   - Ensure it includes both `authenticated` AND `anon` roles
   - Target roles should be: `anon, authenticated`
   - Using expression should be: `true`

### 5. Execute the SQL Script

For a complete fix, you can execute the SQL script in the `db/supabase-updated.sql` file:

1. Go to "SQL Editor" in the left menu
2. Create a new query
3. Paste the content of `db/supabase-updated.sql`
4. Run the query

> **Note:** If you get any bucket creation errors because the buckets already exist with different names, you can modify the SQL or just focus on the RLS policy parts of the script.

## Bucket Naming Convention

Note that Supabase bucket names must:

- Only contain lowercase letters, numbers, dots, and hyphens
- No underscores are allowed

If your existing bucket is named `id_uploads` (with underscore), you'll need to:

1. Either recreate it as `id-uploads` (with hyphen) or
2. Modify the code to use the existing bucket name format

## Testing the Changes

After implementing these changes:

1. Deploy your application with the updated code
2. Use the TestSubmit component to verify that:
   - Direct database insertion works
   - If database insertion fails, storage fallback works
   - The form submission process completes successfully

## Troubleshooting

If you still encounter issues:

1. Check the browser console for error messages
2. Look for specific error codes and messages:
   - `PGRST204` indicates column schema issues
   - Permission errors indicate RLS policy issues
3. Verify your Supabase URL and anon key are correctly propagated to the static build
4. Check that the environment variables are properly passed via `window.ENV`

## Contact

If you need further assistance, please contact the development team.
