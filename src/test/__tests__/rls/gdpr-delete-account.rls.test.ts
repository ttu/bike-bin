import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

/**
 * Validates GDPR anonymization: nullable FKs + rating aggregate trigger when to_user_id is nulled.
 * Mirrors delete-account edge function UPDATE steps (service role bypasses RLS).
 */
let userA: TestUser;
let userB: TestUser;

let itemId: string;
let conversationId: string;
let messageId: string;
let borrowRequestId: string;
let ratingId: string;

beforeAll(async () => {
  userA = await createTestUser('gdpr-a');
  userB = await createTestUser('gdpr-b');

  const { data: itemData, error: itemError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'GDPR Test Item',
      category: 'tool',
      condition: 'good',
      visibility: 'all',
    })
    .select('id')
    .single();
  if (itemError) throw new Error(`Failed to seed item: ${itemError.message}`);
  itemId = itemData.id;

  const { data: convData, error: convError } = await adminClient
    .from('conversations')
    .insert({ item_id: itemId })
    .select('id')
    .single();
  if (convError) throw new Error(`Failed to seed conversation: ${convError.message}`);
  conversationId = convData.id;

  const { error: participantsError } = await adminClient.from('conversation_participants').insert([
    { conversation_id: conversationId, user_id: userA.id },
    { conversation_id: conversationId, user_id: userB.id },
  ]);
  if (participantsError)
    throw new Error(`Failed to seed participants: ${participantsError.message}`);

  const { data: msgData, error: msgError } = await adminClient
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: userA.id, body: 'Hello from A' })
    .select('id')
    .single();
  if (msgError) throw new Error(`Failed to seed message: ${msgError.message}`);
  messageId = msgData.id;

  const { data: brData, error: brError } = await adminClient
    .from('borrow_requests')
    .insert({ item_id: itemId, requester_id: userB.id, status: 'returned' })
    .select('id')
    .single();
  if (brError) throw new Error(`Failed to seed borrow_request: ${brError.message}`);
  borrowRequestId = brData.id;

  const { data: ratingData, error: ratingError } = await adminClient
    .from('ratings')
    .insert({
      from_user_id: userB.id,
      to_user_id: userA.id,
      score: 4,
      transaction_type: 'borrow',
      item_id: itemId,
    })
    .select('id')
    .single();
  if (ratingError) throw new Error(`Failed to seed rating: ${ratingError.message}`);
  ratingId = ratingData.id;
}, 30_000);

afterAll(async () => {
  await adminClient.from('ratings').delete().eq('id', ratingId);
  await adminClient.from('messages').delete().eq('id', messageId);
  await adminClient.from('borrow_requests').delete().eq('id', borrowRequestId);
  await adminClient
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId);
  await adminClient.from('conversations').delete().eq('id', conversationId);
  await adminClient.from('items').delete().eq('id', itemId);
  await cleanupUsers([userA, userB]);
});

describe('GDPR anonymization (delete-account parity)', () => {
  it('allows nulling sender_id on messages and preserves body', async () => {
    const { error } = await adminClient
      .from('messages')
      .update({ sender_id: null })
      .eq('id', messageId);
    expect(error).toBeNull();

    const { data, error: fetchErr } = await adminClient
      .from('messages')
      .select('sender_id, body')
      .eq('id', messageId)
      .single();
    expect(fetchErr).toBeNull();
    expect(data?.sender_id).toBeNull();
    expect(data?.body).toBe('Hello from A');

    await adminClient.from('messages').update({ sender_id: userA.id }).eq('id', messageId);
  });

  it('allows nulling rating FKs and recalculates recipient aggregates when to_user_id is nulled', async () => {
    const { data: beforeProfile, error: beforeErr } = await adminClient
      .from('profiles')
      .select('rating_avg, rating_count')
      .eq('id', userA.id)
      .single();
    expect(beforeErr).toBeNull();
    expect(beforeProfile?.rating_count).toBeGreaterThanOrEqual(1);

    const { error: updErr } = await adminClient
      .from('ratings')
      .update({ to_user_id: null })
      .eq('id', ratingId);
    expect(updErr).toBeNull();

    const { data: afterProfile, error: afterErr } = await adminClient
      .from('profiles')
      .select('rating_avg, rating_count')
      .eq('id', userA.id)
      .single();
    expect(afterErr).toBeNull();
    expect(afterProfile?.rating_count).toBe(0);
    expect(afterProfile?.rating_avg).toBe(0);

    await adminClient.from('ratings').update({ to_user_id: userA.id }).eq('id', ratingId);
  });

  it('allows nulling from_user_id on ratings', async () => {
    const { error } = await adminClient
      .from('ratings')
      .update({ from_user_id: null })
      .eq('id', ratingId);
    expect(error).toBeNull();

    const { data, error: fetchErr } = await adminClient
      .from('ratings')
      .select('from_user_id, score')
      .eq('id', ratingId)
      .single();
    expect(fetchErr).toBeNull();
    expect(data?.from_user_id).toBeNull();
    expect(data?.score).toBe(4);

    await adminClient.from('ratings').update({ from_user_id: userB.id }).eq('id', ratingId);
  });
});
