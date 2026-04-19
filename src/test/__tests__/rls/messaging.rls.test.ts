import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userA: TestUser;
let userB: TestUser;
let userC: TestUser;

// Seeded data IDs for cleanup
let itemAId: string;
let conversationId: string;
let messageAId: string;

// Group messaging test data
let groupId: string;
let groupAdmin: TestUser;
let groupAdmin2: TestUser;
let groupItemId: string;

beforeAll(async () => {
  userA = await createTestUser('msg-a');
  userB = await createTestUser('msg-b');
  userC = await createTestUser('msg-c');
  groupAdmin = await createTestUser('msg-gadmin');
  groupAdmin2 = await createTestUser('msg-gadmin2');

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

  // --- Group messaging setup ---
  const { data: grp, error: grpErr } = await adminClient
    .from('groups')
    .insert({ name: 'Msg Test Group', is_public: true })
    .select('id')
    .single();
  if (grpErr) throw new Error(`Failed to seed group: ${grpErr.message}`);
  groupId = grp.id;

  await adminClient.from('group_members').insert([
    { group_id: groupId, user_id: groupAdmin.id, role: 'admin' },
    { group_id: groupId, user_id: groupAdmin2.id, role: 'admin' },
  ]);

  const { data: gItem, error: gItemErr } = await adminClient
    .from('items')
    .insert({
      group_id: groupId,
      created_by: groupAdmin.id,
      name: 'Group Brake Pads',
      category: 'component',
      condition: 'good',
      visibility: 'all',
    })
    .select('id')
    .single();
  if (gItemErr) throw new Error(`Failed to seed group item: ${gItemErr.message}`);
  groupItemId = gItem.id;
}, 30_000);

afterAll(async () => {
  await adminClient.from('messages').delete().eq('id', messageAId);
  await adminClient
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId);
  await adminClient.from('conversations').delete().eq('id', conversationId);
  await adminClient.from('items').delete().eq('id', itemAId);
  // Group cleanup (cascades handle participants/conversations)
  await adminClient.from('items').delete().eq('id', groupItemId);
  await adminClient.from('group_members').delete().eq('group_id', groupId);
  await adminClient.from('groups').delete().eq('id', groupId);
  await cleanupUsers([userA, userB, userC, groupAdmin, groupAdmin2]);
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

  it('app flow: client-supplied conversation id, add self then owner, then SELECT works', async () => {
    const newConvId = crypto.randomUUID();
    const { error: insertConvError } = await userB.client.from('conversations').insert({
      id: newConvId,
      item_id: itemAId,
    });
    expect(insertConvError).toBeNull();

    // Add self first — STABLE helpers can't see rows from the same INSERT
    const { error: selfError } = await userB.client
      .from('conversation_participants')
      .insert({ conversation_id: newConvId, user_id: userB.id });
    expect(selfError).toBeNull();

    // Then add the item owner
    const { error: ownerError } = await userB.client
      .from('conversation_participants')
      .insert({ conversation_id: newConvId, user_id: userA.id });
    expect(ownerError).toBeNull();

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
  it('participant can add the item owner to their conversation', async () => {
    // Create a new conversation where only userB is a participant,
    // then userB adds userA (the item owner) — allowed by policy.
    const newConvId = crypto.randomUUID();
    await adminClient.from('conversations').insert({ id: newConvId, item_id: itemAId });
    await adminClient
      .from('conversation_participants')
      .insert({ conversation_id: newConvId, user_id: userB.id });

    const { error } = await userB.client
      .from('conversation_participants')
      .insert({ conversation_id: newConvId, user_id: userA.id });
    expect(error).toBeNull();

    // Cleanup
    await adminClient.from('conversation_participants').delete().eq('conversation_id', newConvId);
    await adminClient.from('conversations').delete().eq('id', newConvId);
  });

  it('participant cannot add arbitrary third party to their conversation', async () => {
    // userA tries to add userC who is neither the item owner nor a group admin
    const { error } = await userA.client
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: userC.id });
    expect(error).toBeTruthy();
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

// ============================================================
// conversations — UPDATE / DELETE (no policies: writes blocked)
// ============================================================

describe('conversations — UPDATE / DELETE', () => {
  it('participant cannot update conversation', async () => {
    const { data, error } = await userA.client
      .from('conversations')
      .update({ item_id: itemAId })
      .eq('id', conversationId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('participant cannot delete conversation', async () => {
    const { data, error } = await userA.client
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: stillExists } = await adminClient
      .from('conversations')
      .select('id')
      .eq('id', conversationId);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// conversation_participants — UPDATE / DELETE
// ============================================================

describe('conversation_participants — UPDATE / DELETE', () => {
  it('participant cannot update participant row', async () => {
    const { data, error } = await userA.client
      .from('conversation_participants')
      .update({ user_id: userA.id })
      .eq('conversation_id', conversationId)
      .eq('user_id', userA.id)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('participant cannot delete participant row', async () => {
    const { data, error } = await userA.client
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userA.id)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: stillExists } = await adminClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userA.id);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// messages — UPDATE / DELETE
// ============================================================

describe('messages — UPDATE / DELETE', () => {
  it('participant cannot update message', async () => {
    const { data, error } = await userA.client
      .from('messages')
      .update({ body: 'Tampered' })
      .eq('id', messageAId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: row } = await adminClient
      .from('messages')
      .select('body')
      .eq('id', messageAId)
      .single();
    expect(row?.body).toBe('Hello from A');
  });

  it('participant cannot delete message', async () => {
    const { data, error } = await userA.client
      .from('messages')
      .delete()
      .eq('id', messageAId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: stillExists } = await adminClient
      .from('messages')
      .select('id')
      .eq('id', messageAId);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// Group item: contact from search (end-to-end app flow)
// ============================================================

describe('group item — contact from search', () => {
  it('outsider can create conversation, add self + group admins, and send message', async () => {
    // Mirrors the app flow in useCreateConversation:
    // 1. userB discovers a group item via search
    // 2. Taps "Contact" → creates conversation with client-supplied id
    // 3. Inserts self + all group admins as participants in one batch
    // 4. Sends a message

    const newConvId = crypto.randomUUID();

    // Step 1: create conversation for the group item
    const { error: convErr } = await userB.client.from('conversations').insert({
      id: newConvId,
      item_id: groupItemId,
    });
    expect(convErr).toBeNull();

    // Step 2a: add self first (STABLE helpers can't see same-statement rows)
    const { error: selfErr } = await userB.client
      .from('conversation_participants')
      .insert({ conversation_id: newConvId, user_id: userB.id });
    expect(selfErr).toBeNull();

    // Step 2b: add group admins
    const { error: adminsErr } = await userB.client.from('conversation_participants').insert([
      { conversation_id: newConvId, user_id: groupAdmin.id },
      { conversation_id: newConvId, user_id: groupAdmin2.id },
    ]);
    expect(adminsErr).toBeNull();

    // Step 3: requester sends a message
    const { data: msg, error: msgErr } = await userB.client
      .from('messages')
      .insert({
        conversation_id: newConvId,
        sender_id: userB.id,
        body: 'Hi, is this part still available?',
      })
      .select('id')
      .single();
    expect(msgErr).toBeNull();
    expect(msg).not.toBeNull();

    // Step 4: group admin can see the conversation and reply
    const { data: adminConvs, error: adminConvErr } = await groupAdmin.client
      .from('conversations')
      .select('id')
      .eq('id', newConvId);
    expect(adminConvErr).toBeNull();
    expect(adminConvs).toHaveLength(1);

    const { error: replyErr } = await groupAdmin.client.from('messages').insert({
      conversation_id: newConvId,
      sender_id: groupAdmin.id,
      body: 'Yes, come pick it up!',
    });
    expect(replyErr).toBeNull();

    // Cleanup
    await adminClient.from('messages').delete().eq('conversation_id', newConvId);
    await adminClient.from('conversation_participants').delete().eq('conversation_id', newConvId);
    await adminClient.from('conversations').delete().eq('id', newConvId);
  });

  it('outsider cannot add non-admin group member as participant', async () => {
    // Add a regular member to the group
    const member = await createTestUser('msg-gmember');
    expect(member.id).toBeTruthy();
    const { error: memberInsertErr } = await adminClient.from('group_members').insert({
      group_id: groupId,
      user_id: member.id,
      role: 'member',
    });
    expect(memberInsertErr).toBeNull();

    const newConvId = crypto.randomUUID();
    const { error: convInsertErr } = await userB.client
      .from('conversations')
      .insert({ id: newConvId, item_id: groupItemId });
    expect(convInsertErr).toBeNull();

    // Add self first (allowed)
    const { error: selfInsertErr } = await userB.client
      .from('conversation_participants')
      .insert({ conversation_id: newConvId, user_id: userB.id });
    expect(selfInsertErr).toBeNull();

    // Try to add a regular member (should fail — only admins allowed)
    const { error } = await userB.client
      .from('conversation_participants')
      .insert({ conversation_id: newConvId, user_id: member.id });
    expect(error).toBeTruthy();

    // Cleanup
    await adminClient.from('conversation_participants').delete().eq('conversation_id', newConvId);
    await adminClient.from('conversations').delete().eq('id', newConvId);
    await adminClient
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', member.id);
    await cleanupUsers([member]);
  });
});
