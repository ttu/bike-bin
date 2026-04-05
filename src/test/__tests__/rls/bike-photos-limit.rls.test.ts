import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let limitUser: TestUser;
let bikeId: string;

beforeAll(async () => {
  limitUser = await createTestUser('bike-photo-limit');

  const { data: bike, error: bikeError } = await adminClient
    .from('bikes')
    .insert({
      owner_id: limitUser.id,
      name: 'Photo seed bike',
      type: 'road',
      condition: 'good',
    })
    .select('id')
    .single();

  if (bikeError || !bike) {
    throw new Error(`Failed to seed bike: ${bikeError?.message}`);
  }
  bikeId = bike.id;

  const photoRows = Array.from({ length: 100 }, (_, i) => ({
    bike_id: bikeId,
    storage_path: `test/bike-photo-limit-${limitUser.id}-${i}.jpg`,
    sort_order: i,
  }));

  const { error: photoError } = await adminClient.from('bike_photos').insert(photoRows);

  if (photoError) {
    throw new Error(`Failed to seed 100 bike photos: ${photoError.message}`);
  }
}, 120_000);

afterAll(async () => {
  await adminClient.from('subscriptions').delete().eq('user_id', limitUser.id);
  await adminClient.from('bikes').delete().eq('id', bikeId);
  await cleanupUsers([limitUser]);
});

describe('bike_photos — account photo row limit', () => {
  it('blocks the 101st bike photo on free tier, then allows more with entitled paid plan', async () => {
    const { error: overError } = await limitUser.client.from('bike_photos').insert({
      bike_id: bikeId,
      storage_path: `test/bike-photo-limit-overflow-${limitUser.id}.jpg`,
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
      .from('bike_photos')
      .insert({
        bike_id: bikeId,
        storage_path: `test/bike-photo-limit-after-paid-${limitUser.id}.jpg`,
        sort_order: 101,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
  });
});
