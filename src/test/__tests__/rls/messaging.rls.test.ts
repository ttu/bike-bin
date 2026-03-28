import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userA: TestUser;
let userB: TestUser;
let userC: TestUser;

// Seeded data IDs for cleanup
let itemAId: string;
let conversationId: string;
let messageAId: string;

beforeAll(async () => {
  userA = await createTestUser('msg-a');
  userB = await createTestUser('msg-b');
  userC = await createTestUser('msg-c');

  // Create a public item for userA — required to create a conversation
  const { data: itemData, error: itemError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'Test Item',
      category: 'tool',
      condition: 'good',
      visibility: 'all',
    })
    .select('id')
    .single();
  if (itemError) throw new Error(`Failed to seed item: ${itemError.message}`);
  itemAId = itemData.id;

  // Create a conversation for that item
  const { data: convData, error: convError } = await adminClient
    .from('conversations')
    .insert({ item_id: itemAId })
    .select('id')
    .single();
  if (convError) throw new Error(`Failed to seed conversation: ${convError.message}`);
  conversationId = convData.id;

  // Add userA and userB as participants
  const { error: participantsError } = await adminClient.from('conversation_participants').insert([
    { conversation_id: conversationId, user_id: userA.id },
    { conversation_id: conversationId, user_id: userB.id },
  ]);
  if (participantsError)
    throw new Error(`Failed to seed participants: ${participantsError.message}`);

  // Create a message from userA
  const { data: msgData, error: msgError } = await adminClient
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: userA.id, body: 'Hello from A' })
    .select('id')
    .single();
  if (msgError) throw new Error(`Failed to seed message: ${msgError.message}`);
  messageAId = msgData.id;
}, 30_000);

afterAll(async () => {
  await adminClient.from('messages').delete().eq('id', messageAId);
  await adminClient
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId);
  await adminClient.from('conversations').delete().eq('id', conversationId);
  await adminClient.from('items').delete().eq('id', itemAId);
  await cleanupUsers([userA, userB, userC]);
});

// ============================================================
// conversations — SELECT
// ============================================================

describe('conversations — SELECT', () => {
  it('participant can see conversation', async () => {
    const { data, error } = await userA.client
      .from('conversations')
      .select('*')
      .eq('id', conversationId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(conversationId);
  });

  it('outsider cannot see conversation', async () => {
    const { data, error } = await userC.client
      .from('conversations')
      .select('*')
      .eq('id', conversationId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// conversations — INSERT
// ============================================================

describe('conversations — INSERT', () => {
  it('authenticated user can create conversation for a visible item', async () => {
    // NOTE: We cannot chain .select('id') here because the conversations SELECT
    // policy requires being a participant, and no participant row exists yet.
    const { error } = await userB.client.from('conversations').insert({ item_id: itemAId });
    expect(error).toBeNull();

    // Cleanup: find and delete the conversation we just created via adminClient
    const { data: convs } = await adminClient
      .from('conversations')
      .select('id')
      .eq('item_id', itemAId)
      .neq('id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (convs && convs.length > 0) {
      await adminClient.from('conversations').delete().eq('id', convs[0].id);
    }
  });

  it('app flow: client-supplied conversation id, then both participants, then SELECT works', async () => {
    const newConvId = crypto.randomUUID();
    const { error: insertConvError } = await userB.client.from('conversations').insert({
      id: newConvId,
      item_id: itemAId,
    });
    expect(insertConvError).toBeNull();

    const { error: insertParticipantsError } = await userB.client
      .from('conversation_participants')
      .insert([
        { conversation_id: newConvId, user_id: userB.id },
        { conversation_id: newConvId, user_id: userA.id },
      ]);
    expect(insertParticipantsError).toBeNull();

    const { data, error } = await userB.client
      .from('conversations')
      .select('id')
      .eq('id', newConvId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    await adminClient.from('conversation_participants').delete().eq('conversation_id', newConvId);
    await adminClient.from('conversations').delete().eq('id', newConvId);
  });

  it('user cannot create conversation without item_id', async () => {
    const { error } = await userA.client.from('conversations').insert({});
    expect(error).toBeTruthy();
  });

  it('user cannot create conversation for an invisible item', async () => {
    // Create a private item for userA
    const { data: privateItemData, error: privateItemError } = await adminClient
      .from('items')
      .insert({
        owner_id: userA.id,
        name: 'Private Item',
        category: 'tool',
        condition: 'good',
        visibility: 'private',
      })
      .select('id')
      .single();
    if (privateItemError)
      throw new Error(`Failed to seed private item: ${privateItemError.message}`);
    const privateItemId = privateItemData.id;

    try {
      const { error } = await userC.client.from('conversations').insert({ item_id: privateItemId });
      expect(error).toBeTruthy();
    } finally {
      await adminClient.from('items').delete().eq('id', privateItemId);
    }
  });
});

// ============================================================
// conversation_participants — SELECT
// ============================================================

describe('conversation_participants — SELECT', () => {
  it('participant can see other participants in their conversation', async () => {
    const { data, error } = await userA.client
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('outsider cannot see participants', async () => {
    const { data, error } = await userC.client
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// conversation_participants — INSERT
// ============================================================

describe('conversation_participants — INSERT', () => {
  it('participant can add someone to their conversation', async () => {
    const { error } = await userA.client
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: userC.id });
    expect(error).toBeNull();

    // Cleanup — remove userC from the conversation
    await adminClient
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userC.id);
  });

  it('non-participant cannot add themselves to a conversation that already has participants', async () => {
    // userC is not a participant; conversation already has participants (userA + userB)
    const { error } = await userC.client
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: userC.id });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// messages — SELECT
// ============================================================

describe('messages — SELECT', () => {
  it('participant can read messages', async () => {
    const { data, error } = await userB.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('outsider cannot read messages', async () => {
    const { data, error } = await userC.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// messages — INSERT
// ============================================================

describe('messages — INSERT', () => {
  it('participant can send message as themselves', async () => {
    const { data, error } = await userB.client
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userB.id, body: 'Hello from B' })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();

    if (data?.id) {
      await adminClient.from('messages').delete().eq('id', data.id);
    }
  });

  it('participant cannot send message as another user', async () => {
    const { error } = await userB.client
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userA.id, body: 'Impersonating A' });
    expect(error).toBeTruthy();
  });

  it('outsider cannot send message', async () => {
    const { error } = await userC.client
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userC.id, body: 'Intruder message' });
    expect(error).toBeTruthy();
  });
});
