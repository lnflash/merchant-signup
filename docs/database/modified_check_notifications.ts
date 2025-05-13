// This adapts your existing function to check for pending notifications
// It combines your existing new-signup-email with our polling approach

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY');
const MAILGUN_DOMAIN = Deno.env.get('MAILGUN_DOMAIN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async req => {
  try {
    // Check if this is a direct call with signup data
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        // Try to parse as direct notification (original behavior)
        const { email, account_type, id } = await req.json();

        // If we got valid data, handle it directly (original function behavior)
        if (email && account_type && id) {
          console.log('📩 Direct notification received', { email, account_type, id });
          return await sendNotification({ email, account_type, id });
        }
      } catch (parseError) {
        // Couldn't parse as direct notification, continue with polling
        console.log('Not a direct notification, checking for pending notifications');
      }
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Find notifications that need to be sent
    // Check the signup_logs table for 'notification_needed' actions
    const { data: pendingLogs, error: logsError } = await supabase
      .from('signup_logs')
      .select(
        `
        id,
        signup_id,
        created_at,
        details
      `
      )
      .eq('action', 'notification_needed')
      .order('created_at', { ascending: true })
      .limit(10);

    if (logsError) {
      console.error('Error fetching notification logs:', logsError);
      return new Response(JSON.stringify({ error: logsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingLogs?.length || 0} pending notifications in logs`);

    // Process each pending notification
    const results = [];

    for (const log of pendingLogs || []) {
      try {
        // Get the signup details
        const { data: signup, error: signupError } = await supabase
          .from('signups')
          .select('*')
          .eq('id', log.signup_id)
          .single();

        if (signupError) {
          console.error(`Error fetching signup ${log.signup_id}:`, signupError);
          results.push({
            log_id: log.id,
            signup_id: log.signup_id,
            status: 'error',
            error: signupError.message,
          });
          continue;
        }

        if (!signup) {
          console.error(`Signup ${log.signup_id} not found`);
          results.push({
            log_id: log.id,
            signup_id: log.signup_id,
            status: 'error',
            error: 'Signup not found',
          });

          // Mark this log as processed so we don't keep trying
          await supabase
            .from('signup_logs')
            .update({ action: 'notification_failed' })
            .eq('id', log.id);

          continue;
        }

        // Send notification for this signup
        const notificationResult = await sendNotification({
          email: signup.email,
          account_type: signup.account_type,
          id: signup.id,
          // Include additional info
          name: signup.name,
          business_name: signup.business_name,
          wants_terminal: signup.wants_terminal,
        });

        // Parse the notification result
        let resultData;
        try {
          const resultText = await notificationResult.text();
          resultData = JSON.parse(resultText);
        } catch (parseError) {
          resultData = { success: notificationResult.ok };
        }

        if (notificationResult.ok) {
          // Mark this log as processed
          await supabase
            .from('signup_logs')
            .update({ action: 'notification_sent' })
            .eq('id', log.id);

          results.push({
            log_id: log.id,
            signup_id: log.signup_id,
            status: 'sent',
          });
        } else {
          results.push({
            log_id: log.id,
            signup_id: log.signup_id,
            status: 'failed',
            status_code: notificationResult.status,
          });
        }
      } catch (logError) {
        console.error(`Error processing notification log ${log.id}:`, logError);
        results.push({
          log_id: log.id,
          status: 'error',
          error: logError instanceof Error ? logError.message : String(logError),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingLogs?.length || 0,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Function error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// This is your original notification sending function
async function sendNotification(data: {
  email: string;
  account_type: string;
  id: string;
  name?: string;
  business_name?: string;
  wants_terminal?: boolean;
}) {
  console.log('📩 Sending notification for', {
    id: data.id,
    email: data.email,
    account_type: data.account_type,
  });

  const subject = `🛎️ New ${data.account_type} signup awaiting action`;

  // Enhanced HTML template
  const html = `
    <h2>New ${data.account_type} Signup</h2>
    <p><strong>Email:</strong> ${data.email || 'Not provided'}</p>
    <p><strong>Name:</strong> ${data.name || 'Not provided'}</p>
    ${data.business_name ? `<p><strong>Business:</strong> ${data.business_name}</p>` : ''}
    <p><strong>ID:</strong> ${data.id}</p>
    ${
      data.wants_terminal !== undefined
        ? `<p><strong>Wants Terminal:</strong> ${data.wants_terminal ? 'Yes' : 'No'}</p>`
        : ''
    }
    <p>Please log in to your admin dashboard to review and approve this account.</p>
  `;

  const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

  const form = new FormData();
  form.append('from', `Flash Notifier <notify@${MAILGUN_DOMAIN}>`);
  form.append('to', 'support@getflash.io');
  form.append('subject', subject);
  form.append('html', html);

  const response = await fetch(mailgunUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`api:${MAILGUN_API_KEY}`),
    },
    body: form,
  });

  console.log('📬 Mailgun status:', response.status);
  const responseText = await response.text();
  console.log('📬 Mailgun response:', responseText);

  if (!response.ok) {
    console.error('Mailgun error:', responseText);
    return new Response('Failed to send email', { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}
