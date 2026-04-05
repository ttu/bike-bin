import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let limitUser: TestUser;
let itemId: string;

beforeAll(async () => {
  limitUser = await createTestUser('photo-limit');

  const { data: item, error: itemError } = await adminClient
    .from('items')
    .insert({
      owner_id: limitUser.id,
      name: 'Photo seed item',
      category: 'tool',
      condition: 'good',
      visibility: 'private',
      status: 'stored',
    })
    .select('id')
    .single();

  if (itemError || !item) {
    throw new Error(`Failed to seed item: ${itemError?.message}`);
  }
  itemId = item.id;

  const photoRows = Array.from({ length: 100 }, (_, i) => ({
    item_id: itemId,
    storage_path: `test/photo-limit-${limitUser.id}-${i}.jpg`,
    sort_order: i,
  }));

  const { error: photoError } = await adminClient.from('item_photos').insert(photoRows);

  if (photoError) {
    throw new Error(`Failed to seed 100 photos: ${photoError.message}`);
  }
}, 120_000);

afterAll(async () => {
  await adminClient.from('subscriptions').delete().eq('user_id', limitUser.id);
  await adminClient.from('items').delete().eq('id', itemId);
  await cleanupUsers([limitUser]);
});

describe('item_photos — account photo row limit', () => {
  it('blocks the 101st photo on free tier, then allows more with entitled paid plan', async () => {
    const { error: overError } = await limitUser.client.from('item_photos').insert({
      item_id: itemId,
      storage_path: `test/photo-limit-overflow-${limitUser.id}.jpg`,
      sort_order: 100,
    });

    expect(overError).not.toBeNull();
    expect(overError?.code).toBe('23514');
    expect(overError?.message).toContain('photo_limit_exceeded');

    const { error: subError } = await adminClient.from('subscriptions').insert({
      user_id: limitUser.id,
      plan: 'paid',
      status: 'active',
    });
    if (subError) {
      throw new Error(subError.message);
    }

    const { data, error } = await limitUser.client
      .from('item_photos')
      .insert({
        item_id: itemId,
        storage_path: `test/photo-limit-after-paid-${limitUser.id}.jpg`,
        sort_order: 101,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
  });
});
