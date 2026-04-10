import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let limitUser: TestUser;
const seededItemIds: string[] = [];

beforeAll(async () => {
  limitUser = await createTestUser('inv-limit');

  const rows = Array.from({ length: 500 }, (_, i) => ({
    owner_id: limitUser.id,
    name: `Limit seed ${i}`,
    category: 'tool' as const,
    condition: 'good' as const,
    visibility: 'private' as const,
    status: 'stored' as const,
  }));

  const { data, error } = await adminClient.from('items').insert(rows).select('id');
  if (error) {
    throw new Error(`Failed to seed 500 items: ${error.message}`);
  }
  seededItemIds.push(...(data ?? []).map((r) => r.id));
  expect(seededItemIds).toHaveLength(500);
}, 120_000);

afterAll(async () => {
  await adminClient.from('subscriptions').delete().eq('user_id', limitUser.id);
  if (seededItemIds.length > 0) {
    await adminClient.from('items').delete().in('id', seededItemIds);
  }
  await cleanupUsers([limitUser]);
});

describe('items — inventory subscription row limit', () => {
  it('blocks the 501st row on free tier, then allows more with entitled paid plan', async () => {
    const { count, error: countError } = await adminClient
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', limitUser.id);
    if (countError) {
      throw new Error(countError.message);
    }
    expect(count).toBe(500);

    const { error: overError } = await limitUser.client.from('items').insert({
      owner_id: limitUser.id,
      name: 'Over limit',
      category: 'component',
      condition: 'new',
      visibility: 'private',
      status: 'stored',
    });

    expect(overError).not.toBeNull();
    expect(overError?.code).toBe('23514');
    expect(overError?.message).toContain('inventory_limit_exceeded');

    const { error: subError } = await adminClient.from('subscriptions').insert({
      user_id: limitUser.id,
      plan: 'paid',
      status: 'active',
    });

    if (subError) {
      throw new Error(`Failed to insert subscription: ${subError.message}`);
    }

    const { data, error } = await limitUser.client
      .from('items')
      .insert({
        owner_id: limitUser.id,
        name: 'After upgrade',
        category: 'component',
        condition: 'new',
        visibility: 'private',
        status: 'stored',
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    if (data?.id) {
      seededItemIds.push(data.id);
    }
  });
});
