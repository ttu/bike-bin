import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userAdmin: TestUser;
let userMember: TestUser;
let userOutsider: TestUser;

// Seeded data IDs for cleanup
let publicGroupId: string;
let privateGroupId: string;
let adminItemId: string;

beforeAll(async () => {
  userAdmin = await createTestUser('grp-admin');
  userMember = await createTestUser('grp-member');
  userOutsider = await createTestUser('grp-outsider');

  // Create a public group
  const { data: pubGroupData, error: pubGroupError } = await adminClient
    .from('groups')
    .insert({ name: 'Public Test Group', is_public: true })
    .select('id')
    .single();
  if (pubGroupError) throw new Error(`Failed to seed public group: ${pubGroupError.message}`);
  publicGroupId = pubGroupData.id;

  // Create a private group
  const { data: privGroupData, error: privGroupError } = await adminClient
    .from('groups')
    .insert({ name: 'Private Test Group', is_public: false })
    .select('id')
    .single();
  if (privGroupError) throw new Error(`Failed to seed private group: ${privGroupError.message}`);
  privateGroupId = privGroupData.id;

  // Add userAdmin as 'admin' to both groups
  const { error: adminPubError } = await adminClient
    .from('group_members')
    .insert({ group_id: publicGroupId, user_id: userAdmin.id, role: 'admin' });
  if (adminPubError)
    throw new Error(`Failed to add admin to public group: ${adminPubError.message}`);

  const { error: adminPrivError } = await adminClient
    .from('group_members')
    .insert({ group_id: privateGroupId, user_id: userAdmin.id, role: 'admin' });
  if (adminPrivError)
    throw new Error(`Failed to add admin to private group: ${adminPrivError.message}`);

  // Add userMember as 'member' to both groups
  const { error: memberPubError } = await adminClient
    .from('group_members')
    .insert({ group_id: publicGroupId, user_id: userMember.id, role: 'member' });
  if (memberPubError)
    throw new Error(`Failed to add member to public group: ${memberPubError.message}`);

  const { error: memberPrivError } = await adminClient
    .from('group_members')
    .insert({ group_id: privateGroupId, user_id: userMember.id, role: 'member' });
  if (memberPrivError)
    throw new Error(`Failed to add member to private group: ${memberPrivError.message}`);

  // Create an item for userAdmin
  const { data: itemData, error: itemError } = await adminClient
    .from('items')
    .insert({
      owner_id: userAdmin.id,
      name: 'Admin Test Item',
      category: 'component',
      condition: 'good',
    })
    .select('id')
    .single();
  if (itemError) throw new Error(`Failed to seed item: ${itemError.message}`);
  adminItemId = itemData.id;

  // Add the item to the private group
  const { error: itemGroupError } = await adminClient
    .from('item_groups')
    .insert({ item_id: adminItemId, group_id: privateGroupId });
  if (itemGroupError) throw new Error(`Failed to seed item_group: ${itemGroupError.message}`);
}, 30_000);

afterAll(async () => {
  await adminClient
    .from('item_groups')
    .delete()
    .eq('item_id', adminItemId)
    .eq('group_id', privateGroupId);
  await adminClient.from('items').delete().eq('id', adminItemId);
  await adminClient.from('group_members').delete().eq('group_id', publicGroupId);
  await adminClient.from('group_members').delete().eq('group_id', privateGroupId);
  await adminClient.from('groups').delete().eq('id', publicGroupId);
  await adminClient.from('groups').delete().eq('id', privateGroupId);
  await cleanupUsers([userAdmin, userMember, userOutsider]);
});

// ============================================================
// groups — SELECT
// ============================================================

describe('groups — SELECT', () => {
  it('member can see public group', async () => {
    const { data, error } = await userMember.client
      .from('groups')
      .select('*')
      .eq('id', publicGroupId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(publicGroupId);
  });

  it('member can see private group they belong to', async () => {
    const { data, error } = await userMember.client
      .from('groups')
      .select('*')
      .eq('id', privateGroupId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(privateGroupId);
  });

  it('outsider can see public group', async () => {
    const { data, error } = await userOutsider.client
      .from('groups')
      .select('*')
      .eq('id', publicGroupId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(publicGroupId);
  });

  it('outsider cannot see private group', async () => {
    const { data, error } = await userOutsider.client
      .from('groups')
      .select('*')
      .eq('id', privateGroupId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// groups — INSERT
// ============================================================

describe('groups — INSERT', () => {
  it('authenticated user can create a group', async () => {
    const { data, error } = await userMember.client
      .from('groups')
      .insert({ name: 'Temp Group by Member', is_public: true })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    // Cleanup
    if (data?.id) {
      await adminClient.from('groups').delete().eq('id', data.id);
    }
  });
});

// ============================================================
// groups — UPDATE
// ============================================================

describe('groups — UPDATE', () => {
  it('admin can update group', async () => {
    const { error } = await userAdmin.client
      .from('groups')
      .update({ name: 'Updated Private Group' })
      .eq('id', privateGroupId);
    expect(error).toBeNull();
  });

  it('member (non-admin) cannot update group', async () => {
    const { data, error } = await userMember.client
      .from('groups')
      .update({ name: 'Hijacked Group Name' })
      .eq('id', privateGroupId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });

  it('outsider cannot update group', async () => {
    const { data, error } = await userOutsider.client
      .from('groups')
      .update({ name: 'Outsider Hijacked Group' })
      .eq('id', publicGroupId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });
});

// ============================================================
// groups — DELETE
// ============================================================

describe('groups — DELETE', () => {
  it('admin can delete group', async () => {
    // Create a temp group and add userAdmin as admin
    const { data: tempGroup, error: createError } = await adminClient
      .from('groups')
      .insert({ name: 'Temp Group To Delete', is_public: false })
      .select('id')
      .single();
    if (createError) throw new Error(`Failed to create temp group: ${createError.message}`);
    const tempGroupId = tempGroup.id;

    await adminClient
      .from('group_members')
      .insert({ group_id: tempGroupId, user_id: userAdmin.id, role: 'admin' });

    const { error } = await userAdmin.client.from('groups').delete().eq('id', tempGroupId);
    expect(error).toBeNull();

    // Verify group no longer exists
    const { data: stillExists } = await adminClient
      .from('groups')
      .select('id')
      .eq('id', tempGroupId);
    expect(stillExists).toEqual([]);
  });

  it('member cannot delete group', async () => {
    const { data, error } = await userMember.client
      .from('groups')
      .delete()
      .eq('id', privateGroupId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify group still exists
    const { data: stillExists } = await adminClient
      .from('groups')
      .select('id')
      .eq('id', privateGroupId)
      .single();
    expect(stillExists?.id).toBe(privateGroupId);
  });

  it('outsider cannot delete group', async () => {
    const { data, error } = await userOutsider.client
      .from('groups')
      .delete()
      .eq('id', publicGroupId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify group still exists
    const { data: stillExists } = await adminClient
      .from('groups')
      .select('id')
      .eq('id', publicGroupId)
      .single();
    expect(stillExists?.id).toBe(publicGroupId);
  });
});

// ============================================================
// group_members — SELECT
// ============================================================

describe('group_members — SELECT', () => {
  it('member can see members of groups they belong to', async () => {
    const { data, error } = await userMember.client
      .from('group_members')
      .select('*')
      .eq('group_id', privateGroupId);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('outsider can see members of public groups', async () => {
    const { data, error } = await userOutsider.client
      .from('group_members')
      .select('*')
      .eq('group_id', publicGroupId);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('outsider cannot see members of private groups', async () => {
    const { data, error } = await userOutsider.client
      .from('group_members')
      .select('*')
      .eq('group_id', privateGroupId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// group_members — INSERT
// ============================================================

describe('group_members — INSERT', () => {
  it('user can add themselves to a public group (self-join)', async () => {
    const { error } = await userOutsider.client
      .from('group_members')
      .insert({ group_id: publicGroupId, user_id: userOutsider.id, role: 'member' });
    expect(error).toBeNull();
    // Cleanup
    await adminClient
      .from('group_members')
      .delete()
      .eq('group_id', publicGroupId)
      .eq('user_id', userOutsider.id);
  });

  it('admin can add another user', async () => {
    const { error } = await userAdmin.client
      .from('group_members')
      .insert({ group_id: privateGroupId, user_id: userOutsider.id, role: 'member' });
    expect(error).toBeNull();
    // Cleanup
    await adminClient
      .from('group_members')
      .delete()
      .eq('group_id', privateGroupId)
      .eq('user_id', userOutsider.id);
  });

  it('non-admin member cannot add others', async () => {
    const { error } = await userMember.client
      .from('group_members')
      .insert({ group_id: privateGroupId, user_id: userOutsider.id, role: 'member' });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// group_members — UPDATE
// ============================================================

describe('group_members — UPDATE', () => {
  it('admin can update member roles', async () => {
    const { error } = await userAdmin.client
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', privateGroupId)
      .eq('user_id', userMember.id);
    expect(error).toBeNull();

    // Restore original role via admin
    await adminClient
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', privateGroupId)
      .eq('user_id', userMember.id);
  });

  it('non-admin cannot update roles', async () => {
    const { data, error } = await userMember.client
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', privateGroupId)
      .eq('user_id', userAdmin.id)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });
});

// ============================================================
// group_members — DELETE
// ============================================================

describe('group_members — DELETE', () => {
  it('user can remove themselves from a group', async () => {
    // Add userOutsider to public group first
    const { error: addError } = await adminClient
      .from('group_members')
      .insert({ group_id: publicGroupId, user_id: userOutsider.id, role: 'member' });
    if (addError)
      throw new Error(`Failed to add outsider for self-removal test: ${addError.message}`);

    const { error } = await userOutsider.client
      .from('group_members')
      .delete()
      .eq('group_id', publicGroupId)
      .eq('user_id', userOutsider.id);
    expect(error).toBeNull();

    // Verify removal
    const { data: stillExists } = await adminClient
      .from('group_members')
      .select('*')
      .eq('group_id', publicGroupId)
      .eq('user_id', userOutsider.id);
    expect(stillExists).toEqual([]);
  });

  it('admin can remove others', async () => {
    // Add userOutsider to private group
    const { error: addError } = await adminClient
      .from('group_members')
      .insert({ group_id: privateGroupId, user_id: userOutsider.id, role: 'member' });
    if (addError)
      throw new Error(`Failed to add outsider for admin removal test: ${addError.message}`);

    const { error } = await userAdmin.client
      .from('group_members')
      .delete()
      .eq('group_id', privateGroupId)
      .eq('user_id', userOutsider.id);
    expect(error).toBeNull();

    // Verify removal
    const { data: stillExists } = await adminClient
      .from('group_members')
      .select('*')
      .eq('group_id', privateGroupId)
      .eq('user_id', userOutsider.id);
    expect(stillExists).toEqual([]);
  });

  it('non-admin cannot remove others', async () => {
    const { data, error } = await userMember.client
      .from('group_members')
      .delete()
      .eq('group_id', privateGroupId)
      .eq('user_id', userAdmin.id)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify admin member row still exists
    const { data: stillExists } = await adminClient
      .from('group_members')
      .select('*')
      .eq('group_id', privateGroupId)
      .eq('user_id', userAdmin.id);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// item_groups — SELECT
// ============================================================

describe('item_groups — SELECT', () => {
  it('item owner can see item_groups entries', async () => {
    const { data, error } = await userAdmin.client
      .from('item_groups')
      .select('*')
      .eq('item_id', adminItemId)
      .eq('group_id', privateGroupId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('group member can see item_groups entries', async () => {
    const { data, error } = await userMember.client
      .from('item_groups')
      .select('*')
      .eq('item_id', adminItemId)
      .eq('group_id', privateGroupId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('outsider cannot see item_groups entries', async () => {
    const { data, error } = await userOutsider.client
      .from('item_groups')
      .select('*')
      .eq('item_id', adminItemId)
      .eq('group_id', privateGroupId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// item_groups — INSERT
// ============================================================

describe('item_groups — INSERT', () => {
  it('item owner can assign item to group', async () => {
    const { error } = await userAdmin.client
      .from('item_groups')
      .insert({ item_id: adminItemId, group_id: publicGroupId });
    expect(error).toBeNull();
    // Cleanup
    await adminClient
      .from('item_groups')
      .delete()
      .eq('item_id', adminItemId)
      .eq('group_id', publicGroupId);
  });

  it('non-owner cannot assign item to group', async () => {
    const { error } = await userMember.client
      .from('item_groups')
      .insert({ item_id: adminItemId, group_id: publicGroupId });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// item_groups — DELETE
// ============================================================

describe('item_groups — DELETE', () => {
  it('item owner can remove item from group', async () => {
    // Create a temporary item_groups entry to delete
    const { error: insertError } = await adminClient
      .from('item_groups')
      .insert({ item_id: adminItemId, group_id: publicGroupId });
    if (insertError) throw new Error(`Failed to seed temp item_group: ${insertError.message}`);

    const { error } = await userAdmin.client
      .from('item_groups')
      .delete()
      .eq('item_id', adminItemId)
      .eq('group_id', publicGroupId);
    expect(error).toBeNull();

    // Verify deletion
    const { data: stillExists } = await adminClient
      .from('item_groups')
      .select('*')
      .eq('item_id', adminItemId)
      .eq('group_id', publicGroupId);
    expect(stillExists).toEqual([]);
  });

  it('non-owner cannot remove item from group', async () => {
    const { data, error } = await userMember.client
      .from('item_groups')
      .delete()
      .eq('item_id', adminItemId)
      .eq('group_id', privateGroupId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify entry still exists
    const { data: stillExists } = await adminClient
      .from('item_groups')
      .select('*')
      .eq('item_id', adminItemId)
      .eq('group_id', privateGroupId);
    expect(stillExists).toHaveLength(1);
  });
});
