# Enhanced Solution with Existing Edge Function

Great news! We can leverage your existing `new-signup-email` Edge Function with minimal changes.

## The Complete Solution

1. **Fix the Database Trigger**: Replace the HTTP-dependent function with one that logs notifications
2. **Enhance your Edge Function**: Add a polling mechanism to check for pending notifications
3. **Keep Both Approaches**: Support both direct calls and scheduled polling

## Step 1: Update the Database

Run the `update_existing_approach.sql` script in the Supabase SQL Editor, which:

- Creates a `signup_logs` table for tracking notifications
- Creates a `log_signup_action` function for adding log entries
- Updates the `notify_support` trigger function to log notifications instead of using HTTP

## Step 2: Enhance the Edge Function

Replace your current Edge Function with the enhanced version in `modified_check_notifications.ts`:

```bash
# Save the current function as backup
supabase functions download --project-ref uygbqnrqwjvzdfbqeipf new-signup-email

# Deploy the enhanced version
supabase functions deploy new-signup-email
```

This enhanced function:

- Maintains the original behavior for direct calls
- Adds the ability to poll for pending notifications
- Processes notification logs when called without specific signup data

## Step 3: Set Up Scheduled Execution

Create a GitHub Action to regularly call your function:

```yaml
name: Check Pending Notifications

on:
  schedule:
    - cron: '*/15 * * * *' # Run every 15 minutes
  workflow_dispatch: # Allow manual triggering

jobs:
  check-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Invoke Notification Function
        run: |
          curl -X POST "https://uygbqnrqwjvzdfbqeipf.functions.supabase.co/new-signup-email" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d "{}"
```

## How It Works

1. When a new business/merchant signup occurs:

   - The database trigger logs it in `signup_logs` with action='notification_needed'
   - No HTTP calls are attempted from the database

2. Notifications are sent in two ways:

   - **Direct API calls**: Still work if you manually call the function with signup data
   - **Scheduled polling**: The function checks for pending notifications in the logs table

3. After sending a notification:
   - The log entry is updated to action='notification_sent'
   - This prevents duplicate notifications

## Benefits

- **Backward Compatibility**: Works with your existing edge function
- **No HTTP Extension Required**: Database operations don't depend on HTTP
- **Reliable Delivery**: Even if notifications fail temporarily, they'll be retried
- **Complete Data**: All form submissions are saved with full details
- **Maintains Both Approaches**: Supports both API-triggered and scheduled notifications

## Testing

1. Submit a form with account_type = business
2. Check the `signup_logs` table for an entry with action='notification_needed'
3. Call your edge function without parameters (or wait for the scheduled run)
4. Verify the notification is sent and the log entry is updated to action='notification_sent'
