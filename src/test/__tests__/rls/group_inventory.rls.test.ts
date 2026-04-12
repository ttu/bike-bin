import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userAdmin: TestUser;
let userAdmin2: TestUser;
let userMember: TestUser;
let userOutsider: TestUser;

let groupId: string;
let otherGroupId: string;
let groupItemId: string;
let publicGroupItemId: string;

beforeAll(async () => {
  userAdmin = await createTestUser('gi-admin');
  userAdmin2 = await createTestUser('gi-admin2');
  userMember = await createTestUser('gi-member');
  userOutsider = await createTestUser('gi-outsider');

  // Create a private group with userAdmin as admin, userMember as member
  const { data: grp, error: grpErr } = await adminClient
    .from('groups')
    .insert({ name: 'Group Inventory Test Group', is_public: false })
    .select('id')
    .single();
  if (grpErr) throw new Error(`Failed to seed group: ${grpErr.message}`);
  groupId = grp.id;

  // A second group for transfer tests (userAdmin2 is the admin)
  const { data: grp2, error: grp2Err } = await adminClient
    .from('groups')
    .insert({ name: 'Second Group', is_public: false })
    .select('id')
    .single();
  if (grp2Err) throw new Error(`Failed to seed second group: ${grp2Err.message}`);
  otherGroupId = grp2.id;

  await adminClient.from('group_members').insert([
    { group_id: groupId, user_id: userAdmin.id, role: 'admin' },
    { group_id: groupId, user_id: userMember.id, role: 'member' },
    { group_id: otherGroupId, user_id: userAdmin2.id, role: 'admin' },
    { group_id: otherGroupId, user_id: userAdmin.id, role: 'admin' },
  ]);

  // Seed a group item owned by groupId (visibility=private)
  const { data: item, error: itemErr } = await adminClient
    .from('items')
    .insert({
      group_id: groupId,
      created_by: userAdmin.id,
      name: 'Group Workshop Stand',
      category: 'tool',
      condition: 'good',
      visibility: 'private',
    })
    .select('id')
    .single();
  if (itemErr) throw new Error(`Failed to seed group item: ${itemErr.message}`);
  groupItemId = item.id;

  // A public group item (visibility=all) for non-member visibility test
  const { data: pubItem, error: pubItemErr } = await adminClient
    .from('items')
    .insert({
      group_id: groupId,
      created_by: userAdmin.id,
      name: 'Public Group Pump',
      category: 'tool',
      condition: 'good',
      visibility: 'all',
    })
    .select('id')
    .single();
  if (pubItemErr) throw new Error(`Failed to seed public group item: ${pubItemErr.message}`);
  publicGroupItemId = pubItem.id;
}, 30_000);

afterAll(async () => {
  await adminClient.from('items').delete().eq('group_id', groupId);
  await adminClient.from('items').delete().eq('group_id', otherGroupId);
  await adminClient.from('group_members').delete().eq('group_id', groupId);
  await adminClient.from('group_members').delete().eq('group_id', otherGroupId);
  await adminClient.from('groups').delete().eq('id', groupId);
  await adminClient.from('groups').delete().eq('id', otherGroupId);
  await cleanupUsers([userAdmin, userAdmin2, userMember, userOutsider]);
});

// ============================================================
// items — INSERT / UPDATE / DELETE by group admin vs member
// ============================================================

describe('group items — write access', () => {
  it('admin can create item with group_id', async () => {
    const { data, error } = await userAdmin.client
      .from('items')
      .insert({
        group_id: groupId,
        created_by: userAdmin.id,
        name: 'Admin-created item',
        category: 'tool',
        condition: 'good',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    if (data?.id) await adminClient.from('items').delete().eq('id', data.id);
  });

  it('non-admin member cannot create group item', async () => {
    const { error } = await userMember.client.from('items').insert({
      group_id: groupId,
      created_by: userMember.id,
      name: 'Member-created item',
      category: 'tool',
      condition: 'good',
    });
    expect(error).not.toBeNull();
  });

  it('admin can update group item', async () => {
    const { error } = await userAdmin.client
      .from('items')
      .update({ name: 'Renamed by admin' })
      .eq('id', groupItemId);
    expect(error).toBeNull();
    const { data } = await adminClient.from('items').select('name').eq('id', groupItemId).single();
    expect(data?.name).toBe('Renamed by admin');
  });

  it('member cannot update group item', async () => {
    const { data, error } = await userMember.client
      .from('items')
      .update({ name: 'Hijacked' })
      .eq('id', groupItemId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });

  it('CHECK constraint rejects item with both owner_id and group_id', async () => {
    const { error } = await adminClient.from('items').insert({
      owner_id: userAdmin.id,
      group_id: groupId,
      created_by: userAdmin.id,
      name: 'Both',
      category: 'tool',
      condition: 'good',
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/items_exclusive_owner/);
  });

  it('CHECK constraint rejects item with neither owner_id nor group_id', async () => {
    const { error } = await adminClient.from('items').insert({
      name: 'Neither',
      category: 'tool',
      condition: 'good',
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/items_exclusive_owner/);
  });
});

// ============================================================
// items — SELECT visibility
// ============================================================

describe('group items — read access', () => {
  it('member can see private group item', async () => {
    const { data, error } = await userMember.client
      .from('items')
      .select('id')
      .eq('id', groupItemId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('non-member cannot see private group item', async () => {
    const { data, error } = await userOutsider.client
      .from('items')
      .select('id')
      .eq('id', groupItemId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('non-member can see public (visibility=all) group item', async () => {
    const { data, error } = await userOutsider.client
      .from('items')
      .select('id')
      .eq('id', publicGroupItemId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

// ============================================================
// borrow_requests on group items
// ============================================================

describe('group items — borrow requests', () => {
  it('member can create borrow request on group item', async () => {
    const { data, error } = await userMember.client
      .from('borrow_requests')
      .insert({ item_id: groupItemId, requester_id: userMember.id })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    if (data?.id) await adminClient.from('borrow_requests').delete().eq('id', data.id);
  });

  it('admin cannot create borrow request on own group item', async () => {
    const { error } = await userAdmin.client
      .from('borrow_requests')
      .insert({ item_id: groupItemId, requester_id: userAdmin.id });
    expect(error).not.toBeNull();
  });

  it('admin can accept borrow request and acted_by is set', async () => {
    const { data: req } = await userMember.client
      .from('borrow_requests')
      .insert({ item_id: groupItemId, requester_id: userMember.id })
      .select('id')
      .single();
    const reqId = req!.id;

    const { error: updErr } = await userAdmin.client
      .from('borrow_requests')
      .update({ status: 'accepted' })
      .eq('id', reqId);
    expect(updErr).toBeNull();

    const { data: after } = await adminClient
      .from('borrow_requests')
      .select('status, acted_by')
      .eq('id', reqId)
      .single();
    expect(after?.status).toBe('accepted');
    expect(after?.acted_by).toBe(userAdmin.id);

    await adminClient.from('borrow_requests').delete().eq('id', reqId);
  });
});

// ============================================================
// transfer_item_ownership RPC
// ============================================================

describe('transfer_item_ownership RPC', () => {
  it('personal → group: admin of target transfers their own item', async () => {
    // Create personal item owned by userAdmin
    const { data: personal } = await adminClient
      .from('items')
      .insert({
        owner_id: userAdmin.id,
        name: 'Personal to Transfer',
        category: 'tool',
        condition: 'good',
      })
      .select('id')
      .single();
    const itemId = personal!.id;

    const { error } = await userAdmin.client.rpc('transfer_item_ownership', {
      p_item_id: itemId,
      p_to_group_id: groupId,
      p_to_owner_id: undefined,
    });
    expect(error).toBeNull();

    const { data: row } = await adminClient
      .from('items')
      .select('owner_id, group_id, created_by, visibility')
      .eq('id', itemId)
      .single();
    expect(row?.owner_id).toBeNull();
    expect(row?.group_id).toBe(groupId);
    expect(row?.created_by).toBe(userAdmin.id);
    expect(row?.visibility).toBe('private');

    await adminClient.from('items').delete().eq('id', itemId);
  });

  it('group → personal: transfer to self only', async () => {
    // Create a group item owned by groupId
    const { data: grpItem } = await adminClient
      .from('items')
      .insert({
        group_id: groupId,
        created_by: userAdmin.id,
        name: 'Group to Personal',
        category: 'tool',
        condition: 'good',
      })
      .select('id')
      .single();
    const itemId = grpItem!.id;

    // Non-self target rejected
    const { error: wrong } = await userAdmin.client.rpc('transfer_item_ownership', {
      p_item_id: itemId,
      p_to_owner_id: userMember.id,
      p_to_group_id: undefined,
    });
    expect(wrong).not.toBeNull();

    // Self target works
    const { error } = await userAdmin.client.rpc('transfer_item_ownership', {
      p_item_id: itemId,
      p_to_owner_id: userAdmin.id,
      p_to_group_id: undefined,
    });
    expect(error).toBeNull();

    const { data: row } = await adminClient
      .from('items')
      .select('owner_id, group_id')
      .eq('id', itemId)
      .single();
    expect(row?.owner_id).toBe(userAdmin.id);
    expect(row?.group_id).toBeNull();

    await adminClient.from('items').delete().eq('id', itemId);
  });

  it('transfer blocked when active borrow exists', async () => {
    const { data: personal } = await adminClient
      .from('items')
      .insert({
        owner_id: userAdmin.id,
        name: 'Locked by borrow',
        category: 'tool',
        condition: 'good',
      })
      .select('id')
      .single();
    const itemId = personal!.id;

    const { data: req } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: userMember.id, status: 'pending' })
      .select('id')
      .single();
    const reqId = req!.id;

    const { error } = await userAdmin.client.rpc('transfer_item_ownership', {
      p_item_id: itemId,
      p_to_group_id: groupId,
      p_to_owner_id: undefined,
    });
    expect(error).not.toBeNull();

    await adminClient.from('borrow_requests').delete().eq('id', reqId);
    await adminClient.from('items').delete().eq('id', itemId);
  });
});

// ============================================================
// ratings: user rates a group after a returned borrow
// ============================================================

describe('group ratings', () => {
  it('rating a group after returned borrow succeeds and updates aggregate', async () => {
    // Create borrow request, mark returned
    const { data: req } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: groupItemId, requester_id: userMember.id, status: 'returned' })
      .select('id')
      .single();
    const reqId = req!.id;

    const { error } = await userMember.client.from('ratings').insert({
      from_user_id: userMember.id,
      to_group_id: groupId,
      item_id: groupItemId,
      transaction_type: 'borrow',
      score: 5,
      text: 'Great gear',
    });
    expect(error).toBeNull();

    const { data: grp } = await adminClient
      .from('groups')
      .select('rating_avg, rating_count')
      .eq('id', groupId)
      .single();
    expect(Number(grp?.rating_avg)).toBeGreaterThan(0);
    expect(grp?.rating_count).toBeGreaterThanOrEqual(1);

    await adminClient.from('ratings').delete().eq('to_group_id', groupId);
    await adminClient.from('borrow_requests').delete().eq('id', reqId);
  });
});

// ============================================================
// Admin roster sync trigger on group_members
// ============================================================

describe('conversation participants sync on admin roster changes', () => {
  it('demoting admin removes them from group item conversations but keeps requester-owned rows', async () => {
    // Seed two distinct group items: one where userMember will be a borrow requester,
    // one where they will not. The trigger's "keep when requester" exception is per-item.
    const { data: itemA } = await adminClient
      .from('items')
      .insert({
        group_id: groupId,
        created_by: userAdmin.id,
        name: 'Sync Item A',
        category: 'tool',
        condition: 'good',
      })
      .select('id')
      .single();
    const itemAId = itemA!.id;

    const { data: itemB } = await adminClient
      .from('items')
      .insert({
        group_id: groupId,
        created_by: userAdmin.id,
        name: 'Sync Item B',
        category: 'tool',
        condition: 'good',
      })
      .select('id')
      .single();
    const itemBId = itemB!.id;

    // Promote userMember to admin so they get added to future conversations
    await adminClient
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', userMember.id);

    // Conversation about item A (userMember has no borrow request here)
    const { data: convA } = await adminClient
      .from('conversations')
      .insert({ item_id: itemAId })
      .select('id')
      .single();
    const convAId = convA!.id;
    await adminClient.from('conversation_participants').insert([
      { conversation_id: convAId, user_id: userAdmin.id },
      { conversation_id: convAId, user_id: userMember.id },
    ]);

    // Conversation about item B, plus a borrow_request by userMember on item B
    const { data: convB } = await adminClient
      .from('conversations')
      .insert({ item_id: itemBId })
      .select('id')
      .single();
    const convBId = convB!.id;
    const { data: br } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: itemBId, requester_id: userMember.id, status: 'pending' })
      .select('id')
      .single();
    await adminClient.from('conversation_participants').insert([
      { conversation_id: convBId, user_id: userAdmin.id },
      { conversation_id: convBId, user_id: userMember.id },
    ]);

    // Demote userMember back to member
    await adminClient
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', groupId)
      .eq('user_id', userMember.id);

    // userMember removed from convA (no borrow link to item A)
    const { data: p1 } = await adminClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', convAId)
      .eq('user_id', userMember.id);
    expect(p1).toEqual([]);

    // userMember still in convB (they are the requester on item B)
    const { data: p2 } = await adminClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', convBId)
      .eq('user_id', userMember.id);
    expect(p2).toHaveLength(1);

    // Cleanup
    await adminClient.from('borrow_requests').delete().eq('id', br!.id);
    await adminClient.from('conversations').delete().eq('id', convAId);
    await adminClient.from('conversations').delete().eq('id', convBId);
    await adminClient.from('items').delete().eq('id', itemAId);
    await adminClient.from('items').delete().eq('id', itemBId);
  });
});
