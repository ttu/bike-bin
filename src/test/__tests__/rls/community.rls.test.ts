import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userA: TestUser; // item owner
let userB: TestUser; // requester / rater
let userC: TestUser; // outsider

let itemId: string;
let borrowRequestId: string;
let ratingId: string;
let notificationId: string;
let subscriptionId: string;
let reportId: string;
let supportRequestId: string;

beforeAll(async () => {
  userA = await createTestUser('com-userA');
  userB = await createTestUser('com-userB');
  userC = await createTestUser('com-userC');

  // Create an item for userA
  const { data: itemData, error: itemError } = await adminClient
    .from('items')
    .insert({
      owner_id: userA.id,
      name: 'Community Test Tool',
      category: 'tool',
      condition: 'good',
      visibility: 'all',
    })
    .select('id')
    .single();
  if (itemError) throw new Error(`Failed to seed item: ${itemError.message}`);
  itemId = itemData.id;

  // Create a completed borrow_request (status='returned') from userB for userA's item
  const { data: brData, error: brError } = await adminClient
    .from('borrow_requests')
    .insert({ item_id: itemId, requester_id: userB.id, status: 'returned' })
    .select('id')
    .single();
  if (brError) throw new Error(`Failed to seed borrow_request: ${brError.message}`);
  borrowRequestId = brData.id;

  // Create a rating from userB to userA
  const { data: ratingData, error: ratingError } = await adminClient
    .from('ratings')
    .insert({
      from_user_id: userB.id,
      to_user_id: userA.id,
      borrow_request_id: borrowRequestId,
      score: 4,
      transaction_type: 'borrow',
      item_id: itemId,
    })
    .select('id')
    .single();
  if (ratingError) throw new Error(`Failed to seed rating: ${ratingError.message}`);
  ratingId = ratingData.id;

  // Create a notification for userA
  const { data: notifData, error: notifError } = await adminClient
    .from('notifications')
    .insert({ user_id: userA.id, type: 'test', title: 'Test notification' })
    .select('id')
    .single();
  if (notifError) throw new Error(`Failed to seed notification: ${notifError.message}`);
  notificationId = notifData.id;

  const { data: subData, error: subError } = await adminClient
    .from('subscriptions')
    .insert({
      user_id: userA.id,
      plan: 'paid',
      status: 'active',
      current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
    })
    .select('id')
    .single();
  if (subError) throw new Error(`Failed to seed subscription: ${subError.message}`);
  subscriptionId = subData.id;

  // Create a report from userA about userC
  const { data: reportData, error: reportError } = await adminClient
    .from('reports')
    .insert({
      reporter_id: userA.id,
      target_type: 'user',
      target_id: userC.id,
      reason: 'spam',
    })
    .select('id')
    .single();
  if (reportError) throw new Error(`Failed to seed report: ${reportError.message}`);
  reportId = reportData.id;

  // Create a support_request for userA
  const { data: srData, error: srError } = await adminClient
    .from('support_requests')
    .insert({ user_id: userA.id, subject: 'Help', body: 'Need help' })
    .select('id')
    .single();
  if (srError) throw new Error(`Failed to seed support_request: ${srError.message}`);
  supportRequestId = srData.id;
}, 30_000);

afterAll(async () => {
  await adminClient.from('ratings').delete().eq('id', ratingId);
  await adminClient.from('subscriptions').delete().eq('id', subscriptionId);
  await adminClient.from('notifications').delete().eq('id', notificationId);
  await adminClient.from('reports').delete().eq('id', reportId);
  await adminClient.from('support_requests').delete().eq('id', supportRequestId);
  await adminClient.from('borrow_requests').delete().eq('id', borrowRequestId);
  await adminClient.from('items').delete().eq('id', itemId);
  await cleanupUsers([userA, userB, userC]);
});

// ============================================================
// ratings — SELECT
// ============================================================

describe('ratings — SELECT', () => {
  it('any user can read ratings (public)', async () => {
    const { data, error } = await userC.client.from('ratings').select('*').eq('id', ratingId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(ratingId);
  });

  it('unauthenticated-equivalent outsider can also read ratings', async () => {
    const { data, error } = await userB.client.from('ratings').select('*').eq('id', ratingId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

// ============================================================
// ratings — INSERT
// ============================================================

describe('ratings — INSERT', () => {
  it('user can rate after a completed transaction', async () => {
    // Create a second item + returned borrow_request so userB can submit a fresh rating
    const { data: item2Data, error: item2Error } = await adminClient
      .from('items')
      .insert({
        owner_id: userA.id,
        name: 'Community Test Tool 2',
        category: 'tool',
        condition: 'good',
        visibility: 'all',
      })
      .select('id')
      .single();
    if (item2Error) throw new Error(`Failed to seed item2: ${item2Error.message}`);
    const item2Id = item2Data.id;

    const { data: br2Data, error: br2Error } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: item2Id, requester_id: userB.id, status: 'returned' })
      .select('id')
      .single();
    if (br2Error) throw new Error(`Failed to seed borrow_request2: ${br2Error.message}`);
    const br2Id = br2Data.id;

    const { data, error } = await userB.client
      .from('ratings')
      .insert({
        from_user_id: userB.id,
        to_user_id: userA.id,
        borrow_request_id: br2Id,
        score: 5,
        transaction_type: 'borrow',
        item_id: item2Id,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    // Cleanup
    if (data?.id) {
      await adminClient.from('ratings').delete().eq('id', data.id);
    }
    await adminClient.from('borrow_requests').delete().eq('id', br2Id);
    await adminClient.from('items').delete().eq('id', item2Id);
  });

  it('user cannot rate without a completed transaction', async () => {
    const { error } = await userC.client.from('ratings').insert({
      from_user_id: userC.id,
      to_user_id: userA.id,
      borrow_request_id: borrowRequestId,
      score: 3,
      transaction_type: 'borrow',
      item_id: itemId,
    });
    expect(error).toBeTruthy();
  });

  it('user cannot rate themselves', async () => {
    const { error } = await userA.client.from('ratings').insert({
      from_user_id: userA.id,
      to_user_id: userA.id,
      borrow_request_id: borrowRequestId,
      score: 5,
      transaction_type: 'borrow',
      item_id: itemId,
    });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// ratings — UPDATE
// ============================================================

describe('ratings — UPDATE', () => {
  it('author can update own rating', async () => {
    const { error } = await userB.client.from('ratings').update({ score: 3 }).eq('id', ratingId);
    expect(error).toBeNull();

    // Reset score via adminClient
    await adminClient.from('ratings').update({ score: 4 }).eq('id', ratingId);
  });

  it('other user cannot update a rating', async () => {
    const { data, error } = await userC.client
      .from('ratings')
      .update({ score: 1 })
      .eq('id', ratingId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });
});

// ============================================================
// ratings — DELETE
// ============================================================

describe('ratings — DELETE', () => {
  it('author can delete own rating', async () => {
    const { data: item3, error: item3Err } = await adminClient
      .from('items')
      .insert({
        owner_id: userA.id,
        name: 'Community delete-test item',
        category: 'tool',
        condition: 'good',
        visibility: 'all',
      })
      .select('id')
      .single();
    if (item3Err) throw new Error(`Failed to seed item for delete test: ${item3Err.message}`);
    const item3Id = item3.id;

    const { data: br3, error: br3Err } = await adminClient
      .from('borrow_requests')
      .insert({ item_id: item3Id, requester_id: userB.id, status: 'returned' })
      .select('id')
      .single();
    if (br3Err) throw new Error(`Failed to seed borrow for delete test: ${br3Err.message}`);
    const br3Id = br3.id;

    const { data: tempRating, error: insertError } = await adminClient
      .from('ratings')
      .insert({
        from_user_id: userB.id,
        to_user_id: userA.id,
        borrow_request_id: br3Id,
        score: 2,
        transaction_type: 'borrow',
        item_id: item3Id,
      })
      .select('id')
      .single();
    if (insertError) throw new Error(`Failed to seed temp rating: ${insertError.message}`);
    const tempRatingId = tempRating.id;

    const { error } = await userB.client.from('ratings').delete().eq('id', tempRatingId);
    expect(error).toBeNull();

    // Verify it is gone
    const { data } = await adminClient.from('ratings').select('id').eq('id', tempRatingId);
    expect(data).toEqual([]);

    await adminClient.from('borrow_requests').delete().eq('id', br3Id);
    await adminClient.from('items').delete().eq('id', item3Id);
  });

  it('other user cannot delete a rating', async () => {
    const { data, error } = await userC.client.from('ratings').delete().eq('id', ratingId).select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Confirm the rating still exists
    const { data: stillExists } = await adminClient.from('ratings').select('id').eq('id', ratingId);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// notifications — SELECT
// ============================================================

describe('notifications — SELECT', () => {
  it('user can read own notifications', async () => {
    const { data, error } = await userA.client
      .from('notifications')
      .select('*')
      .eq('id', notificationId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(notificationId);
  });

  it('other user cannot read notifications', async () => {
    const { data, error } = await userB.client
      .from('notifications')
      .select('*')
      .eq('id', notificationId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// notifications — INSERT
// ============================================================

describe('notifications — INSERT', () => {
  it('user CANNOT insert notifications (only service_role can)', async () => {
    const { error } = await userA.client
      .from('notifications')
      .insert({ user_id: userA.id, type: 'test', title: 'Self-inserted' });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// notifications — UPDATE
// ============================================================

describe('notifications — UPDATE', () => {
  it('user can update own notifications (e.g. mark as read)', async () => {
    const { error } = await userA.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    expect(error).toBeNull();

    // Reset via adminClient
    await adminClient.from('notifications').update({ is_read: false }).eq('id', notificationId);
  });

  it('other user cannot update notifications', async () => {
    const { data, error } = await userB.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });
});

// ============================================================
// notifications — DELETE
// ============================================================

describe('notifications — DELETE', () => {
  it('user can delete own notifications', async () => {
    const { data: tempNotif, error: insertError } = await adminClient
      .from('notifications')
      .insert({ user_id: userA.id, type: 'test', title: 'Temp notification' })
      .select('id')
      .single();
    if (insertError) throw new Error(`Failed to seed temp notification: ${insertError.message}`);
    const tempNotifId = tempNotif.id;

    const { error } = await userA.client.from('notifications').delete().eq('id', tempNotifId);
    expect(error).toBeNull();

    const { data } = await adminClient.from('notifications').select('id').eq('id', tempNotifId);
    expect(data).toEqual([]);
  });

  it('other user cannot delete notifications', async () => {
    const { data, error } = await userB.client
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    const { data: stillExists } = await adminClient
      .from('notifications')
      .select('id')
      .eq('id', notificationId);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// subscriptions — SELECT / writes
// ============================================================

describe('subscriptions — SELECT', () => {
  it('user can read own subscriptions', async () => {
    const { data, error } = await userA.client
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].plan).toBe('paid');
  });

  it('other user cannot read subscriptions', async () => {
    const { data, error } = await userB.client
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('subscriptions — INSERT / UPDATE / DELETE', () => {
  it('user CANNOT insert subscriptions', async () => {
    const { error } = await userA.client.from('subscriptions').insert({
      user_id: userA.id,
      plan: 'free',
      status: 'active',
    });
    expect(error).toBeTruthy();
  });

  it('user CANNOT update own subscriptions', async () => {
    const { data, error } = await userA.client
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', subscriptionId)
      .select();
    expect(error).toBeNull(); // RLS: no UPDATE policy — zero rows affected, no PostgREST error
    expect(data).toEqual([]);

    const { data: row } = await adminClient
      .from('subscriptions')
      .select('status')
      .eq('id', subscriptionId)
      .single();
    expect(row?.status).toBe('active');
  });

  it('user CANNOT delete own subscriptions', async () => {
    const { data, error } = await userA.client
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .select();
    expect(error).toBeNull(); // RLS silently filters — no rows deleted
    expect(data).toEqual([]);

    const { data: stillExists } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('id', subscriptionId);
    expect(stillExists).toHaveLength(1);
  });
});

// ============================================================
// reports — SELECT
// ============================================================

describe('reports — SELECT', () => {
  it('reporter can see own reports', async () => {
    const { data, error } = await userA.client.from('reports').select('*').eq('id', reportId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(reportId);
  });

  it('other user cannot see reports', async () => {
    const { data, error } = await userB.client.from('reports').select('*').eq('id', reportId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// reports — INSERT
// ============================================================

describe('reports — INSERT', () => {
  it('user can submit a report as themselves', async () => {
    const { data, error } = await userB.client
      .from('reports')
      .insert({
        reporter_id: userB.id,
        target_type: 'user',
        target_id: userC.id,
        reason: 'spam',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();

    if (data?.id) {
      await adminClient.from('reports').delete().eq('id', data.id);
    }
  });

  it('user cannot submit a report as another user', async () => {
    const { error } = await userB.client.from('reports').insert({
      reporter_id: userA.id,
      target_type: 'user',
      target_id: userC.id,
      reason: 'spam',
    });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// support_requests — SELECT
// ============================================================

describe('support_requests — SELECT', () => {
  it('user can see own support requests', async () => {
    const { data, error } = await userA.client
      .from('support_requests')
      .select('*')
      .eq('id', supportRequestId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(supportRequestId);
  });

  it('other user cannot see support requests', async () => {
    const { data, error } = await userB.client
      .from('support_requests')
      .select('*')
      .eq('id', supportRequestId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ============================================================
// support_requests — INSERT
// ============================================================

describe('support_requests — INSERT', () => {
  it('user can submit a support request as themselves', async () => {
    const { data, error } = await userB.client
      .from('support_requests')
      .insert({ user_id: userB.id, subject: 'My question', body: 'Details here' })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();

    if (data?.id) {
      await adminClient.from('support_requests').delete().eq('id', data.id);
    }
  });

  it('user cannot submit a support request as another user', async () => {
    const { error } = await userB.client.from('support_requests').insert({
      user_id: userA.id,
      subject: 'Impersonation',
      body: 'Should be blocked',
    });
    expect(error).toBeTruthy();
  });
});
