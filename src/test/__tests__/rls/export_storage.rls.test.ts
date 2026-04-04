import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userA: TestUser;
let userB: TestUser;

let itemAId: string;
let exportRequestIdA: string;
let dataExportPathA: string;
let itemPhotoStoragePath: string;

beforeAll(async () => {
  userA = await createTestUser('exp-a');
  userB = await createTestUser('exp-b');

  const { data: itemData, error: itemError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'Export storage RLS item',
      category: 'tool',
      condition: 'good',
      visibility: 'all',
    })
    .select('id')
    .single();
  if (itemError) throw new Error(`Failed to seed item: ${itemError.message}`);
  itemAId = itemData.id;

  const { data: expData, error: expError } = await adminClient
    .from('export_requests')
    .insert({ user_id: userA.id, status: 'pending' })
    .select('id')
    .single();
  if (expError) throw new Error(`Failed to seed export_request: ${expError.message}`);
  exportRequestIdA = expData.id;

  dataExportPathA = `export/${userA.id}/rls-test.txt`;
  const { error: dataExportUpError } = await adminClient.storage
    .from('data-exports')
    .upload(dataExportPathA, Buffer.from('export-bytes'), {
      contentType: 'text/plain',
      upsert: true,
    });
  if (dataExportUpError)
    throw new Error(`Failed to seed data-exports object: ${dataExportUpError.message}`);

  itemPhotoStoragePath = `items/${userA.id}/${itemAId}/rls-photo.jpg`;
  const { error: photoUpError } = await userA.client.storage
    .from('item-photos')
    .upload(itemPhotoStoragePath, Buffer.from('jpeg-bytes'), {
      contentType: 'image/jpeg',
      upsert: true,
    });
  if (photoUpError) throw new Error(`Failed to seed item-photos object: ${photoUpError.message}`);
}, 30_000);

afterAll(async () => {
  await adminClient.storage.from('data-exports').remove([dataExportPathA]);
  await adminClient.storage.from('item-photos').remove([itemPhotoStoragePath]);
  await adminClient.from('export_requests').delete().eq('id', exportRequestIdA);
  await adminClient.from('items').delete().eq('id', itemAId);
  await cleanupUsers([userA, userB]);
});

// ============================================================
// export_requests (Postgres)
// ============================================================

describe('export_requests — SELECT', () => {
  it('user can read own export_requests', async () => {
    const { data, error } = await userA.client
      .from('export_requests')
      .select('id')
      .eq('id', exportRequestIdA);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('other user cannot read export_requests', async () => {
    const { data, error } = await userB.client
      .from('export_requests')
      .select('id')
      .eq('id', exportRequestIdA);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('export_requests — INSERT', () => {
  it('user can insert export_request for self', async () => {
    const { data, error } = await userA.client
      .from('export_requests')
      .insert({ user_id: userA.id, status: 'pending' })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    if (data?.id) {
      await adminClient.from('export_requests').delete().eq('id', data.id);
    }
  });

  it('user cannot insert export_request for another user_id', async () => {
    const { error } = await userA.client.from('export_requests').insert({
      user_id: userB.id,
      status: 'pending',
    });
    expect(error).toBeTruthy();
  });
});

describe('export_requests — UPDATE / DELETE', () => {
  it('user cannot update own export_request (no UPDATE policy)', async () => {
    const { data, error } = await userA.client
      .from('export_requests')
      .update({ status: 'failed' })
      .eq('id', exportRequestIdA)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: row } = await adminClient
      .from('export_requests')
      .select('status')
      .eq('id', exportRequestIdA)
      .single();
    expect(row?.status).toBe('pending');
  });

  it('user cannot delete own export_request (no DELETE policy)', async () => {
    const { data, error } = await userA.client
      .from('export_requests')
      .delete()
      .eq('id', exportRequestIdA)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: stillExists } = await adminClient
      .from('export_requests')
      .select('id')
      .eq('id', exportRequestIdA);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// storage: data-exports (SELECT own path segment)
// ============================================================

describe('storage — data-exports', () => {
  it('user can download object under export/<userId>/', async () => {
    const { data, error } = await userA.client.storage
      .from('data-exports')
      .download(dataExportPathA);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    const text = await data!.text();
    expect(text).toBe('export-bytes');
  });

  it('user cannot download another user export path', async () => {
    const { error } = await userB.client.storage.from('data-exports').download(dataExportPathA);
    expect(error).toBeTruthy();
  });

  it('authenticated user cannot upload to data-exports (no INSERT policy)', async () => {
    const path = `export/${userB.id}/upload-attempt.txt`;
    const { error } = await userB.client.storage
      .from('data-exports')
      .upload(path, Buffer.from('x'), { contentType: 'text/plain', upsert: true });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// storage: item-photos (path ownership)
// ============================================================

describe('storage — item-photos', () => {
  it('owner can upload under items/<userId>/...', async () => {
    const path = `items/${userA.id}/${itemAId}/second.jpg`;
    const { error } = await userA.client.storage
      .from('item-photos')
      .upload(path, Buffer.from('img2'), { contentType: 'image/jpeg', upsert: true });
    expect(error).toBeNull();
    await adminClient.storage.from('item-photos').remove([path]);
  });

  it('user cannot upload into another user folder segment', async () => {
    const path = `items/${userA.id}/${itemAId}/intruder.jpg`;
    const { error } = await userB.client.storage
      .from('item-photos')
      .upload(path, Buffer.from('x'), { contentType: 'image/jpeg', upsert: true });
    expect(error).toBeTruthy();
  });

  it('user cannot delete object in another user folder segment', async () => {
    const { error } = await userB.client.storage.from('item-photos').remove([itemPhotoStoragePath]);
    // Storage API may return null error when RLS denies delete; verify object remains
    expect(error).toBeNull();

    const { data: after, error: verifyErr } = await adminClient.storage
      .from('item-photos')
      .download(itemPhotoStoragePath);
    expect(verifyErr).toBeNull();
    expect(await after!.text()).toBe('jpeg-bytes');
  });

  it('owner can delete own object', async () => {
    const path = `items/${userA.id}/${itemAId}/deletable.jpg`;
    const { error: upErr } = await userA.client.storage
      .from('item-photos')
      .upload(path, Buffer.from('d'), { contentType: 'image/jpeg', upsert: true });
    expect(upErr).toBeNull();

    const { error: delErr } = await userA.client.storage.from('item-photos').remove([path]);
    expect(delErr).toBeNull();
  });
});
