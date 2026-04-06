// Admin Enforce Sanction Edge Function
// Secret-protected. Not callable from the app.
// Purges all data for a sanctioned user and blocks their OAuth identities.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { timingSafeEqual } from 'https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts';

interface SanctionRequest {
  userId: string;
  reason?: string;
  relatedReportIds?: string[];
}

interface PurgeCounts {
  itemPhotos: number;
  items: number;
  bikePhotos: number;
  bikes: number;
  messages: number;
  conversationParticipants: number;
  conversationsDeleted: number;
  ratings: number;
  borrowRequests: number;
  exportRequests: number;
  subscriptions: number;
  supportRequests: number;
  savedLocations: number;
  groupMembers: number;
  notifications: number;
  reportsClosed: number;
  reportsDeleted: number;
  storageObjects: number;
  blockedIdentities: number;
}

function assertNoError(error: unknown, step: string): void {
  if (error) {
    const msg =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: string }).message)
        : String(error);
    throw new Error(`${step}: ${msg}`);
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.byteLength !== bBytes.byteLength) return false;
  return timingSafeEqual(aBytes, bBytes);
}

function deleteCount(result: { data: unknown[] | null; error: unknown }, step: string): number {
  assertNoError(result.error, step);
  return result.data?.length ?? 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Validate secret
    const adminSecret = Deno.env.get('ADMIN_MODERATION_SECRET');
    if (!adminSecret) {
      console.error('ADMIN_MODERATION_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const providedSecret = req.headers.get('x-admin-secret') ?? '';
    if (!constantTimeEqual(providedSecret, adminSecret)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: SanctionRequest = await req.json();
    const { userId, reason, relatedReportIds } = body;

    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      const missing = [
        !supabaseUrl && 'SUPABASE_URL',
        !supabaseServiceKey && 'SUPABASE_SERVICE_ROLE_KEY',
      ]
        .filter(Boolean)
        .join(', ');
      console.error(`Missing environment variable(s): ${missing}`);
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const counts: PurgeCounts = {
      itemPhotos: 0,
      items: 0,
      bikePhotos: 0,
      bikes: 0,
      messages: 0,
      conversationParticipants: 0,
      conversationsDeleted: 0,
      ratings: 0,
      borrowRequests: 0,
      exportRequests: 0,
      subscriptions: 0,
      supportRequests: 0,
      savedLocations: 0,
      groupMembers: 0,
      notifications: 0,
      reportsClosed: 0,
      reportsDeleted: 0,
      storageObjects: 0,
      blockedIdentities: 0,
    };

    // 2. Load identities via Auth Admin API
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Upsert blocked_oauth_identities
    const identities = userData.user.identities ?? [];
    for (const identity of identities) {
      const { error: blockError } = await supabase.from('blocked_oauth_identities').upsert(
        {
          provider: identity.provider,
          provider_user_id: identity.id,
          notes: reason ?? null,
        },
        { onConflict: 'provider,provider_user_id' },
      );
      assertNoError(blockError, 'upsert blocked_oauth_identities');
      counts.blockedIdentities++;
    }

    // 4. Collect storage paths before deleting rows
    const storagePaths: { bucket: string; path: string }[] = [];

    // Avatar
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();
    if (profileData?.avatar_url) {
      storagePaths.push({ bucket: 'avatars', path: profileData.avatar_url });
    }

    // Item photos
    const { data: userItems } = await supabase.from('items').select('id').eq('owner_id', userId);
    if (userItems && userItems.length > 0) {
      const itemIds = userItems.map((i) => i.id);
      const { data: itemPhotos } = await supabase
        .from('item_photos')
        .select('storage_path')
        .in('item_id', itemIds);
      for (const p of itemPhotos ?? []) {
        if (p.storage_path) storagePaths.push({ bucket: 'item-photos', path: p.storage_path });
      }
    }

    // Bike photos
    const { data: userBikes } = await supabase.from('bikes').select('id').eq('owner_id', userId);
    if (userBikes && userBikes.length > 0) {
      const bikeIds = userBikes.map((b) => b.id);
      const { data: bikePhotos } = await supabase
        .from('bike_photos')
        .select('storage_path')
        .in('bike_id', bikeIds);
      for (const p of bikePhotos ?? []) {
        if (p.storage_path) storagePaths.push({ bucket: 'item-photos', path: p.storage_path });
      }
    }

    // Export files
    const { data: exportRequests } = await supabase
      .from('export_requests')
      .select('storage_path')
      .eq('user_id', userId)
      .not('storage_path', 'is', null);
    for (const e of exportRequests ?? []) {
      if (e.storage_path) storagePaths.push({ bucket: 'data-exports', path: e.storage_path });
    }

    // 5. Delete storage objects (grouped by bucket)
    const byBucket = new Map<string, string[]>();
    for (const { bucket, path } of storagePaths) {
      const paths = byBucket.get(bucket) ?? [];
      paths.push(path);
      byBucket.set(bucket, paths);
    }
    for (const [bucket, paths] of byBucket) {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      // Handle 404s gracefully on retry — not an error
      if (error && !error.message?.includes('Not Found')) {
        console.warn(`Storage cleanup warning for ${bucket}:`, error.message);
      }
      counts.storageObjects += paths.length;
    }

    // 6. Data purge
    // Item photos + items
    if (userItems && userItems.length > 0) {
      const itemIds = userItems.map((i) => i.id);
      counts.itemPhotos = deleteCount(
        await supabase.from('item_photos').delete().in('item_id', itemIds).select('id'),
        'delete item_photos',
      );
    }
    counts.items = deleteCount(
      await supabase.from('items').delete().eq('owner_id', userId).select('id'),
      'delete items',
    );

    // Bike photos + bikes
    if (userBikes && userBikes.length > 0) {
      const bikeIds = userBikes.map((b) => b.id);
      counts.bikePhotos = deleteCount(
        await supabase.from('bike_photos').delete().in('bike_id', bikeIds).select('id'),
        'delete bike_photos',
      );
    }
    counts.bikes = deleteCount(
      await supabase.from('bikes').delete().eq('owner_id', userId).select('id'),
      'delete bikes',
    );

    // Messages — DELETE, do not anonymize
    counts.messages = deleteCount(
      await supabase.from('messages').delete().eq('sender_id', userId).select('id'),
      'delete messages',
    );

    // Conversation participants
    counts.conversationParticipants = deleteCount(
      await supabase.from('conversation_participants').delete().eq('user_id', userId).select('id'),
      'delete conversation_participants',
    );

    // Clean up empty conversations (zero participants AND zero messages)
    const { data: emptyConvos } = await supabase.rpc('find_empty_conversations');
    if (emptyConvos && emptyConvos.length > 0) {
      const emptyIds = emptyConvos.map((c: { id: string }) => c.id);
      counts.conversationsDeleted = deleteCount(
        await supabase.from('conversations').delete().in('id', emptyIds).select('id'),
        'delete empty conversations',
      );
    }

    // Ratings — DELETE
    counts.ratings = deleteCount(
      await supabase
        .from('ratings')
        .delete()
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .select('id'),
      'delete ratings',
    );

    // Borrow requests (as requester; owner-side cascaded with items)
    counts.borrowRequests = deleteCount(
      await supabase.from('borrow_requests').delete().eq('requester_id', userId).select('id'),
      'delete borrow_requests',
    );

    // Export requests
    counts.exportRequests = deleteCount(
      await supabase.from('export_requests').delete().eq('user_id', userId).select('id'),
      'delete export_requests',
    );

    // Subscriptions
    counts.subscriptions = deleteCount(
      await supabase.from('subscriptions').delete().eq('user_id', userId).select('id'),
      'delete subscriptions',
    );

    // Support requests, saved locations, group members, notifications
    counts.supportRequests = deleteCount(
      await supabase.from('support_requests').delete().eq('user_id', userId).select('id'),
      'delete support_requests',
    );
    counts.savedLocations = deleteCount(
      await supabase.from('saved_locations').delete().eq('user_id', userId).select('id'),
      'delete saved_locations',
    );
    counts.groupMembers = deleteCount(
      await supabase.from('group_members').delete().eq('user_id', userId).select('id'),
      'delete group_members',
    );
    counts.notifications = deleteCount(
      await supabase.from('notifications').delete().eq('user_id', userId).select('id'),
      'delete notifications',
    );

    // Close reports targeting this user's profile
    const { data: closedReports, error: closeErr } = await supabase
      .from('reports')
      .update({ status: 'closed' })
      .eq('target_type', 'user')
      .eq('target_id', userId)
      .select('id');
    assertNoError(closeErr, 'close reports targeting user');
    counts.reportsClosed = closedReports?.length ?? 0;

    // Delete reports filed by this user
    counts.reportsDeleted = deleteCount(
      await supabase.from('reports').delete().eq('reporter_id', userId).select('id'),
      'delete reports by user',
    );

    // Delete profile
    const { error: profileDeleteError } = await supabase.from('profiles').delete().eq('id', userId);
    assertNoError(profileDeleteError, 'delete profile');

    // 7. Log enforcement action before deleting the auth user
    const { error: logError } = await supabase.from('moderation_enforcement_log').insert({
      sanctioned_user_id: userId,
      reason: reason ?? null,
      report_ids: relatedReportIds ?? null,
    });
    assertNoError(logError, 'insert moderation_enforcement_log');

    // 8. Delete auth user last
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    assertNoError(authDeleteError, 'delete auth user');

    return new Response(JSON.stringify({ success: true, counts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('admin-enforce-sanction error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
