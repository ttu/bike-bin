// Notify Support Edge Function
// Triggered by database webhook on support_requests insert.
// Sends email notification to the support team.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SupportRequestPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string | null;
    email: string | null;
    subject: string;
    body: string;
    screenshot_path: string | null;
    app_version: string | null;
    device_info: string | null;
    status: string;
    created_at: string;
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify request is from Supabase (webhook sends service_role key)
    const authHeader = req.headers.get('Authorization');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload: SupportRequestPayload = await req.json();
    const record = payload.record;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the user's display name if authenticated
    let displayName = 'Anonymous';
    if (record.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', record.user_id)
        .single();

      if (profile?.display_name) {
        displayName = profile.display_name;
      }
    }

    // Build email body
    const emailBody = [
      `New support request from ${displayName}`,
      '',
      `Subject: ${record.subject}`,
      `Message: ${record.body}`,
      '',
      `User ID: ${record.user_id ?? 'N/A (unauthenticated)'}`,
      `Email: ${record.email ?? 'N/A'}`,
      `App Version: ${record.app_version ?? 'N/A'}`,
      `Device Info: ${record.device_info ?? 'N/A'}`,
      `Screenshot: ${record.screenshot_path ? 'Yes' : 'No'}`,
      '',
      `Request ID: ${record.id}`,
      `Created: ${record.created_at}`,
    ].join('\n');

    // Send email via Resend (or similar email provider)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supportEmail = Deno.env.get('SUPPORT_EMAIL') ?? 'support@bikebin.app';

    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Bike Bin Support <noreply@bikebin.app>',
          to: [supportEmail],
          subject: `[Support] ${record.subject}`,
          text: emailBody,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Failed to send support email:', errorText);
      }
    } else {
      // Log if no email provider configured (development)
      console.log('Support request received (no email provider configured):');
      console.log(emailBody);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('notify-support error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
