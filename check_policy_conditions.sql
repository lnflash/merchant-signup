-- Check the specific conditions of your existing anonymous insert policy
SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'signups' 
AND policyname = 'Allow anonymous inserts';

-- Check for conflicting policies that might override the anonymous insert policy
SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'signups' 
AND cmd = 'INSERT' 
AND policyname != 'Allow anonymous inserts';

-- Check if the RLS is actually enabled on the table
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'signups';

-- Check the ownership of the table (might affect RLS behavior)
SELECT 
    tableowner
FROM pg_tables 
WHERE tablename = 'signups';

-- Check column-specific issues by testing a minimal insert from the SQL editor
-- (This needs to be run as the 'anon' role to accurately test)
DO $$
BEGIN
    SET LOCAL ROLE anon;
    
    INSERT INTO signups (
        name, 
        phone, 
        account_type, 
        terms_accepted
    ) VALUES (
        'Test User',
        '+1234567890',
        'personal',
        true
    );
    
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Insert failed: %', SQLERRM;
END
$$;

-- Update the existing policy if needed to ensure it properly allows anon inserts
-- (Only run this after checking the current policy conditions)
-- ALTER POLICY "Allow anonymous inserts" ON signups
-- FOR INSERT TO anon
-- WITH CHECK (true);

-- Check if there's a trigger on the table causing the insert to fail
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'signups';