// Admin Enforce Sanction Edge Function
// Secret-protected. Not callable from the app.
// Purges all data for a sanctioned user and blocks their OAuth identities.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { timingSafeEqual } from 'https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Maximum IDs per Supabase `.in()` call to stay within URL length limits */
const IN_CHUNK_SIZE = 500;

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

function optionalValidatedString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? value : undefined;
}

function optionalValidatedUuidArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !UUID_RE.test(id)) return undefined;
    out.push(id);
  }
  return out;
}

async function purgeSanctionedUser(
  supabase: SupabaseClient,
  userId: string,
  validatedReason: string | undefined,
  validatedReportIds: string[] | undefined,
): Promise<Response> {
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
        provider_user_id: identity.provider_id,
        notes: validatedReason ?? null,
      },
      { onConflict: 'provider,provider_user_id' },
    );
    assertNoError(blockError, 'upsert blocked_oauth_identities');
    counts.blockedIdentities++;
  }

  // 4. Collect storage paths before deleting rows
  const storagePaths: { bucket: string; path: string }[] = [];

  // Avatar
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();
  assertNoError(profileError, 'load profile for storage paths');
  if (profileData?.avatar_url) {
    storagePaths.push({ bucket: 'avatars', path: profileData.avatar_url });
  }

  // Item photos
  const { data: userItems, error: userItemsError } = await supabase
    .from('items')
    .select('id')
    .eq('owner_id', userId);
  assertNoError(userItemsError, 'load user items for storage paths');
  if (userItems && userItems.length > 0) {
    const itemIds = userItems.map((i) => i.id);
    const { data: itemPhotos, error: itemPhotosError } = await supabase
      .from('item_photos')
      .select('storage_path')
      .in('item_id', itemIds);
    assertNoError(itemPhotosError, 'load item photos for storage paths');
    for (const p of itemPhotos ?? []) {
      if (p.storage_path) storagePaths.push({ bucket: 'item-photos', path: p.storage_path });
    }
  }

  // Bike photos
  const { data: userBikes, error: userBikesError } = await supabase
    .from('bikes')
    .select('id')
    .eq('owner_id', userId);
  assertNoError(userBikesError, 'load user bikes for storage paths');
  if (userBikes && userBikes.length > 0) {
    const bikeIds = userBikes.map((b) => b.id);
    const { data: bikePhotos, error: bikePhotosError } = await supabase
      .from('bike_photos')
      .select('storage_path')
      .in('bike_id', bikeIds);
    assertNoError(bikePhotosError, 'load bike photos for storage paths');
    for (const p of bikePhotos ?? []) {
      if (p.storage_path) storagePaths.push({ bucket: 'item-photos', path: p.storage_path });
    }
  }

  // Export files
  const { data: exportRequests, error: exportRequestsError } = await supabase
    .from('export_requests')
    .select('storage_path')
    .eq('user_id', userId)
    .not('storage_path', 'is', null);
  assertNoError(exportRequestsError, 'load export requests for storage paths');
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
    if (error && !error.message?.includes('Not Found')) {
      throw new Error(`storage remove ${bucket}: ${error.message}`);
    }
    counts.storageObjects += paths.length;
  }

  // 6. Close reports before purging data (IDs needed while rows still exist)
  const { data: closedUserReports, error: closeUserErr } = await supabase
    .from('reports')
    .update({ status: 'closed' })
    .eq('target_type', 'user')
    .eq('target_id', userId)
    .select('id');
  assertNoError(closeUserErr, 'close reports targeting user');
  counts.reportsClosed = closedUserReports?.length ?? 0;

  const ownedItemIds = (userItems ?? []).map((i) => i.id);
  const ownedItemPhotoIds: string[] = [];
  if (ownedItemIds.length > 0) {
    const { data: photoRows, error: photoIdsErr } = await supabase
      .from('item_photos')
      .select('id')
      .in('item_id', ownedItemIds);
    assertNoError(photoIdsErr, 'load item_photo ids for report closure');
    for (const p of photoRows ?? []) ownedItemPhotoIds.push(p.id);
  }

  const { data: ownedMessages, error: ownedMsgErr } = await supabase
    .from('messages')
    .select('id')
    .eq('sender_id', userId);
  assertNoError(ownedMsgErr, 'load message ids for report closure');
  const ownedMessageIds = (ownedMessages ?? []).map((m) => m.id);

  const contentIds = [...ownedItemIds, ...ownedItemPhotoIds, ...ownedMessageIds];
  for (let i = 0; i < contentIds.length; i += IN_CHUNK_SIZE) {
    const chunk = contentIds.slice(i, i + IN_CHUNK_SIZE);
    const { data: closedContentReports, error: closeContentErr } = await supabase
      .from('reports')
      .update({ status: 'closed' })
      .in('target_type', ['item', 'item_photo', 'message'])
      .in('target_id', chunk)
      .select('id');
    assertNoError(closeContentErr, 'close reports targeting user content');
    counts.reportsClosed += closedContentReports?.length ?? 0;
  }

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

  counts.messages = deleteCount(
    await supabase.from('messages').delete().eq('sender_id', userId).select('id'),
    'delete messages',
  );

  counts.conversationParticipants = deleteCount(
    await supabase.from('conversation_participants').delete().eq('user_id', userId).select('id'),
    'delete conversation_participants',
  );

  const { data: emptyConvos, error: emptyConvosError } = await supabase.rpc(
    'find_empty_conversations',
  );
  assertNoError(emptyConvosError, 'find empty conversations');
  if (emptyConvos && emptyConvos.length > 0) {
    const emptyIds = emptyConvos.map((c: { id: string }) => c.id);
    counts.conversationsDeleted = deleteCount(
      await supabase.from('conversations').delete().in('id', emptyIds).select('id'),
      'delete empty conversations',
    );
  }

  counts.ratings = deleteCount(
    await supabase
      .from('ratings')
      .delete()
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .select('id'),
    'delete ratings',
  );

  counts.borrowRequests = deleteCount(
    await supabase.from('borrow_requests').delete().eq('requester_id', userId).select('id'),
    'delete borrow_requests',
  );

  counts.exportRequests = deleteCount(
    await supabase.from('export_requests').delete().eq('user_id', userId).select('id'),
    'delete export_requests',
  );

  counts.subscriptions = deleteCount(
    await supabase.from('subscriptions').delete().eq('user_id', userId).select('id'),
    'delete subscriptions',
  );

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

  counts.reportsDeleted = deleteCount(
    await supabase.from('reports').delete().eq('reporter_id', userId).select('id'),
    'delete reports by user',
  );

  const { error: profileDeleteError } = await supabase.from('profiles').delete().eq('id', userId);
  assertNoError(profileDeleteError, 'delete profile');

  const { error: logError } = await supabase.from('moderation_enforcement_log').insert({
    sanctioned_user_id: userId,
    reason: validatedReason ?? null,
    report_ids: validatedReportIds ?? null,
  });
  assertNoError(logError, 'insert moderation_enforcement_log');

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
  assertNoError(authDeleteError, 'delete auth user');

  return new Response(JSON.stringify({ success: true, counts }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Request body must be a JSON object' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userId, reason, relatedReportIds } = body as Record<string, unknown>;

    if (!userId || typeof userId !== 'string' || !UUID_RE.test(userId)) {
      return new Response(
        JSON.stringify({ error: 'userId is required and must be a valid UUID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (reason !== undefined && typeof reason !== 'string') {
      return new Response(JSON.stringify({ error: 'reason must be a string when provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (relatedReportIds !== undefined) {
      if (
        !Array.isArray(relatedReportIds) ||
        !relatedReportIds.every((id) => typeof id === 'string' && UUID_RE.test(id))
      ) {
        return new Response(
          JSON.stringify({ error: 'relatedReportIds must be an array of valid UUIDs' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    const validatedReason = optionalValidatedString(reason);
    const validatedReportIds = optionalValidatedUuidArray(relatedReportIds);

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

    return await purgeSanctionedUser(supabase, userId, validatedReason, validatedReportIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('admin-enforce-sanction error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
