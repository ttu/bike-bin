// Admin Enforce Sanction Edge Function
// Secret-protected. Not callable from the app.
// Purges all data for a sanctioned user and blocks their OAuth identities.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { timingSafeEqual } from 'https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Maximum IDs per Supabase `.in()` call to stay within URL length limits */
const IN_CHUNK_SIZE = 500;

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

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

function emptyCounts(): PurgeCounts {
  return {
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
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function stringifyError(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null) {
    if ('message' in value) return String((value as { message: unknown }).message);
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable error]';
    }
  }
  return String(value);
}

function assertNoError(error: unknown, step: string): void {
  if (error) throw new Error(`${step}: ${stringifyError(error)}`);
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

function optionalNarrowString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? value : undefined;
}

function optionalNarrowUuidArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !UUID_RE.test(id)) return undefined;
    out.push(id);
  }
  return out;
}

async function chunked<T>(
  ids: readonly string[],
  run: (chunk: string[]) => Promise<T>,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK_SIZE) {
    results.push(await run(ids.slice(i, i + IN_CHUNK_SIZE)));
  }
  return results;
}

async function blockIdentities(
  supabase: SupabaseClient,
  userId: string,
  reason: string | undefined,
  counts: PurgeCounts,
): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) throw new Error('User not found');
  for (const identity of userData.user.identities ?? []) {
    const { error: blockError } = await supabase.from('blocked_oauth_identities').upsert(
      {
        provider: identity.provider,
        provider_user_id: identity.provider_id,
        notes: reason ?? null,
      },
      { onConflict: 'provider,provider_user_id' },
    );
    assertNoError(blockError, 'upsert blocked_oauth_identities');
    counts.blockedIdentities++;
  }
}

async function collectAvatarPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ bucket: string; path: string } | undefined> {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();
  assertNoError(error, 'load profile for storage paths');
  if (!data?.avatar_url) return undefined;
  return { bucket: 'avatars', path: data.avatar_url };
}

async function collectChildStoragePaths(
  supabase: SupabaseClient,
  parentIds: string[],
  childTable: 'item_photos' | 'bike_photos',
  parentCol: 'item_id' | 'bike_id',
): Promise<{ bucket: string; path: string }[]> {
  const paths: { bucket: string; path: string }[] = [];
  await chunked(parentIds, async (chunk) => {
    const { data, error } = await supabase
      .from(childTable)
      .select('storage_path')
      .in(parentCol, chunk);
    assertNoError(error, `load ${childTable} for storage paths`);
    for (const p of data ?? []) {
      if (p.storage_path) paths.push({ bucket: 'item-photos', path: p.storage_path });
    }
  });
  return paths;
}

async function collectExportPaths(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ bucket: string; path: string }[]> {
  const { data, error } = await supabase
    .from('export_requests')
    .select('storage_path')
    .eq('user_id', userId)
    .not('storage_path', 'is', null);
  assertNoError(error, 'load export requests for storage paths');
  return (data ?? [])
    .filter((e) => e.storage_path)
    .map((e) => ({ bucket: 'data-exports', path: e.storage_path as string }));
}

async function deleteStorageObjects(
  supabase: SupabaseClient,
  paths: { bucket: string; path: string }[],
  counts: PurgeCounts,
): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of paths) {
    const list = byBucket.get(bucket) ?? [];
    list.push(path);
    byBucket.set(bucket, list);
  }
  for (const [bucket, bucketPaths] of byBucket) {
    const { error } = await supabase.storage.from(bucket).remove(bucketPaths);
    if (error && !error.message?.includes('Not Found')) {
      throw new Error(`storage remove ${bucket}: ${error.message}`);
    }
    counts.storageObjects += bucketPaths.length;
  }
}

async function closeReports(
  supabase: SupabaseClient,
  userId: string,
  ownedItemIds: string[],
  counts: PurgeCounts,
): Promise<void> {
  const { data: closedUserReports, error: closeUserErr } = await supabase
    .from('reports')
    .update({ status: 'closed' })
    .eq('target_type', 'user')
    .eq('target_id', userId)
    .select('id');
  assertNoError(closeUserErr, 'close reports targeting user');
  counts.reportsClosed = closedUserReports?.length ?? 0;

  const ownedItemPhotoIds: string[] = [];
  await chunked(ownedItemIds, async (chunk) => {
    const { data, error } = await supabase.from('item_photos').select('id').in('item_id', chunk);
    assertNoError(error, 'load item_photo ids for report closure');
    for (const p of data ?? []) ownedItemPhotoIds.push(p.id);
  });

  const { data: ownedMessages, error: ownedMsgErr } = await supabase
    .from('messages')
    .select('id')
    .eq('sender_id', userId);
  assertNoError(ownedMsgErr, 'load message ids for report closure');
  const ownedMessageIds = (ownedMessages ?? []).map((m) => m.id);

  const contentIds = [...ownedItemIds, ...ownedItemPhotoIds, ...ownedMessageIds];
  await chunked(contentIds, async (chunk) => {
    const { data, error } = await supabase
      .from('reports')
      .update({ status: 'closed' })
      .in('target_type', ['item', 'item_photo', 'message'])
      .in('target_id', chunk)
      .select('id');
    assertNoError(error, 'close reports targeting user content');
    counts.reportsClosed += data?.length ?? 0;
  });
}

async function purgeOwnedChildAndRoot(
  supabase: SupabaseClient,
  parentIds: string[],
  childTable: 'item_photos' | 'bike_photos',
  parentCol: 'item_id' | 'bike_id',
): Promise<number> {
  let deleted = 0;
  await chunked(parentIds, async (chunk) => {
    deleted += deleteCount(
      await supabase.from(childTable).delete().in(parentCol, chunk).select('id'),
      `delete ${childTable}`,
    );
  });
  return deleted;
}

async function purgeEmptyConversations(
  supabase: SupabaseClient,
  counts: PurgeCounts,
): Promise<void> {
  const { data, error } = await supabase.rpc('find_empty_conversations');
  assertNoError(error, 'find empty conversations');
  if (!data || data.length === 0) return;
  const emptyIds = (data as { id: string }[]).map((c) => c.id);
  let conversationsDeleted = 0;
  await chunked(emptyIds, async (chunk) => {
    conversationsDeleted += deleteCount(
      await supabase.from('conversations').delete().in('id', chunk).select('id'),
      'delete empty conversations',
    );
  });
  counts.conversationsDeleted = conversationsDeleted;
}

async function purgeUserTables(
  supabase: SupabaseClient,
  userId: string,
  counts: PurgeCounts,
): Promise<void> {
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
}

async function fetchOwnedIdsByOwner(
  supabase: SupabaseClient,
  table: 'items' | 'bikes',
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase.from(table).select('id').eq('owner_id', userId);
  assertNoError(error, `load user ${table} for storage paths`);
  return (data ?? []).map((row: { id: string }) => row.id);
}

async function collectAllStoragePaths(
  supabase: SupabaseClient,
  userId: string,
  ownedItemIds: string[],
  ownedBikeIds: string[],
): Promise<{ bucket: string; path: string }[]> {
  const paths: { bucket: string; path: string }[] = [];
  const avatarPath = await collectAvatarPath(supabase, userId);
  if (avatarPath) paths.push(avatarPath);
  paths.push(...(await collectChildStoragePaths(supabase, ownedItemIds, 'item_photos', 'item_id')));
  paths.push(...(await collectChildStoragePaths(supabase, ownedBikeIds, 'bike_photos', 'bike_id')));
  paths.push(...(await collectExportPaths(supabase, userId)));
  return paths;
}

async function purgeOwnedAggregates(
  supabase: SupabaseClient,
  userId: string,
  ownedItemIds: string[],
  ownedBikeIds: string[],
  counts: PurgeCounts,
): Promise<void> {
  counts.itemPhotos = await purgeOwnedChildAndRoot(
    supabase,
    ownedItemIds,
    'item_photos',
    'item_id',
  );
  counts.items = deleteCount(
    await supabase.from('items').delete().eq('owner_id', userId).select('id'),
    'delete items',
  );
  counts.bikePhotos = await purgeOwnedChildAndRoot(
    supabase,
    ownedBikeIds,
    'bike_photos',
    'bike_id',
  );
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
}

async function finalizePurge(
  supabase: SupabaseClient,
  userId: string,
  validatedReason: string | undefined,
  validatedReportIds: string[] | undefined,
): Promise<void> {
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
}

async function purgeSanctionedUser(
  supabase: SupabaseClient,
  userId: string,
  validatedReason: string | undefined,
  validatedReportIds: string[] | undefined,
): Promise<Response> {
  const counts = emptyCounts();

  try {
    await blockIdentities(supabase, userId, validatedReason, counts);
  } catch (e) {
    if (e instanceof Error && e.message === 'User not found') {
      return json(404, { error: 'User not found' });
    }
    throw e;
  }

  const ownedItemIds = await fetchOwnedIdsByOwner(supabase, 'items', userId);
  const ownedBikeIds = await fetchOwnedIdsByOwner(supabase, 'bikes', userId);
  const storagePaths = await collectAllStoragePaths(supabase, userId, ownedItemIds, ownedBikeIds);

  await deleteStorageObjects(supabase, storagePaths, counts);
  await closeReports(supabase, userId, ownedItemIds, counts);
  await purgeOwnedAggregates(supabase, userId, ownedItemIds, ownedBikeIds, counts);
  await purgeEmptyConversations(supabase, counts);
  await purgeUserTables(supabase, userId, counts);
  await finalizePurge(supabase, userId, validatedReason, validatedReportIds);

  return json(200, { success: true, counts });
}

function validateAdminSecret(req: Request): Response | undefined {
  const adminSecret = Deno.env.get('ADMIN_MODERATION_SECRET');
  if (!adminSecret) {
    console.error('ADMIN_MODERATION_SECRET not configured');
    return json(500, { error: 'Server configuration error' });
  }
  const providedSecret = req.headers.get('x-admin-secret') ?? '';
  if (!constantTimeEqual(providedSecret, adminSecret)) {
    return json(401, { error: 'Unauthorized' });
  }
  return undefined;
}

async function parseBody(
  req: Request,
): Promise<{ body?: Record<string, unknown>; error?: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: json(400, { error: 'Invalid JSON body' }) };
  }
  if (!body || typeof body !== 'object') {
    return { error: json(400, { error: 'Request body must be a JSON object' }) };
  }
  return { body: body as Record<string, unknown> };
}

function validatePayload(
  body: Record<string, unknown>,
): { userId: string; reason: unknown; relatedReportIds: unknown } | Response {
  const { userId, reason, relatedReportIds } = body;

  if (!userId || typeof userId !== 'string' || !UUID_RE.test(userId)) {
    return json(400, { error: 'userId is required and must be a valid UUID' });
  }
  if (reason !== undefined && typeof reason !== 'string') {
    return json(400, { error: 'reason must be a string when provided' });
  }
  if (
    relatedReportIds !== undefined &&
    (!Array.isArray(relatedReportIds) ||
      !relatedReportIds.every((id) => typeof id === 'string' && UUID_RE.test(id)))
  ) {
    return json(400, { error: 'relatedReportIds must be an array of valid UUIDs' });
  }
  return { userId, reason, relatedReportIds };
}

function buildSupabaseClient(): SupabaseClient | Response {
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
    return json(500, { error: 'Server configuration error' });
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const secretError = validateAdminSecret(req);
    if (secretError) return secretError;

    const parsed = await parseBody(req);
    if (parsed.error) return parsed.error;

    const validated = validatePayload(parsed.body!);
    if (validated instanceof Response) return validated;

    const validatedReason = optionalNarrowString(validated.reason);
    const validatedReportIds = optionalNarrowUuidArray(validated.relatedReportIds);

    const client = buildSupabaseClient();
    if (client instanceof Response) return client;

    return await purgeSanctionedUser(client, validated.userId, validatedReason, validatedReportIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('admin-enforce-sanction error:', message);
    return json(500, { error: message });
  }
});
