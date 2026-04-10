import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let limitUser: TestUser;
const seededBikeIds: string[] = [];

beforeAll(async () => {
  limitUser = await createTestUser('bike-limit');

  const rows = Array.from({ length: 15 }, (_, i) => ({
    owner_id: limitUser.id,
    name: `Bike ${i}`,
    type: 'road' as const,
    condition: 'good' as const,
  }));

  const { data, error } = await adminClient.from('bikes').insert(rows).select('id');
  if (error) {
    throw new Error(`Failed to seed 15 bikes: ${error.message}`);
  }
  seededBikeIds.push(...(data ?? []).map((r) => r.id));
  expect(seededBikeIds).toHaveLength(15);
}, 60_000);

afterAll(async () => {
  await adminClient.from('subscriptions').delete().eq('user_id', limitUser.id);
  if (seededBikeIds.length > 0) {
    await adminClient.from('bikes').delete().in('id', seededBikeIds);
  }
  await cleanupUsers([limitUser]);
});

describe('bikes — subscription row limit', () => {
  it('blocks the 16th bike on free tier, then allows more with entitled paid plan', async () => {
    const { error: overError } = await limitUser.client.from('bikes').insert({
      owner_id: limitUser.id,
      name: 'Too many',
      type: 'city',
      condition: 'good',
    });

    expect(overError).not.toBeNull();
    expect(overError?.code).toBe('23514');
    expect(overError?.message).toContain('bike_limit_exceeded');

    const { error: subError } = await adminClient.from('subscriptions').insert({
      user_id: limitUser.id,
      plan: 'paid',
      status: 'active',
    });
    if (subError) {
      throw new Error(subError.message);
    }

    const { data, error } = await limitUser.client
      .from('bikes')
      .insert({
        owner_id: limitUser.id,
        name: 'After upgrade',
        type: 'mtb',
        condition: 'good',
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    if (data?.id) {
      seededBikeIds.push(data.id);
    }
  });
});
