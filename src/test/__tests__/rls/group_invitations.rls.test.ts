import { adminClient, cleanupUsers, createTestUser, TestUser } from '../../rls/setup';

let admin: TestUser;
let member: TestUser;
let invitee: TestUser;
let outsider: TestUser;

let groupId: string;

beforeAll(async () => {
  admin = await createTestUser('inv-admin');
  member = await createTestUser('inv-member');
  invitee = await createTestUser('inv-invitee');
  outsider = await createTestUser('inv-outsider');

  const { data: group, error: gErr } = await adminClient
    .from('groups')
    .insert({ name: 'Invitation Test Group', is_public: false })
    .select('id')
    .single();
  if (gErr) throw new Error(`seed group: ${gErr.message}`);
  groupId = group.id;

  const { error: mErr } = await adminClient.from('group_members').insert([
    { group_id: groupId, user_id: admin.id, role: 'admin' },
    { group_id: groupId, user_id: member.id, role: 'member' },
  ]);
  if (mErr) throw new Error(`seed members: ${mErr.message}`);
}, 30_000);

afterAll(async () => {
  await adminClient.from('groups').delete().eq('id', groupId);
  await cleanupUsers([admin, member, invitee, outsider]);
}, 30_000);

describe('group_invitations RLS', () => {
  afterEach(async () => {
    await adminClient.from('group_invitations').delete().eq('group_id', groupId);
  });

  it('admin can create a pending invitation', async () => {
    const { error } = await admin.client.from('group_invitations').insert({
      group_id: groupId,
      invitee_user_id: invitee.id,
      inviter_user_id: admin.id,
    });
    expect(error).toBeNull();
  });

  it('non-admin member cannot create an invitation', async () => {
    const { error } = await member.client.from('group_invitations').insert({
      group_id: groupId,
      invitee_user_id: outsider.id,
      inviter_user_id: member.id,
    });
    expect(error).not.toBeNull();
  });

  it('cannot invite an existing member', async () => {
    const { error } = await admin.client.from('group_invitations').insert({
      group_id: groupId,
      invitee_user_id: member.id,
      inviter_user_id: admin.id,
    });
    expect(error).not.toBeNull();
  });

  it('duplicate pending invitation for same invitee is rejected', async () => {
    const first = await admin.client.from('group_invitations').insert({
      group_id: groupId,
      invitee_user_id: invitee.id,
      inviter_user_id: admin.id,
    });
    expect(first.error).toBeNull();

    const dup = await admin.client.from('group_invitations').insert({
      group_id: groupId,
      invitee_user_id: invitee.id,
      inviter_user_id: admin.id,
    });
    expect(dup.error).not.toBeNull();
  });

  it('invitee sees their own pending invitation; outsider does not', async () => {
    await adminClient.from('group_invitations').insert({
      group_id: groupId,
      invitee_user_id: invitee.id,
      inviter_user_id: admin.id,
    });

    const inviteeView = await invitee.client
      .from('group_invitations')
      .select('id')
      .eq('group_id', groupId);
    expect(inviteeView.error).toBeNull();
    expect(inviteeView.data?.length).toBe(1);

    const outsiderView = await outsider.client
      .from('group_invitations')
      .select('id')
      .eq('group_id', groupId);
    expect(outsiderView.error).toBeNull();
    expect(outsiderView.data?.length).toBe(0);
  });

  it('invitee can reject own pending invitation; outsider cannot', async () => {
    const { data: inv } = await adminClient
      .from('group_invitations')
      .insert({
        group_id: groupId,
        invitee_user_id: invitee.id,
        inviter_user_id: admin.id,
      })
      .select('id')
      .single();

    const outsiderReject = await outsider.client
      .from('group_invitations')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', inv!.id);
    // Either error or simply no rows affected — both are acceptable denials.
    expect(outsiderReject.error !== null || outsiderReject.count === 0).toBe(true);

    const reject = await invitee.client
      .from('group_invitations')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', inv!.id);
    expect(reject.error).toBeNull();
  });

  it('accept_group_invitation RPC adds invitee to group atomically', async () => {
    const { data: inv } = await adminClient
      .from('group_invitations')
      .insert({
        group_id: groupId,
        invitee_user_id: invitee.id,
        inviter_user_id: admin.id,
      })
      .select('id')
      .single();

    const { error } = await invitee.client.rpc('accept_group_invitation', {
      p_invitation_id: inv!.id,
    });
    expect(error).toBeNull();

    const { data: memberRow } = await adminClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', invitee.id)
      .maybeSingle();
    expect(memberRow?.user_id).toBe(invitee.id);

    // Clean up the new membership so later tests aren't affected.
    await adminClient
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', invitee.id);
  });

  it('accept_group_invitation fails if caller is not the invitee', async () => {
    const { data: inv } = await adminClient
      .from('group_invitations')
      .insert({
        group_id: groupId,
        invitee_user_id: invitee.id,
        inviter_user_id: admin.id,
      })
      .select('id')
      .single();

    const { error } = await outsider.client.rpc('accept_group_invitation', {
      p_invitation_id: inv!.id,
    });
    expect(error).not.toBeNull();
  });

  it('search_invitable_users is admin-only and excludes existing members', async () => {
    const asAdmin = await admin.client.rpc('search_invitable_users', {
      p_group_id: groupId,
      p_query: 'Test inv',
    });
    expect(asAdmin.error).toBeNull();
    const ids = (asAdmin.data ?? []).map((r: { id: string }) => r.id);
    expect(ids).not.toContain(member.id);
    expect(ids).not.toContain(admin.id);

    const asMember = await member.client.rpc('search_invitable_users', {
      p_group_id: groupId,
      p_query: 'Test',
    });
    expect(asMember.error).not.toBeNull();
  });
});
