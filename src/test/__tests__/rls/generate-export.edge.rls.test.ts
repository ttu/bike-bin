import { unzipSync } from 'fflate';
import {
  adminClient,
  cleanupUsers,
  createTestUser,
  testSupabaseServiceRoleKey,
  testSupabaseUrl,
  type TestUser,
} from '../../rls/setup';

/**
 * Invokes the local `generate-export` worker and asserts the ZIP contains real photo file
 * bytes for both items and bikes (same `item-photos` bucket).
 *
 * Requires `npm run db:start` (edge runtime serves `supabase/functions/`).
 */
describe('generate-export edge function', () => {
  jest.setTimeout(60_000);

  let user: TestUser | undefined;
  let itemId: string | undefined;
  let bikeId: string | undefined;
  let exportRequestId: string | undefined;
  let itemPhotoPath: string | undefined;
  let bikePhotoPath: string | undefined;

  beforeAll(async () => {
    user = await createTestUser('export-edge');

    const { data: itemRow, error: itemErr } = await adminClient
      .from('items')
      .insert({
        owner_id: user.id,
        name: 'Export edge item',
        category: 'tool',
        condition: 'good',
        visibility: 'all',
      })
      .select('id')
      .single();
    if (itemErr) throw new Error(`Failed to seed item: ${itemErr.message}`);
    itemId = itemRow.id;

    const { data: bikeRow, error: bikeErr } = await adminClient
      .from('bikes')
      .insert({
        owner_id: user.id,
        name: 'Export edge bike',
        type: 'road',
      })
      .select('id')
      .single();
    if (bikeErr) throw new Error(`Failed to seed bike: ${bikeErr.message}`);
    bikeId = bikeRow.id;

    itemPhotoPath = `items/${user.id}/${itemId}/photo.jpg`;
    bikePhotoPath = `bikes/${user.id}/${bikeId}/photo.jpg`;

    const itemBytes = Buffer.from('export-item-photo-bytes');
    const bikeBytes = Buffer.from('export-bike-photo-bytes');

    const { error: itemUpErr } = await adminClient.storage
      .from('item-photos')
      .upload(itemPhotoPath, itemBytes, { contentType: 'image/jpeg', upsert: true });
    if (itemUpErr) throw new Error(`Failed to upload item photo: ${itemUpErr.message}`);

    const { error: bikeUpErr } = await adminClient.storage
      .from('item-photos')
      .upload(bikePhotoPath, bikeBytes, { contentType: 'image/jpeg', upsert: true });
    if (bikeUpErr) throw new Error(`Failed to upload bike photo: ${bikeUpErr.message}`);

    const { error: itemPhotoRowErr } = await adminClient.from('item_photos').insert({
      item_id: itemId,
      storage_path: itemPhotoPath,
      sort_order: 1,
    });
    if (itemPhotoRowErr)
      throw new Error(`Failed to insert item_photos: ${itemPhotoRowErr.message}`);

    const { error: bikePhotoRowErr } = await adminClient.from('bike_photos').insert({
      bike_id: bikeId,
      storage_path: bikePhotoPath,
      sort_order: 1,
    });
    if (bikePhotoRowErr)
      throw new Error(`Failed to insert bike_photos: ${bikePhotoRowErr.message}`);

    const { data: expRow, error: expErr } = await adminClient
      .from('export_requests')
      .insert({ user_id: user.id, status: 'pending' })
      .select('id')
      .single();
    if (expErr) throw new Error(`Failed to insert export_requests: ${expErr.message}`);
    exportRequestId = expRow.id;
  }, 60_000);

  afterAll(async () => {
    if (exportRequestId) {
      const { data: expCleanup } = await adminClient
        .from('export_requests')
        .select('storage_path')
        .eq('id', exportRequestId)
        .maybeSingle();
      if (expCleanup?.storage_path) {
        await adminClient.storage.from('data-exports').remove([expCleanup.storage_path]);
      }
      await adminClient.from('export_requests').delete().eq('id', exportRequestId);
    }
    if (itemPhotoPath && bikePhotoPath) {
      await adminClient.storage.from('item-photos').remove([itemPhotoPath, bikePhotoPath]);
    }
    if (itemId) {
      await adminClient.from('items').delete().eq('id', itemId);
    }
    if (bikeId) {
      await adminClient.from('bikes').delete().eq('id', bikeId);
    }
    if (user) {
      await cleanupUsers([user]);
    }
  }, 60_000);

  it('writes a ZIP that includes item and bike photo file contents', async () => {
    if (!user || !exportRequestId || !itemId || !bikeId) {
      throw new Error('Test data not seeded');
    }

    const res = await fetch(`${testSupabaseUrl}/functions/v1/generate-export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testSupabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exportRequestId, userId: user.id }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success?: boolean; error?: string };
    expect(body.success).toBe(true);

    const { data: exportRow, error: exportFetchErr } = await adminClient
      .from('export_requests')
      .select('status, storage_path')
      .eq('id', exportRequestId)
      .single();
    if (exportFetchErr)
      throw new Error(`Failed to read export_requests: ${exportFetchErr.message}`);
    expect(exportRow?.status).toBe('completed');
    expect(exportRow?.storage_path).toBeTruthy();
    const zipPath = exportRow.storage_path!;

    const { data: zipBlob, error: dlErr } = await adminClient.storage
      .from('data-exports')
      .download(zipPath);
    if (dlErr) throw new Error(`Failed to download export ZIP: ${dlErr.message}`);
    expect(zipBlob).toBeTruthy();

    const zipBytes = new Uint8Array(await zipBlob.arrayBuffer());
    const files = unzipSync(zipBytes);

    const itemKey = `export/photos/items/${itemId}/photo.jpg`;
    const bikeKey = `export/photos/bikes/${bikeId}/photo.jpg`;

    const itemPhotoZip = files[itemKey];
    expect(itemPhotoZip).toBeDefined();
    expect(itemPhotoZip?.length).toBeGreaterThan(0);
    expect(Buffer.from(itemPhotoZip ?? []).toString()).toBe('export-item-photo-bytes');

    const bikePhotoZip = files[bikeKey];
    expect(bikePhotoZip).toBeDefined();
    expect(bikePhotoZip?.length).toBeGreaterThan(0);
    expect(Buffer.from(bikePhotoZip ?? []).toString()).toBe('export-bike-photo-bytes');
  });
});
