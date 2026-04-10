import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userA: TestUser;
let userB: TestUser;

beforeAll(async () => {
  userA = await createTestUser('mod-userA');
  userB = await createTestUser('mod-userB');
});

afterAll(async () => {
  // Clean up blocklist/log rows created in tests
  await adminClient
    .from('blocked_oauth_identities')
    .delete()
    .like('provider_user_id', 'rls-test-%');
  await adminClient.from('moderation_enforcement_log').delete().eq('reason', 'rls-test');
  await adminClient.from('reports').delete().in('reporter_id', [userA.id, userB.id]);
  await cleanupUsers([userA, userB]);
});

describe('blocked_oauth_identities RLS', () => {
  it('authenticated user cannot insert', async () => {
    const { error } = await userA.client.from('blocked_oauth_identities').insert({
      provider: 'google',
      provider_user_id: 'rls-test-insert',
    });
    expect(error).not.toBeNull();
  });

  it('authenticated user cannot select (RLS hides rows)', async () => {
    const { error: seedErr } = await adminClient
      .from('blocked_oauth_identities')
      .upsert(
        { provider: 'google', provider_user_id: 'rls-test-select' },
        { onConflict: 'provider,provider_user_id' },
      );
    expect(seedErr).toBeNull();

    const { data } = await userA.client.from('blocked_oauth_identities').select('*');
    expect(data).toEqual([]);
  });

  it('service role can upsert and select', async () => {
    const { error: insertErr } = await adminClient
      .from('blocked_oauth_identities')
      .upsert(
        { provider: 'apple', provider_user_id: 'rls-test-admin' },
        { onConflict: 'provider,provider_user_id' },
      );
    expect(insertErr).toBeNull();

    const { data, error: selectErr } = await adminClient
      .from('blocked_oauth_identities')
      .select('*')
      .eq('provider', 'apple')
      .eq('provider_user_id', 'rls-test-admin');
    expect(selectErr).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('unique constraint on (provider, provider_user_id)', async () => {
    const { error: seedErr } = await adminClient
      .from('blocked_oauth_identities')
      .upsert(
        { provider: 'google', provider_user_id: 'rls-test-unique' },
        { onConflict: 'provider,provider_user_id' },
      );
    expect(seedErr).toBeNull();
    // Insert without upsert to trigger conflict
    const { error } = await adminClient
      .from('blocked_oauth_identities')
      .insert({ provider: 'google', provider_user_id: 'rls-test-unique' });
    expect(error).not.toBeNull();
  });
});

describe('moderation_enforcement_log RLS', () => {
  it('authenticated user cannot insert', async () => {
    const { error } = await userA.client.from('moderation_enforcement_log').insert({
      sanctioned_user_id: userB.id,
      reason: 'rls-test',
    });
    expect(error).not.toBeNull();
  });

  it('authenticated user cannot select', async () => {
    const { error: seedErr } = await adminClient.from('moderation_enforcement_log').insert({
      sanctioned_user_id: userB.id,
      reason: 'rls-test',
    });
    expect(seedErr).toBeNull();

    const { data } = await userA.client.from('moderation_enforcement_log').select('*');
    expect(data).toEqual([]);
  });

  it('service role can insert and select', async () => {
    const { error: insertErr } = await adminClient
      .from('moderation_enforcement_log')
      .insert({ sanctioned_user_id: userB.id, reason: 'rls-test' });
    expect(insertErr).toBeNull();

    const { data, error: selectErr } = await adminClient
      .from('moderation_enforcement_log')
      .select('*')
      .eq('reason', 'rls-test');
    expect(selectErr).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });
});

describe('reports with new target types', () => {
  it('user can insert report with target_type item_photo', async () => {
    const fakePhotoId = '00000000-0000-0000-0000-000000000001';
    const { error } = await userA.client.from('reports').insert({
      reporter_id: userA.id,
      target_type: 'item_photo',
      target_id: fakePhotoId,
      reason: 'inappropriate',
    });
    expect(error).toBeNull();
  });

  it('user can insert report with target_type message', async () => {
    const fakeMessageId = '00000000-0000-0000-0000-000000000002';
    const { error } = await userA.client.from('reports').insert({
      reporter_id: userA.id,
      target_type: 'message',
      target_id: fakeMessageId,
      reason: 'harassment',
      text: 'Threatening message content',
    });
    expect(error).toBeNull();
  });
});
