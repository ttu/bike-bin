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
    const msg =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: string }).message)
        : String(error);
    throw new Error(`${step}: ${msg}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify the user's JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client to verify identity
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

    // Rate limit check
    const lastAttempt = recentAttempts.get(userId);
    const now = Date.now();
    if (lastAttempt && now - lastAttempt < RATE_LIMIT_WINDOW_MS) {
      const retryAfterSecs = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastAttempt)) / 1000);
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSecs),
        },
      });
    }
    recentAttempts.set(userId, now);

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userItems, error: itemsSelectError } = await supabase
      .from('items')
      .select('id')
      .eq('owner_id', userId);
    assertNoFnError(itemsSelectError, 'select items');

    if (userItems && userItems.length > 0) {
      const itemIds = userItems.map((item) => item.id);
      const { error: photosError } = await supabase
        .from('item_photos')
        .delete()
        .in('item_id', itemIds);
      assertNoFnError(photosError, 'delete item_photos');
    }

    const { error: deleteItemsError } = await supabase
      .from('items')
      .delete()
      .eq('owner_id', userId);
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

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('user_id', userId);
    assertNoFnError(participantsError, 'delete conversation_participants');

    const { error: borrowError } = await supabase
      .from('borrow_requests')
      .delete()
      .eq('requester_id', userId);
    assertNoFnError(borrowError, 'delete borrow_requests');

    const { error: supportError } = await supabase
      .from('support_requests')
      .delete()
      .eq('user_id', userId);
    assertNoFnError(supportError, 'delete support_requests');

    const { error: locationsError } = await supabase
      .from('saved_locations')
      .delete()
      .eq('user_id', userId);
    assertNoFnError(locationsError, 'delete saved_locations');

    const { error: groupMembersError } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId);
    assertNoFnError(groupMembersError, 'delete group_members');

    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    assertNoFnError(notificationsError, 'delete notifications');

    const { error: reportsError } = await supabase
      .from('reports')
      .delete()
      .eq('reporter_id', userId);
    assertNoFnError(reportsError, 'delete reports');

    const { data: exportRequests, error: exportSelectError } = await supabase
      .from('export_requests')
      .select('storage_path')
      .eq('user_id', userId)
      .not('storage_path', 'is', null);
    assertNoFnError(exportSelectError, 'select export_requests');

    if (exportRequests && exportRequests.length > 0) {
      const storagePaths = exportRequests
        .map((e) => e.storage_path)
        .filter((p): p is string => !!p);
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('data-exports')
          .remove(storagePaths);
        assertNoFnError(storageError, 'remove export files from storage');
      }
    }

    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    assertNoFnError(profileError, 'delete profile');

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to delete auth user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('delete-account error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
