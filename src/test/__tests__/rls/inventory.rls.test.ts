import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userA: TestUser;
let userB: TestUser;
let userC: TestUser;

// Seeded data IDs for cleanup
let groupId: string;
let publicItemId: string;
let groupItemId: string;
let privateItemId: string;
let loanedItemId: string;
let photoId: string;

beforeAll(async () => {
  userA = await createTestUser('inv-a');
  userB = await createTestUser('inv-b');
  userC = await createTestUser('inv-c');

  // Create a group via adminClient
  const { data: groupData, error: groupError } = await adminClient
    .from('groups')
    .insert({ name: 'Test Group' })
    .select('id')
    .single();
  if (groupError) throw new Error(`Failed to seed group: ${groupError.message}`);
  groupId = groupData.id;

  // Add userA and userC as group members
  const { error: memberAError } = await adminClient
    .from('group_members')
    .insert({ group_id: groupId, user_id: userA.id, role: 'admin' });
  if (memberAError) throw new Error(`Failed to add userA to group: ${memberAError.message}`);

  const { error: memberCError } = await adminClient
    .from('group_members')
    .insert({ group_id: groupId, user_id: userC.id, role: 'member' });
  if (memberCError) throw new Error(`Failed to add userC to group: ${memberCError.message}`);

  // Create publicItem for userA
  const { data: pubData, error: pubError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'Public Item',
      category: 'component',
      condition: 'good',
      visibility: 'all',
      status: 'stored',
    })
    .select('id')
    .single();
  if (pubError) throw new Error(`Failed to seed publicItem: ${pubError.message}`);
  publicItemId = pubData.id;

  // Create groupItem for userA
  const { data: grpData, error: grpError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'Group Item',
      category: 'tool',
      condition: 'new',
      visibility: 'groups',
      status: 'stored',
    })
    .select('id')
    .single();
  if (grpError) throw new Error(`Failed to seed groupItem: ${grpError.message}`);
  groupItemId = grpData.id;

  // Link groupItem to the group via item_groups
  const { error: itemGroupError } = await adminClient
    .from('item_groups')
    .insert({ item_id: groupItemId, group_id: groupId });
  if (itemGroupError) throw new Error(`Failed to seed item_groups: ${itemGroupError.message}`);

  // Create privateItem for userA
  const { data: privData, error: privError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'Private Item',
      category: 'accessory',
      condition: 'worn',
      visibility: 'private',
      status: 'stored',
    })
    .select('id')
    .single();
  if (privError) throw new Error(`Failed to seed privateItem: ${privError.message}`);
  privateItemId = privData.id;

  // Create loanedItem for userA
  const { data: loanData, error: loanError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'Loaned Item',
      category: 'bike',
      condition: 'good',
      visibility: 'all',
      status: 'loaned',
    })
    .select('id')
    .single();
  if (loanError) throw new Error(`Failed to seed loanedItem: ${loanError.message}`);
  loanedItemId = loanData.id;

  // Create an item_photo for publicItem
  const { data: photoData, error: photoError } = await adminClient
    .from('item_photos')
    .insert({ item_id: publicItemId, storage_path: 'test/public-photo.jpg', sort_order: 0 })
    .select('id')
    .single();
  if (photoError) throw new Error(`Failed to seed item_photo: ${photoError.message}`);
  photoId = photoData.id;
}, 30_000);

afterAll(async () => {
  await adminClient.from('item_photos').delete().eq('id', photoId);
  await adminClient.from('item_groups').delete().eq('item_id', groupItemId);
  await adminClient.from('items').delete().eq('id', loanedItemId);
  await adminClient.from('items').delete().eq('id', privateItemId);
  await adminClient.from('items').delete().eq('id', groupItemId);
  await adminClient.from('items').delete().eq('id', publicItemId);
  await adminClient.from('group_members').delete().eq('group_id', groupId);
  await adminClient.from('groups').delete().eq('id', groupId);
  await cleanupUsers([userA, userB, userC]);
});

// ============================================================
// items — SELECT
// ============================================================

describe('items — SELECT', () => {
  it('owner can read all own items', async () => {
    const { data, error } = await userA.client
      .from('items')
      .select('id')
      .in('id', [publicItemId, groupItemId, privateItemId, loanedItemId]);
    expect(error).toBeNull();
    expect(data).toHaveLength(4);
  });

  it('other user can read public items', async () => {
    const { data, error } = await userB.client.from('items').select('id').eq('id', publicItemId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(publicItemId);
  });

  it('other user cannot read private items', async () => {
    const { data, error } = await userB.client.from('items').select('id').eq('id', privateItemId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('group member can read group-shared items', async () => {
    const { data, error } = await userC.client.from('items').select('id').eq('id', groupItemId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(groupItemId);
  });

  it('non-member cannot read group-shared items', async () => {
    const { data, error } = await userB.client.from('items').select('id').eq('id', groupItemId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// items — INSERT
// ============================================================

describe('items — INSERT', () => {
  it('user can insert item as themselves', async () => {
    const { data, error } = await userA.client
      .from('items')
      .insert({
        owner_id: userA.id,
        name: 'Temp Insert Item',
        category: 'component',
        condition: 'new',
        visibility: 'all',
        status: 'stored',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    // Cleanup
    if (data?.id) {
      await adminClient.from('items').delete().eq('id', data.id);
    }
  });

  it('user cannot insert item as another user', async () => {
    const { error } = await userB.client.from('items').insert({
      owner_id: userA.id,
      name: 'Stolen Item',
      category: 'component',
      condition: 'good',
      visibility: 'all',
      status: 'stored',
    });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// items — UPDATE
// ============================================================

describe('items — UPDATE', () => {
  it('owner can update own stored item', async () => {
    const { error } = await userA.client
      .from('items')
      .update({ name: 'Updated Public Item' })
      .eq('id', publicItemId);
    expect(error).toBeNull();
  });

  it('owner cannot update loaned item except marking returned (name change blocked)', async () => {
    const { data, error } = await userA.client
      .from('items')
      .update({ name: 'Should Not Update' })
      .eq('id', loanedItemId)
      .select();
    // No policy allows loaned row with new row still loaned + renamed
    if (error) {
      expect(error).toBeTruthy();
    } else {
      expect(data).toEqual([]);
    }
    // Verify via admin that name was not changed
    const { data: adminData } = await adminClient
      .from('items')
      .select('name')
      .eq('id', loanedItemId)
      .single();
    expect(adminData?.name).toBe('Loaned Item');
  });

  it('owner can mark loaned item as stored (return from loan)', async () => {
    const { data: tempRow, error: insertError } = await adminClient
      .from('items')
      .insert({
        owner_id: userA.id,
        name: 'Temp Return From Loan',
        category: 'bike',
        condition: 'good',
        visibility: 'all',
        status: 'loaned',
      })
      .select('id')
      .single();
    if (insertError) throw new Error(`Failed to seed temp loaned item: ${insertError.message}`);
    const tempId = tempRow.id;

    const { data, error } = await userA.client
      .from('items')
      .update({ status: 'stored' })
      .eq('id', tempId)
      .select('id, status')
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe('stored');

    await adminClient.from('items').delete().eq('id', tempId);
  });

  it('other user cannot update items they do not own', async () => {
    const { data, error } = await userB.client
      .from('items')
      .update({ name: 'Hijacked Item' })
      .eq('id', publicItemId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify via admin that name was not changed
    const { data: adminData } = await adminClient
      .from('items')
      .select('name')
      .eq('id', publicItemId)
      .single();
    expect(adminData?.name).not.toBe('Hijacked Item');
  });
});

// ============================================================
// items — DELETE
// ============================================================

describe('items — DELETE', () => {
  it('owner can delete own stored item', async () => {
    // Create a temporary item to delete
    const { data: tempData, error: insertError } = await adminClient
      .from('items')
      .insert({
        owner_id: userA.id,
        name: 'Temp Delete Item',
        category: 'accessory',
        condition: 'worn',
        visibility: 'all',
        status: 'stored',
      })
      .select('id')
      .single();
    if (insertError) throw new Error(`Failed to create temp item: ${insertError.message}`);
    const tempId = tempData.id;

    const { error } = await userA.client.from('items').delete().eq('id', tempId);
    expect(error).toBeNull();

    // Verify it's gone
    const { data: gone } = await adminClient.from('items').select('id').eq('id', tempId);
    expect(gone).toEqual([]);
  });

  it('owner cannot delete loaned item (status guard)', async () => {
    const { data, error } = await userA.client
      .from('items')
      .delete()
      .eq('id', loanedItemId)
      .select();
    // RLS using_expr blocks the row — either error or empty result set
    if (error) {
      expect(error).toBeTruthy();
    } else {
      expect(data).toEqual([]);
    }
    // Verify it still exists
    const { data: stillExists } = await adminClient
      .from('items')
      .select('id')
      .eq('id', loanedItemId)
      .single();
    expect(stillExists?.id).toBe(loanedItemId);
  });

  it('other user cannot delete items they do not own', async () => {
    const { data, error } = await userB.client
      .from('items')
      .delete()
      .eq('id', publicItemId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify it still exists
    const { data: stillExists } = await adminClient
      .from('items')
      .select('id')
      .eq('id', publicItemId)
      .single();
    expect(stillExists?.id).toBe(publicItemId);
  });
});

// ============================================================
// item_photos — SELECT
// ============================================================

describe('item_photos — SELECT', () => {
  it('owner can read photos of own items', async () => {
    const { data, error } = await userA.client.from('item_photos').select('id').eq('id', photoId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(photoId);
  });

  it('other user can read photos of public items', async () => {
    const { data, error } = await userB.client.from('item_photos').select('id').eq('id', photoId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(photoId);
  });

  it('other user cannot read photos of private items', async () => {
    // Add a photo to privateItem via adminClient for this test
    const { data: privPhotoData, error: privPhotoError } = await adminClient
      .from('item_photos')
      .insert({ item_id: privateItemId, storage_path: 'test/private-photo.jpg', sort_order: 0 })
      .select('id')
      .single();
    if (privPhotoError) throw new Error(`Failed to seed private photo: ${privPhotoError.message}`);
    const privPhotoId = privPhotoData.id;

    const { data, error } = await userB.client
      .from('item_photos')
      .select('id')
      .eq('id', privPhotoId);
    expect(error).toBeNull();
    expect(data).toEqual([]);

    // Cleanup
    await adminClient.from('item_photos').delete().eq('id', privPhotoId);
  });

  it('group member can read photos of group-shared items', async () => {
    // Add a photo to groupItem via adminClient for this test
    const { data: grpPhotoData, error: grpPhotoError } = await adminClient
      .from('item_photos')
      .insert({ item_id: groupItemId, storage_path: 'test/group-photo.jpg', sort_order: 0 })
      .select('id')
      .single();
    if (grpPhotoError) throw new Error(`Failed to seed group photo: ${grpPhotoError.message}`);
    const grpPhotoId = grpPhotoData.id;

    const { data, error } = await userC.client
      .from('item_photos')
      .select('id')
      .eq('id', grpPhotoId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(grpPhotoId);

    // Cleanup
    await adminClient.from('item_photos').delete().eq('id', grpPhotoId);
  });
});

// ============================================================
// item_photos — INSERT
// ============================================================

describe('item_photos — INSERT', () => {
  it('owner can insert photos for own items', async () => {
    const { data, error } = await userA.client
      .from('item_photos')
      .insert({ item_id: publicItemId, storage_path: 'test/owner-new-photo.jpg', sort_order: 1 })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    // Cleanup
    if (data?.id) {
      await adminClient.from('item_photos').delete().eq('id', data.id);
    }
  });

  it('other user cannot insert photos for items they do not own', async () => {
    const { error } = await userB.client
      .from('item_photos')
      .insert({ item_id: publicItemId, storage_path: 'test/evil-photo.jpg', sort_order: 2 });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// item_photos — UPDATE
// ============================================================

describe('item_photos — UPDATE', () => {
  it('other user cannot update photos for items they do not own', async () => {
    const { data, error } = await userB.client
      .from('item_photos')
      .update({ storage_path: 'test/hijacked-photo.jpg' })
      .eq('id', photoId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify via admin that path was not changed
    const { data: adminData } = await adminClient
      .from('item_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();
    expect(adminData?.storage_path).not.toBe('test/hijacked-photo.jpg');
  });
});

// ============================================================
// item_photos — DELETE
// ============================================================

describe('item_photos — DELETE', () => {
  it('other user cannot delete photos for items they do not own', async () => {
    const { data, error } = await userB.client
      .from('item_photos')
      .delete()
      .eq('id', photoId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify it still exists
    const { data: stillExists } = await adminClient
      .from('item_photos')
      .select('id')
      .eq('id', photoId)
      .single();
    expect(stillExists?.id).toBe(photoId);
  });
});
