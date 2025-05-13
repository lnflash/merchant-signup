# Fixed: Database Trigger Using HTTP Extension

## The Problem

We found that your form submissions are failing because a database trigger is trying to use the PostgreSQL HTTP extension. Specifically, the `notify_support` trigger function contains this code:

```sql
perform
  http_post(
    url := 'https://uygbqnrqwjvzdfbqeipf.functions.supabase.co/new-signup-email',
    headers := json_build_object('Content-Type', 'application/json'),
    body := json_build_object('email', NEW.email, 'account_type', NEW.account_type, 'id', NEW.id)::text
  );
```

This attempts to call your Edge Function directly from the database, but your Supabase instance either:

1. Doesn't have the HTTP extension installed, or
2. Has it installed but with permissions restrictions

## The Solution

Run the `fix_http_trigger.sql` script in your Supabase SQL Editor. This will:

1. Replace the `notify_support` function with a version that doesn't use HTTP
2. Add a `notification_sent` column to the `signups` table (if it doesn't exist)
3. Create a `signup_logs` table for tracking events (if it doesn't exist)
4. Create a `log_signup_action` function (if it doesn't exist)

This modified approach:

- Marks new business/merchant signups with `notification_sent = false`
- Avoids using HTTP extension completely
- Preserves all the form data in the database

## How to Handle Notifications

Instead of triggering email notifications directly from the database:

1. Your existing Edge Function (`new-signup-email`) can be modified to:

   - Periodically check for signups with `notification_sent = false`
   - Send notifications for those records
   - Update them to `notification_sent = true`

2. You can set up a scheduled GitHub Action to call this function:

```yaml
name: Check Pending Notifications
on:
  schedule:
    - cron: '*/10 * * * *' # Run every 10 minutes
  workflow_dispatch: # Allow manual triggering
jobs:
  check-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notification Check
        run: |
          curl -X POST https://uygbqnrqwjvzdfbqeipf.functions.supabase.co/check-pending-notifications \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

## Why This Works

This solution:

1. Breaks the dependency on the HTTP extension
2. Maintains the notification flow using Edge Functions (which already have HTTP capability)
3. Allows the form to properly save all fields including business/merchant details
4. Preserves your existing authentication and security policies
