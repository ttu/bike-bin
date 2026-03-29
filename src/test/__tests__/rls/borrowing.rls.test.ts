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

describe('borrow_requests — UPDATE (state machine)', () => {
  async function seedPendingBorrowRequest(): Promise<string> {
    const { data, error } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: itemId, requester_id: requester.id, status: 'pending' })
      .select('id')
      .single();
    if (error) throw new Error(`Failed to seed borrow_request: ${error.message}`);
    return data.id as string;
  }

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

  it('owner can mark an accepted request as returned', async () => {
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
    expect(error).toBeNull();
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
});
