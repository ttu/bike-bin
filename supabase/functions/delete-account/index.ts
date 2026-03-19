// Delete Account Edge Function
// GDPR-compliant account deletion with data anonymization.
// Requires authenticated user. Uses service role key for privileged operations.
//
// Steps:
// 1. Delete user's items and item_photos
// 2. Anonymize conversations (set participant references to null)
// 3. Anonymize ratings (nullify from_user_id, keep rating data)
// 4. Delete support_requests for this user
// 5. Delete saved_locations
// 6. Delete group_members entries
// 7. Delete notifications
// 8. Delete profile
// 9. Delete auth user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Delete item_photos for user's items
    const { data: userItems } = await supabase.from('items').select('id').eq('owner_id', userId);

    if (userItems && userItems.length > 0) {
      const itemIds = userItems.map((item) => item.id);
      await supabase.from('item_photos').delete().in('item_id', itemIds);
    }

    // 2. Delete items
    await supabase.from('items').delete().eq('owner_id', userId);

    // 3. Anonymize ratings (set from_user_id to null for ratings this user gave)
    await supabase.from('ratings').update({ from_user_id: null }).eq('from_user_id', userId);

    // Also anonymize ratings received (set to_user_id to null)
    await supabase.from('ratings').update({ to_user_id: null }).eq('to_user_id', userId);

    // 4. Anonymize messages (set sender_id to null)
    await supabase.from('messages').update({ sender_id: null }).eq('sender_id', userId);

    // 5. Delete conversation_participants entries
    await supabase.from('conversation_participants').delete().eq('user_id', userId);

    // 6. Delete borrow_requests (both as requester and item owner)
    await supabase.from('borrow_requests').delete().eq('requester_id', userId);

    // 7. Delete support_requests
    await supabase.from('support_requests').delete().eq('user_id', userId);

    // 8. Delete saved_locations
    await supabase.from('saved_locations').delete().eq('user_id', userId);

    // 9. Delete group_members
    await supabase.from('group_members').delete().eq('user_id', userId);

    // 10. Delete notifications
    await supabase.from('notifications').delete().eq('user_id', userId);

    // 11. Delete reports by this user
    await supabase.from('reports').delete().eq('reporter_id', userId);

    // 12. Delete profile
    await supabase.from('profiles').delete().eq('id', userId);

    // 13. Delete auth user (must be last)
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
