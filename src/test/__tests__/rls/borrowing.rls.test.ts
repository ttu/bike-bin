import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let owner: TestUser;
let requester: TestUser;
let outsider: TestUser;

let itemId: string;
let borrowRequestId: string;

beforeAll(async () => {
  owner = await createTestUser('brw-owner');
  requester = await createTestUser('brw-requester');
  outsider = await createTestUser('brw-outsider');

  // Seed an item for owner
  const { data: itemData, error: itemError } = await adminClient
    .from('items')
    .insert({
      owner_id: owner.id,
      name: 'Test Tool',
      category: 'tool',
      condition: 'good',
      visibility: 'all',
    })
    .select('id')
    .single();
  if (itemError) throw new Error(`Failed to seed item: ${itemError.message}`);
  itemId = itemData.id;

  // Seed a borrow_request: requester requests the item
  const { data: brData, error: brError } = await adminClient
    .from('borrow_requests')
    .insert({ item_id: itemId, requester_id: requester.id, status: 'pending' })
    .select('id')
    .single();
  if (brError) throw new Error(`Failed to seed borrow_request: ${brError.message}`);
  borrowRequestId = brData.id;
}, 30_000);

afterAll(async () => {
  await adminClient.from('borrow_requests').delete().eq('item_id', itemId);
  await adminClient.from('items').delete().eq('id', itemId);
  await cleanupUsers([owner, requester, outsider]);
});

// ============================================================
// borrow_requests — SELECT
// ============================================================

describe('borrow_requests — SELECT', () => {
  it('requester can see own borrow requests', async () => {
    const { data, error } = await requester.client
      .from('borrow_requests')
      .select('*')
      .eq('id', borrowRequestId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(borrowRequestId);
  });

  it('item owner can see borrow requests for their items', async () => {
    const { data, error } = await owner.client
      .from('borrow_requests')
      .select('*')
      .eq('id', borrowRequestId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(borrowRequestId);
  });

  it('outsider cannot see borrow requests', async () => {
    const { data, error } = await outsider.client
      .from('borrow_requests')
      .select('*')
      .eq('id', borrowRequestId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// borrow_requests — INSERT
// ============================================================

describe('borrow_requests — INSERT', () => {
  it("user can create a borrow request for someone else's item", async () => {
    const { data, error } = await outsider.client
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: outsider.id, status: 'pending' })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    // Cleanup
    if (data?.id) {
      await adminClient.from('borrow_requests').delete().eq('id', data.id);
    }
  });

  it('user cannot create a borrow request for own item', async () => {
    const { error } = await owner.client
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: owner.id, status: 'pending' });
    expect(error).toBeTruthy();
  });

  it('user cannot create request as another user (requester_id != auth.uid())', async () => {
    const { error } = await outsider.client
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: requester.id, status: 'pending' });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// borrow_requests — UPDATE (state machine via trigger)
// ============================================================

async function seedPendingBorrowRequest(): Promise<string> {
  const { data, error } = await adminClient
    .from('borrow_requests')
    .insert({ item_id: itemId, requester_id: requester.id, status: 'pending' })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to seed borrow_request: ${error.message}`);
  return data.id as string;
}

describe('borrow_requests — UPDATE (state machine)', () => {
  it('owner can accept a pending request', async () => {
    const id = await seedPendingBorrowRequest();
    const { error } = await owner.client
      .from('borrow_requests')
      .update({ status: 'accepted' })
      .eq('id', id);
    expect(error).toBeNull();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('owner can reject a pending request', async () => {
    const id = await seedPendingBorrowRequest();
    const { error } = await owner.client
      .from('borrow_requests')
      .update({ status: 'rejected' })
      .eq('id', id);
    expect(error).toBeNull();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('requester can cancel a pending request', async () => {
    const id = await seedPendingBorrowRequest();
    const { error } = await requester.client
      .from('borrow_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);
    expect(error).toBeNull();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('accepted -> returned direct update is rejected (must go via picked_up)', async () => {
    const { data: brData, error: brError } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: requester.id, status: 'accepted' })
      .select('id')
      .single();
    if (brError) throw new Error(`Failed to seed accepted borrow_request: ${brError.message}`);
    const id = brData.id as string;

    const { error } = await owner.client
      .from('borrow_requests')
      .update({ status: 'returned' })
      .eq('id', id);
    expect(error).toBeTruthy();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('requester can cancel an accepted request', async () => {
    const { data: brData, error: brError } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: requester.id, status: 'accepted' })
      .select('id')
      .single();
    if (brError) throw new Error(`Failed to seed accepted borrow_request: ${brError.message}`);
    const id = brData.id as string;

    const { error } = await requester.client
      .from('borrow_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);
    expect(error).toBeNull();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('owner cannot cancel a pending request', async () => {
    const id = await seedPendingBorrowRequest();
    const { error } = await owner.client
      .from('borrow_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);
    expect(error).toBeTruthy();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('requester cannot accept a pending request', async () => {
    const id = await seedPendingBorrowRequest();
    const { error } = await requester.client
      .from('borrow_requests')
      .update({ status: 'accepted' })
      .eq('id', id);
    expect(error).toBeTruthy();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('outsider cannot update any request', async () => {
    const { data, error } = await outsider.client
      .from('borrow_requests')
      .update({ status: 'cancelled' })
      .eq('id', borrowRequestId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });

  it('pending -> picked_up direct update is rejected (invalid transition)', async () => {
    const id = await seedPendingBorrowRequest();
    const { error } = await owner.client
      .from('borrow_requests')
      .update({ status: 'picked_up' })
      .eq('id', id);
    expect(error).toBeTruthy();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('only owner can mark accepted request as picked_up (requester is rejected)', async () => {
    const { data: brData, error: brError } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: requester.id, status: 'accepted' })
      .select('id')
      .single();
    if (brError) throw new Error(`Failed to seed accepted borrow_request: ${brError.message}`);
    const id = brData.id as string;

    const { error } = await requester.client
      .from('borrow_requests')
      .update({ status: 'picked_up' })
      .eq('id', id);
    expect(error).toBeTruthy();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('owner can cancel an accepted request', async () => {
    const { data: brData, error: brError } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: requester.id, status: 'accepted' })
      .select('id')
      .single();
    if (brError) throw new Error(`Failed to seed accepted borrow_request: ${brError.message}`);
    const id = brData.id as string;

    const { error } = await owner.client
      .from('borrow_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);
    expect(error).toBeNull();
    await adminClient.from('borrow_requests').delete().eq('id', id);
  });
});

// ============================================================
// borrow_requests — RPC transition_borrow_request (three-step lifecycle)
// ============================================================

describe('borrow_requests — RPC transition_borrow_request (three-step lifecycle)', () => {
  it('accept transitions item stored -> reserved via RPC', async () => {
    const id = await seedPendingBorrowRequest();

    const { error } = await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'accepted',
      p_new_item_status: 'reserved',
    });
    expect(error).toBeNull();

    const { data: br } = await adminClient
      .from('borrow_requests')
      .select('status')
      .eq('id', id)
      .single();
    expect(br?.status).toBe('accepted');

    const { data: item } = await adminClient
      .from('items')
      .select('status')
      .eq('id', itemId)
      .single();
    expect(item?.status).toBe('reserved');

    await adminClient.from('borrow_requests').delete().eq('id', id);
    await adminClient.from('items').update({ status: 'stored' }).eq('id', itemId);
  });

  it('pickup transitions item reserved -> loaned via RPC', async () => {
    // Set up: seed pending, accept it (sets item to reserved)
    const id = await seedPendingBorrowRequest();
    const { error: acceptError } = await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'accepted',
      p_new_item_status: 'reserved',
    });
    expect(acceptError).toBeNull();

    const { error } = await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'picked_up',
      p_new_item_status: 'loaned',
    });
    expect(error).toBeNull();

    const { data: br } = await adminClient
      .from('borrow_requests')
      .select('status')
      .eq('id', id)
      .single();
    expect(br?.status).toBe('picked_up');

    const { data: item } = await adminClient
      .from('items')
      .select('status')
      .eq('id', itemId)
      .single();
    expect(item?.status).toBe('loaned');

    await adminClient.from('borrow_requests').delete().eq('id', id);
    await adminClient.from('items').update({ status: 'stored' }).eq('id', itemId);
  });

  it('return from picked_up sets item stored via RPC', async () => {
    // Set up: seed pending, accept, pickup
    const id = await seedPendingBorrowRequest();
    await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'accepted',
      p_new_item_status: 'reserved',
    });
    await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'picked_up',
      p_new_item_status: 'loaned',
    });

    const { error } = await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'returned',
      p_new_item_status: 'stored',
    });
    expect(error).toBeNull();

    const { data: br } = await adminClient
      .from('borrow_requests')
      .select('status')
      .eq('id', id)
      .single();
    expect(br?.status).toBe('returned');

    const { data: item } = await adminClient
      .from('items')
      .select('status')
      .eq('id', itemId)
      .single();
    expect(item?.status).toBe('stored');

    await adminClient.from('borrow_requests').delete().eq('id', id);
  });

  it('accepted -> cancelled via RPC sets item stored', async () => {
    const id = await seedPendingBorrowRequest();
    await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'accepted',
      p_new_item_status: 'reserved',
    });

    const { error } = await owner.client.rpc('transition_borrow_request', {
      p_request_id: id,
      p_new_request_status: 'cancelled',
      p_new_item_status: 'stored',
    });
    expect(error).toBeNull();

    const { data: item } = await adminClient
      .from('items')
      .select('status')
      .eq('id', itemId)
      .single();
    expect(item?.status).toBe('stored');

    await adminClient.from('borrow_requests').delete().eq('id', id);
  });
});
