// Delete Account Edge Function
// GDPR-compliant account deletion with data anonymization.
// Requires authenticated user. Uses service role key for privileged operations.
//
// Steps:
// 1. Delete user's items and item_photos
// 2. Anonymize ratings and messages (null FKs to profiles; requires nullable columns)
// 3. Delete conversation_participants, borrow_requests, etc.
// 4. Delete export ZIP files from storage
// 5. Delete profile
// 6. Delete auth user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Rate limit: 1 delete attempt per user per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const recentAttempts = new Map<string, number>();

function assertNoFnError(error: unknown, step: string): void {
  if (error) {
    let msg: string;
    if (typeof error === 'object' && error !== null && 'message' in error) {
      msg = String((error as { message: string }).message);
    } else if (typeof error === 'string') {
      msg = error;
    } else {
      msg = JSON.stringify(error);
    }
    throw new Error(`${step}: ${msg}`);
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(status: number, body: unknown, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: extraHeaders ? { ...JSON_HEADERS, ...extraHeaders } : JSON_HEADERS,
  });
}

interface ServerEnv {
  supabaseUrl: string;
  supabaseServiceKey: string;
  supabaseAnonKey: string;
}

function readServerEnv(): ServerEnv | undefined {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) return undefined;
  return { supabaseUrl, supabaseServiceKey, supabaseAnonKey };
}

// Best-effort, per-isolate rate limit. Does not survive cold starts and is not
// shared across isolates — for durable cross-isolate enforcement, persist to a
// shared store (DB / gateway).
function evictExpiredAttempts(now: number): void {
  for (const [key, ts] of recentAttempts) {
    if (now - ts >= RATE_LIMIT_WINDOW_MS) recentAttempts.delete(key);
  }
}

function checkRateLimit(userId: string): number | undefined {
  const now = Date.now();
  evictExpiredAttempts(now);
  const lastAttempt = recentAttempts.get(userId);
  if (lastAttempt && now - lastAttempt < RATE_LIMIT_WINDOW_MS) {
    return Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastAttempt)) / 1000);
  }
  return undefined;
}

function recordAttempt(userId: string): void {
  recentAttempts.set(userId, Date.now());
}

type ServiceClient = ReturnType<typeof createClient>;

async function purgeUserData(supabase: ServiceClient, userId: string): Promise<void> {
  const { data: userItems, error: itemsSelectError } = await supabase
    .from('items')
    .select('id')
    .eq('owner_id', userId);
  assertNoFnError(itemsSelectError, 'select items');

  if (userItems && userItems.length > 0) {
    const itemIds = userItems.map((item: { id: string }) => item.id);
    const { error: photosError } = await supabase
      .from('item_photos')
      .delete()
      .in('item_id', itemIds);
    assertNoFnError(photosError, 'delete item_photos');
  }

  const { error: deleteItemsError } = await supabase.from('items').delete().eq('owner_id', userId);
  assertNoFnError(deleteItemsError, 'delete items');

  const { error: ratingFromError } = await supabase
    .from('ratings')
    .update({ from_user_id: null })
    .eq('from_user_id', userId);
  assertNoFnError(ratingFromError, 'anonymize ratings (from_user_id)');

  const { error: ratingToError } = await supabase
    .from('ratings')
    .update({ to_user_id: null })
    .eq('to_user_id', userId);
  assertNoFnError(ratingToError, 'anonymize ratings (to_user_id)');

  const { error: messagesError } = await supabase
    .from('messages')
    .update({ sender_id: null })
    .eq('sender_id', userId);
  assertNoFnError(messagesError, 'anonymize messages');

  const tableDeletions: Array<[string, string, string]> = [
    ['conversation_participants', 'user_id', 'delete conversation_participants'],
    ['borrow_requests', 'requester_id', 'delete borrow_requests'],
    ['support_requests', 'user_id', 'delete support_requests'],
    ['saved_locations', 'user_id', 'delete saved_locations'],
    ['group_members', 'user_id', 'delete group_members'],
    ['notifications', 'user_id', 'delete notifications'],
    ['reports', 'reporter_id', 'delete reports'],
  ];
  for (const [table, column, step] of tableDeletions) {
    const { error } = await supabase.from(table).delete().eq(column, userId);
    assertNoFnError(error, step);
  }

  const { data: exportRequests, error: exportSelectError } = await supabase
    .from('export_requests')
    .select('storage_path')
    .eq('user_id', userId)
    .not('storage_path', 'is', null);
  assertNoFnError(exportSelectError, 'select export_requests');

  const storagePaths =
    exportRequests
      ?.map((e: { storage_path: string | null }) => e.storage_path)
      .filter((p: string | null): p is string => !!p) ?? [];
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('data-exports')
      .remove(storagePaths);
    assertNoFnError(storageError, 'remove export files from storage');
  }

  const { error: exportRowsError } = await supabase
    .from('export_requests')
    .delete()
    .eq('user_id', userId);
  assertNoFnError(exportRowsError, 'delete export_requests');

  const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
  assertNoFnError(profileError, 'delete profile');

  // Auth user is deleted last so any failure above leaves the user able to retry.
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
  assertNoFnError(authDeleteError, 'delete auth user');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const env = readServerEnv();
    if (!env) {
      return jsonResponse(500, { error: 'Server misconfigured' });
    }

    const supabaseUser = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const userId = user.id;

    const retryAfterSecs = checkRateLimit(userId);
    if (retryAfterSecs !== undefined) {
      return jsonResponse(
        429,
        { error: 'Too many requests' },
        {
          'Retry-After': String(retryAfterSecs),
        },
      );
    }

    const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);
    await purgeUserData(supabase, userId);

    recordAttempt(userId);
    return jsonResponse(200, { success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('delete-account error:', message);
    return jsonResponse(500, { error: message });
  }
});
