import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { zipSync } from 'https://esm.sh/fflate@0.8.2';

const PHOTO_BATCH_SIZE = 20;

interface ExportPayload {
  exportRequestId: string;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auth check: only allow internal invocation via service role
  const authHeader = req.headers.get('Authorization');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (!authHeader || authHeader !== `Bearer ${supabaseServiceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let payload: ExportPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { exportRequestId, userId } = payload;

  try {
    // Verify request exists and is pending
    const { data: exportReq, error: fetchError } = await supabase
      .from('export_requests')
      .select('*')
      .eq('id', exportRequestId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !exportReq) {
      return new Response(JSON.stringify({ error: 'Export request not found or not pending' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set status to processing
    await supabase
      .from('export_requests')
      .update({ status: 'processing' })
      .eq('id', exportRequestId);

    // Phase 1: Query independent data in parallel
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

    // Phase 2: Dependent queries using IDs from phase 1
    const userItemIds = (itemsResult.data ?? []).map((i) => i.id);
    const userBikeIds = (bikesResult.data ?? []).map((b) => b.id);
    const conversationIds = (conversationParticipantsResult.data ?? []).map(
      (cp) => cp.conversation_id,
    );

    const [
      itemPhotosResult,
      bikePhotosResult,
      itemGroupsResult,
      conversationsResult,
      messagesResult,
      borrowRequestsAsOwnerResult,
    ] = await Promise.all([
      userItemIds.length > 0
        ? supabase.from('item_photos').select('*').in('item_id', userItemIds)
        : { data: [] },
      userBikeIds.length > 0
        ? supabase.from('bike_photos').select('*').in('bike_id', userBikeIds)
        : { data: [] },
      userItemIds.length > 0
        ? supabase.from('item_groups').select('*').in('item_id', userItemIds)
        : { data: [] },
      conversationIds.length > 0
        ? supabase.from('conversations').select('*').in('id', conversationIds)
        : { data: [] },
      conversationIds.length > 0
        ? supabase
            .from('messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .order('created_at')
        : { data: [] },
      userItemIds.length > 0
        ? supabase.from('borrow_requests').select('*').in('item_id', userItemIds)
        : { data: [] },
    ]);

    // Merge borrow requests, deduplicate
    const allBorrowRequests = [
      ...(borrowRequestsAsRequesterResult.data ?? []),
      ...(borrowRequestsAsOwnerResult.data ?? []),
    ];
    const uniqueBorrowRequests = [...new Map(allBorrowRequests.map((r) => [r.id, r])).values()];

    // Merge ratings
    const allRatings = [
      ...(ratingsGivenResult.data ?? []).map((r) => ({ ...r, direction: 'given' })),
      ...(ratingsReceivedResult.data ?? []).map((r) => ({ ...r, direction: 'received' })),
    ];

    // Build JSON data
    const jsonData: Record<string, Uint8Array> = {};
    const encoder = new TextEncoder();
    const toJson = (data: unknown) => encoder.encode(JSON.stringify(data, null, 2));

    jsonData['export/profile.json'] = toJson(profileResult.data);
    jsonData['export/locations.json'] = toJson(locationsResult.data ?? []);
    jsonData['export/items.json'] = toJson(itemsResult.data ?? []);
    jsonData['export/bikes.json'] = toJson(bikesResult.data ?? []);
    jsonData['export/conversations.json'] = toJson({
      conversations: conversationsResult.data ?? [],
      messages: messagesResult.data ?? [],
      participants: conversationParticipantsResult.data ?? [],
    });
    jsonData['export/borrow_requests.json'] = toJson(uniqueBorrowRequests);
    jsonData['export/ratings.json'] = toJson(allRatings);
    jsonData['export/groups.json'] = toJson({
      memberships: groupMembersResult.data ?? [],
      item_groups: itemGroupsResult.data ?? [],
    });
    jsonData['export/notifications.json'] = toJson(notificationsResult.data ?? []);
    jsonData['export/support_requests.json'] = toJson(supportRequestsResult.data ?? []);
    jsonData['export/reports.json'] = toJson(reportsResult.data ?? []);
    jsonData['export/subscriptions.json'] = toJson(subscriptionsResult.data ?? []);

    // Download photos in batches
    const photoFiles: Record<string, Uint8Array> = {};

    // Avatar photo
    const avatarUrl = profileResult.data?.avatar_url;
    if (avatarUrl) {
      try {
        const { data: avatarData } = await supabase.storage.from('avatars').download(avatarUrl);
        if (avatarData) {
          const ext = avatarUrl.split('.').pop() ?? 'jpg';
          photoFiles[`export/photos/avatar.${ext}`] = new Uint8Array(
            await avatarData.arrayBuffer(),
          );
        }
      } catch {
        console.warn('Failed to download avatar');
      }
    }

    // Item photos
    const itemPhotos = itemPhotosResult.data ?? [];
    for (let i = 0; i < itemPhotos.length; i += PHOTO_BATCH_SIZE) {
      const batch = itemPhotos.slice(i, i + PHOTO_BATCH_SIZE);
      await Promise.all(
        batch.map(async (photo) => {
          try {
            const { data: photoData } = await supabase.storage
              .from('item-photos')
              .download(photo.storage_path);
            if (photoData) {
              const filename = photo.storage_path.split('/').pop() ?? `${photo.id}.jpg`;
              photoFiles[`export/photos/items/${photo.item_id}/${filename}`] = new Uint8Array(
                await photoData.arrayBuffer(),
              );
            }
          } catch {
            console.warn(`Failed to download item photo: ${photo.storage_path}`);
          }
        }),
      );
    }

    // Bike photos
    const bikePhotos = bikePhotosResult.data ?? [];
    for (let i = 0; i < bikePhotos.length; i += PHOTO_BATCH_SIZE) {
      const batch = bikePhotos.slice(i, i + PHOTO_BATCH_SIZE);
      await Promise.all(
        batch.map(async (photo) => {
          try {
            const { data: photoData } = await supabase.storage
              .from('bike-photos')
              .download(photo.storage_path);
            if (photoData) {
              const filename = photo.storage_path.split('/').pop() ?? `${photo.id}.jpg`;
              photoFiles[`export/photos/bikes/${photo.bike_id}/${filename}`] = new Uint8Array(
                await photoData.arrayBuffer(),
              );
            }
          } catch {
            console.warn(`Failed to download bike photo: ${photo.storage_path}`);
          }
        }),
      );
    }

    // Support request screenshots
    const supportRequests = supportRequestsResult.data ?? [];
    for (const sr of supportRequests) {
      if (sr.screenshot_path) {
        try {
          const { data: screenshotData } = await supabase.storage
            .from('support-screenshots')
            .download(sr.screenshot_path);
          if (screenshotData) {
            const filename = sr.screenshot_path.split('/').pop() ?? `${sr.id}.jpg`;
            photoFiles[`export/photos/support/${sr.id}/${filename}`] = new Uint8Array(
              await screenshotData.arrayBuffer(),
            );
          }
        } catch {
          console.warn(`Failed to download support screenshot: ${sr.screenshot_path}`);
        }
      }
    }

    // Build ZIP
    const allFiles = { ...jsonData, ...photoFiles };
    const zipped = zipSync(allFiles);

    // Upload ZIP to storage
    const storagePath = `exports/${userId}/${exportRequestId}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('data-exports')
      .upload(storagePath, zipped, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload export: ${uploadError.message}`);
    }

    // Update export request: completed
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('export_requests')
      .update({
        status: 'completed',
        storage_path: storagePath,
        expires_at: expiresAt,
      })
      .eq('id', exportRequestId);

    // Insert notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'data_export_ready',
      title: 'Your data export is ready',
      body: 'Your data export has been prepared and is ready to download.',
      data: { exportRequestId },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('generate-export error:', message);

    // Mark export as failed
    await supabase
      .from('export_requests')
      .update({ status: 'failed', error_message: message })
      .eq('id', exportRequestId);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
