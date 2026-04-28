import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { zipSync } from 'https://esm.sh/fflate@0.8.2';

const PHOTO_BATCH_SIZE = 20;

/** Item and bike photos use the same bucket (`00014_storage_item_photos.sql`). */
const PHOTOS_BUCKET = 'item-photos';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

interface ExportPayload {
  exportRequestId: string;
  userId: string;
}

interface ItemPhotoRow {
  id: string;
  storage_path: string;
  item_id: string;
}

interface BikePhotoRow {
  id: string;
  storage_path: string;
  bike_id: string;
}

interface SupportRequestRow {
  id: string;
  screenshot_path?: string | null;
}

async function runOrEmpty<T>(
  hasIds: boolean,
  fn: () => PromiseLike<{ data: T[] | null }>,
): Promise<{ data: T[] }> {
  if (!hasIds) return { data: [] };
  const result = await fn();
  return { data: result.data ?? [] };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function authorize(req: Request, serviceRoleKey: string): Response | undefined {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }
  return undefined;
}

async function parsePayload(req: Request): Promise<ExportPayload | Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid payload' });
  }
  if (
    !raw ||
    typeof raw !== 'object' ||
    typeof (raw as Record<string, unknown>).exportRequestId !== 'string' ||
    typeof (raw as Record<string, unknown>).userId !== 'string'
  ) {
    return jsonResponse(400, { error: 'Invalid payload' });
  }
  return raw as ExportPayload;
}

async function fetchPhase1(supabase: SupabaseClient, userId: string) {
  const [
    profileResult,
    locationsResult,
    itemsResult,
    bikesResult,
    conversationParticipantsResult,
    borrowRequestsAsRequesterResult,
    ratingsGivenResult,
    ratingsReceivedResult,
    groupMembersResult,
    notificationsResult,
    supportRequestsResult,
    reportsResult,
    subscriptionsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('saved_locations').select('*').eq('user_id', userId),
    supabase.from('items').select('*').eq('owner_id', userId),
    supabase.from('bikes').select('*').eq('owner_id', userId),
    supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId),
    supabase.from('borrow_requests').select('*').eq('requester_id', userId),
    supabase.from('ratings').select('*').eq('from_user_id', userId),
    supabase.from('ratings').select('*').eq('to_user_id', userId),
    supabase.from('group_members').select('*, groups(*)').eq('user_id', userId),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('support_requests').select('*').eq('user_id', userId),
    supabase.from('reports').select('*').eq('reporter_id', userId),
    supabase.from('subscriptions').select('*').eq('user_id', userId),
  ]);
  return {
    profileResult,
    locationsResult,
    itemsResult,
    bikesResult,
    conversationParticipantsResult,
    borrowRequestsAsRequesterResult,
    ratingsGivenResult,
    ratingsReceivedResult,
    groupMembersResult,
    notificationsResult,
    supportRequestsResult,
    reportsResult,
    subscriptionsResult,
  };
}

async function fetchPhase2(
  supabase: SupabaseClient,
  userItemIds: string[],
  userBikeIds: string[],
  conversationIds: string[],
) {
  const [
    itemPhotosResult,
    bikePhotosResult,
    itemGroupsResult,
    conversationsResult,
    messagesResult,
    borrowRequestsAsOwnerResult,
  ] = await Promise.all([
    runOrEmpty<ItemPhotoRow>(userItemIds.length > 0, () =>
      supabase.from('item_photos').select('*').in('item_id', userItemIds),
    ),
    runOrEmpty<BikePhotoRow>(userBikeIds.length > 0, () =>
      supabase.from('bike_photos').select('*').in('bike_id', userBikeIds),
    ),
    runOrEmpty<Record<string, unknown>>(userItemIds.length > 0, () =>
      supabase.from('item_groups').select('*').in('item_id', userItemIds),
    ),
    runOrEmpty<Record<string, unknown>>(conversationIds.length > 0, () =>
      supabase.from('conversations').select('*').in('id', conversationIds),
    ),
    runOrEmpty<Record<string, unknown>>(conversationIds.length > 0, () =>
      supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at'),
    ),
    runOrEmpty<{ id: string } & Record<string, unknown>>(userItemIds.length > 0, () =>
      supabase.from('borrow_requests').select('*').in('item_id', userItemIds),
    ),
  ]);
  return {
    itemPhotosResult,
    bikePhotosResult,
    itemGroupsResult,
    conversationsResult,
    messagesResult,
    borrowRequestsAsOwnerResult,
  };
}

function buildJsonFiles(
  phase1: Awaited<ReturnType<typeof fetchPhase1>>,
  phase2: Awaited<ReturnType<typeof fetchPhase2>>,
): Record<string, Uint8Array> {
  const encoder = new TextEncoder();
  const toJson = (data: unknown) => encoder.encode(JSON.stringify(data, null, 2));

  const allBorrowRequests = [
    ...(phase1.borrowRequestsAsRequesterResult.data ?? []),
    ...(phase2.borrowRequestsAsOwnerResult.data ?? []),
  ];
  const uniqueBorrowRequests = [...new Map(allBorrowRequests.map((r) => [r.id, r])).values()];

  const allRatings = [
    ...(phase1.ratingsGivenResult.data ?? []).map((r) => ({ ...r, direction: 'given' })),
    ...(phase1.ratingsReceivedResult.data ?? []).map((r) => ({ ...r, direction: 'received' })),
  ];

  return {
    'export/profile.json': toJson(phase1.profileResult.data),
    'export/locations.json': toJson(phase1.locationsResult.data ?? []),
    'export/items.json': toJson(phase1.itemsResult.data ?? []),
    'export/bikes.json': toJson(phase1.bikesResult.data ?? []),
    'export/conversations.json': toJson({
      conversations: phase2.conversationsResult.data ?? [],
      messages: phase2.messagesResult.data ?? [],
      participants: phase1.conversationParticipantsResult.data ?? [],
    }),
    'export/borrow_requests.json': toJson(uniqueBorrowRequests),
    'export/ratings.json': toJson(allRatings),
    'export/groups.json': toJson({
      memberships: phase1.groupMembersResult.data ?? [],
      item_groups: phase2.itemGroupsResult.data ?? [],
    }),
    'export/notifications.json': toJson(phase1.notificationsResult.data ?? []),
    'export/support_requests.json': toJson(phase1.supportRequestsResult.data ?? []),
    'export/reports.json': toJson(phase1.reportsResult.data ?? []),
    'export/subscriptions.json': toJson(phase1.subscriptionsResult.data ?? []),
  };
}

async function downloadAvatar(
  supabase: SupabaseClient,
  avatarUrl: string | null | undefined,
  files: Record<string, Uint8Array>,
): Promise<void> {
  if (!avatarUrl) return;
  try {
    const { data } = await supabase.storage.from('avatars').download(avatarUrl);
    if (!data) return;
    const ext = avatarUrl.split('.').pop() ?? 'jpg';
    files[`export/photos/avatar.${ext}`] = new Uint8Array(await data.arrayBuffer());
  } catch {
    console.warn('Failed to download avatar');
  }
}

async function downloadPhotoBatch(
  supabase: SupabaseClient,
  photos: { id: string; storage_path: string; item_id?: string; bike_id?: string }[],
  pathFor: (
    photo: { id: string; storage_path: string; item_id?: string; bike_id?: string },
    filename: string,
  ) => string,
  files: Record<string, Uint8Array>,
): Promise<void> {
  for (let i = 0; i < photos.length; i += PHOTO_BATCH_SIZE) {
    const batch = photos.slice(i, i + PHOTO_BATCH_SIZE);
    await Promise.all(
      batch.map(async (photo) => {
        try {
          const { data } = await supabase.storage.from(PHOTOS_BUCKET).download(photo.storage_path);
          if (!data) return;
          const filename = photo.storage_path.split('/').pop() ?? `${photo.id}.jpg`;
          files[pathFor(photo, filename)] = new Uint8Array(await data.arrayBuffer());
        } catch {
          console.warn(`Failed to download photo: ${photo.storage_path}`);
        }
      }),
    );
  }
}

async function downloadSupportScreenshots(
  supabase: SupabaseClient,
  supportRequests: { id: string; screenshot_path?: string | null }[],
  files: Record<string, Uint8Array>,
): Promise<void> {
  for (const sr of supportRequests) {
    if (!sr.screenshot_path) continue;
    try {
      const { data } = await supabase.storage
        .from('support-screenshots')
        .download(sr.screenshot_path);
      if (!data) continue;
      const filename = sr.screenshot_path.split('/').pop() ?? `${sr.id}.jpg`;
      files[`export/photos/support/${sr.id}/${filename}`] = new Uint8Array(
        await data.arrayBuffer(),
      );
    } catch {
      console.warn(`Failed to download support screenshot: ${sr.screenshot_path}`);
    }
  }
}

async function buildPhotoFiles(
  supabase: SupabaseClient,
  phase1: Awaited<ReturnType<typeof fetchPhase1>>,
  phase2: Awaited<ReturnType<typeof fetchPhase2>>,
): Promise<Record<string, Uint8Array>> {
  const photoFiles: Record<string, Uint8Array> = {};
  await downloadAvatar(supabase, phase1.profileResult.data?.avatar_url, photoFiles);
  await downloadPhotoBatch(
    supabase,
    phase2.itemPhotosResult.data,
    (photo, filename) => `export/photos/items/${photo.item_id}/${filename}`,
    photoFiles,
  );
  await downloadPhotoBatch(
    supabase,
    phase2.bikePhotosResult.data,
    (photo, filename) => `export/photos/bikes/${photo.bike_id}/${filename}`,
    photoFiles,
  );
  await downloadSupportScreenshots(
    supabase,
    (phase1.supportRequestsResult.data ?? []) as SupportRequestRow[],
    photoFiles,
  );
  return photoFiles;
}

async function uploadAndComplete(
  supabase: SupabaseClient,
  zipped: Uint8Array,
  userId: string,
  exportRequestId: string,
): Promise<void> {
  const storagePath = `exports/${userId}/${exportRequestId}.zip`;
  const { error: uploadError } = await supabase.storage
    .from('data-exports')
    .upload(storagePath, zipped, { contentType: 'application/zip', upsert: true });
  if (uploadError) {
    throw new Error(`Failed to upload export: ${uploadError.message}`);
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await supabase
    .from('export_requests')
    .update({ status: 'completed', storage_path: storagePath, expires_at: expiresAt })
    .eq('id', exportRequestId);

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'data_export_ready',
    title: 'Your data export is ready',
    body: 'Your data export has been prepared and is ready to download.',
    data: { exportRequestId },
  });
}

async function processExport(
  supabase: SupabaseClient,
  exportRequestId: string,
  userId: string,
): Promise<Response> {
  const { data: exportReq, error: fetchError } = await supabase
    .from('export_requests')
    .select('*')
    .eq('id', exportRequestId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();
  if (fetchError || !exportReq) {
    return jsonResponse(404, { error: 'Export request not found or not pending' });
  }

  await supabase.from('export_requests').update({ status: 'processing' }).eq('id', exportRequestId);

  const phase1 = await fetchPhase1(supabase, userId);
  const userItemIds = (phase1.itemsResult.data ?? []).map((i) => i.id);
  const userBikeIds = (phase1.bikesResult.data ?? []).map((b) => b.id);
  const conversationIds = (phase1.conversationParticipantsResult.data ?? []).map(
    (cp) => cp.conversation_id,
  );
  const phase2 = await fetchPhase2(supabase, userItemIds, userBikeIds, conversationIds);

  const jsonData = buildJsonFiles(phase1, phase2);
  const photoFiles = await buildPhotoFiles(supabase, phase1, phase2);
  const zipped = zipSync({ ...jsonData, ...photoFiles });

  await uploadAndComplete(supabase, zipped, userId, exportRequestId);
  return jsonResponse(200, { success: true });
}

async function markFailed(
  supabase: SupabaseClient,
  exportRequestId: string,
  message: string,
): Promise<void> {
  await supabase
    .from('export_requests')
    .update({ status: 'failed', error_message: message })
    .eq('id', exportRequestId);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: 'Server misconfigured' });
  }

  const authError = authorize(req, serviceRoleKey);
  if (authError) return authError;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const payload = await parsePayload(req);
  if (payload instanceof Response) return payload;
  const { exportRequestId, userId } = payload;

  try {
    return await processExport(supabase, exportRequestId, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('generate-export error:', message);
    await markFailed(supabase, exportRequestId, message);
    return jsonResponse(500, { error: message });
  }
});
