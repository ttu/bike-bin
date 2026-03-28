import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let userA: TestUser;
let userB: TestUser;

// Seeded data IDs for cleanup
let bikeAId: string;
let locationAId: string;
let bikeBForPhotosId: string;
let photoAId: string;

beforeAll(async () => {
  userA = await createTestUser('own-a');
  userB = await createTestUser('own-b');

  // Seed a bike for userA
  const { data: bikeData, error: bikeError } = await adminClient
    .from('bikes')
    .insert({ owner_id: userA.id, name: 'UserA Bike', type: 'road' })
    .select('id')
    .single();
  if (bikeError) throw new Error(`Failed to seed bike: ${bikeError.message}`);
  bikeAId = bikeData.id;

  // Seed a saved_location for userA
  const { data: locData, error: locError } = await adminClient
    .from('saved_locations')
    .insert({ user_id: userA.id, label: 'UserA Home' })
    .select('id')
    .single();
  if (locError) throw new Error(`Failed to seed saved_location: ${locError.message}`);
  locationAId = locData.id;

  // Seed a bike + photo for userA (for bike_photos tests)
  const { data: photoBikeData, error: photoBikeError } = await adminClient
    .from('bikes')
    .insert({ owner_id: userA.id, name: 'UserA Photo Bike', type: 'mtb' })
    .select('id')
    .single();
  if (photoBikeError) throw new Error(`Failed to seed photo bike: ${photoBikeError.message}`);
  bikeBForPhotosId = photoBikeData.id;

  const { data: photoData, error: photoError } = await adminClient
    .from('bike_photos')
    .insert({ bike_id: bikeBForPhotosId, storage_path: 'test/photo.jpg', sort_order: 0 })
    .select('id')
    .single();
  if (photoError) throw new Error(`Failed to seed bike_photo: ${photoError.message}`);
  photoAId = photoData.id;
}, 30_000);

afterAll(async () => {
  // Clean up seeded data (cascade deletes handle child rows, but be explicit)
  await adminClient.from('bike_photos').delete().eq('id', photoAId);
  await adminClient.from('bikes').delete().eq('id', bikeBForPhotosId);
  await adminClient.from('saved_locations').delete().eq('id', locationAId);
  await adminClient.from('bikes').delete().eq('id', bikeAId);
  await cleanupUsers([userA, userB]);
});

// ============================================================
// profiles
// ============================================================

describe('profiles — SELECT', () => {
  it('user can read own profile', async () => {
    const { data, error } = await userA.client
      .from('profiles')
      .select('*')
      .eq('id', userA.id)
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.id).toBe(userA.id);
  });

  it('user cannot read another profile directly (RLS filters to own rows)', async () => {
    const { data, error } = await userA.client.from('profiles').select('*').eq('id', userB.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('public_profiles view also restricts to own profile (security_invoker inherits RLS)', async () => {
    const { data, error } = await userA.client
      .from('public_profiles')
      .select('*')
      .eq('id', userB.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('public_profiles view excludes push_token column', async () => {
    const { data, error } = await userA.client
      .from('public_profiles')
      .select('*')
      .eq('id', userA.id)
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data).not.toHaveProperty('push_token');
  });
});

describe('profiles — UPDATE', () => {
  it('user can update own profile', async () => {
    const { error } = await userA.client
      .from('profiles')
      .update({ display_name: 'Updated A' })
      .eq('id', userA.id);
    expect(error).toBeNull();
  });

  it('user cannot update another profile', async () => {
    const { error } = await userA.client
      .from('profiles')
      .update({ display_name: 'Hacked B' })
      .eq('id', userB.id);
    // RLS blocks write — either error or 0 rows affected; check by verifying no change
    // PostgREST may return no error but 0 rows matched; verify via admin read
    if (!error) {
      const { data } = await adminClient
        .from('profiles')
        .select('display_name')
        .eq('id', userB.id)
        .single();
      expect(data?.display_name).not.toBe('Hacked B');
    } else {
      expect(error).toBeTruthy();
    }
  });
});

describe('profiles — INSERT', () => {
  it("user cannot insert a profile with another user's id", async () => {
    const { error } = await userA.client
      .from('profiles')
      .insert({ id: userB.id, display_name: 'Fake B' });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// bikes
// ============================================================

describe('bikes — SELECT', () => {
  it('owner can read own bikes', async () => {
    const { data, error } = await userA.client.from('bikes').select('*').eq('id', bikeAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(bikeAId);
  });

  it('other user cannot read bikes they do not own', async () => {
    const { data, error } = await userB.client.from('bikes').select('*').eq('id', bikeAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('bikes — INSERT', () => {
  it('user can insert a bike as themselves', async () => {
    const { data, error } = await userA.client
      .from('bikes')
      .insert({ owner_id: userA.id, name: 'My New Bike', type: 'gravel' })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    // Cleanup
    if (data?.id) {
      await adminClient.from('bikes').delete().eq('id', data.id);
    }
  });

  it('user cannot insert a bike as another user', async () => {
    const { error } = await userB.client
      .from('bikes')
      .insert({ owner_id: userA.id, name: 'Stolen Bike', type: 'city' });
    expect(error).toBeTruthy();
  });
});

describe('bikes — UPDATE', () => {
  it('owner can update own bike', async () => {
    const { error } = await userA.client
      .from('bikes')
      .update({ name: 'Renamed Bike' })
      .eq('id', bikeAId);
    expect(error).toBeNull();
  });

  it('other user cannot update bike', async () => {
    const { data, error } = await userB.client
      .from('bikes')
      .update({ name: 'Hijacked Bike' })
      .eq('id', bikeAId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });
});

describe('bikes — DELETE', () => {
  it('other user cannot delete a bike', async () => {
    const { data, error } = await userB.client.from('bikes').delete().eq('id', bikeAId).select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify bike still exists
    const { data: stillExists } = await adminClient
      .from('bikes')
      .select('id')
      .eq('id', bikeAId)
      .single();
    expect(stillExists?.id).toBe(bikeAId);
  });
});

// ============================================================
// saved_locations
// ============================================================

describe('saved_locations — SELECT', () => {
  it('owner can read own locations', async () => {
    const { data, error } = await userA.client
      .from('saved_locations')
      .select('*')
      .eq('id', locationAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(locationAId);
  });

  it('other user cannot read locations they do not own', async () => {
    const { data, error } = await userB.client
      .from('saved_locations')
      .select('*')
      .eq('id', locationAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('saved_locations — INSERT', () => {
  it('user cannot insert a location for another user', async () => {
    const { error } = await userB.client
      .from('saved_locations')
      .insert({ user_id: userA.id, label: 'Fake Location' });
    expect(error).toBeTruthy();
  });
});

describe('saved_locations — UPDATE', () => {
  it('other user cannot update a location', async () => {
    const { data, error } = await userB.client
      .from('saved_locations')
      .update({ label: 'Hijacked Label' })
      .eq('id', locationAId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);
  });
});

describe('saved_locations — DELETE', () => {
  it('other user cannot delete a location', async () => {
    const { data, error } = await userB.client
      .from('saved_locations')
      .delete()
      .eq('id', locationAId)
      .select();
    expect(error).toBeNull(); // RLS silently filters
    expect(data).toEqual([]);

    // Verify location still exists
    const { data: stillExists } = await adminClient
      .from('saved_locations')
      .select('id')
      .eq('id', locationAId)
      .single();
    expect(stillExists?.id).toBe(locationAId);
  });
});

// ============================================================
// bike_photos
// ============================================================

describe('bike_photos — SELECT', () => {
  it('owner can read own bike photos', async () => {
    const { data, error } = await userA.client.from('bike_photos').select('*').eq('id', photoAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(photoAId);
  });

  it('other user cannot read bike photos they do not own', async () => {
    const { data, error } = await userB.client.from('bike_photos').select('*').eq('id', photoAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('bike_photos — INSERT', () => {
  it('other user cannot insert photos for bikes they do not own', async () => {
    const { error } = await userB.client
      .from('bike_photos')
      .insert({ bike_id: bikeBForPhotosId, storage_path: 'test/evil.jpg', sort_order: 1 });
    expect(error).toBeTruthy();
  });
});
