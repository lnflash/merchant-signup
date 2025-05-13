-- First check if RLS is enabled on the signups table
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'signups';

-- Check existing RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'signups';

-- Check if anon role has insert privileges
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'signups' 
AND grantee = 'anon';

-- If you need to allow anonymous inserts, add this policy
-- (Only if the current policies are too restrictive)
CREATE POLICY "Allow anonymous inserts" 
ON signups FOR INSERT 
TO anon
WITH CHECK (true);

-- Or, if you want a policy that allows inserts but with specific validation
-- (This example allows anon role to insert, but restricts what they can insert)
CREATE POLICY "Allow validated anonymous inserts" 
ON signups FOR INSERT 
TO anon
WITH CHECK (
    account_type IN ('personal', 'business', 'merchant') AND
    terms_accepted = true AND
    name IS NOT NULL AND
    phone IS NOT NULL
);

-- Check storage bucket policies too, as your fallback uses storage
SELECT
    name,
    owner,
    public
FROM storage.buckets
WHERE name IN ('formdata', 'public', 'id-uploads', 'forms');

-- Check storage bucket policies 
SELECT 
    policy_name,
    bucket,
    operations,
    actions,
    roles
FROM storage.policies;