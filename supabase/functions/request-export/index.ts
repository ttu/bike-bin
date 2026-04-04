import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit: no completed export in last 24h, no failed in last 1h
    const { data: recentExports } = await supabase
      .from('export_requests')
      .select('status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentExports) {
      const now = new Date();
      const hasRecentCompleted = recentExports.some(
        (e) =>
          e.status === 'completed' &&
          now.getTime() - new Date(e.created_at).getTime() < 24 * 60 * 60 * 1000,
      );
      const hasRecentFailed = recentExports.some(
        (e) =>
          e.status === 'failed' &&
          now.getTime() - new Date(e.created_at).getTime() < 60 * 60 * 1000,
      );
      const hasPendingOrProcessing = recentExports.some(
        (e) => e.status === 'pending' || e.status === 'processing',
      );

      if (hasRecentCompleted || hasRecentFailed || hasPendingOrProcessing) {
        const retryAfter = hasRecentCompleted ? 86400 : 3600;
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        });
      }
    }

    // Insert export request
    const { data: exportRequest, error: insertError } = await supabase
      .from('export_requests')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (insertError || !exportRequest) {
      throw new Error(insertError?.message ?? 'Failed to create export request');
    }

    // Fire-and-forget: invoke generate-export worker
    supabase.functions
      .invoke('generate-export', {
        body: { exportRequestId: exportRequest.id, userId },
      })
      .catch((err) => console.error('Failed to invoke generate-export:', err));

    return new Response(JSON.stringify({ success: true, exportRequestId: exportRequest.id }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('request-export error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
