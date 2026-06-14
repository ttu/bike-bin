import { createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let user: TestUser;

beforeAll(async () => {
  user = await createTestUser('mount-loc');
});

afterAll(async () => {
  await cleanupUsers([user]);
});

async function seedBike(name: string): Promise<string> {
  const { data, error } = await user.client
    .from('bikes')
    .insert({ owner_id: user.id, name })
    .select('id')
    .single();
  if (error) throw new Error(`seed bike: ${error.message}`);
  return data.id as string;
}

async function seedStoredItem(name: string): Promise<string> {
  const { data, error } = await user.client
    .from('items')
    .insert({
      owner_id: user.id,
      name,
      category: 'component',
      condition: 'good',
      visibility: 'private',
      status: 'stored',
      storage_location: 'Garage shelf',
    })
    .select('id')
    .single();
  if (error) throw new Error(`seed item: ${error.message}`);
  return data.id as string;
}

async function readItem(itemId: string) {
  const { data, error } = await user.client
    .from('items')
    .select('status, bike_id, storage_location')
    .eq('id', itemId)
    .single();
  if (error) throw new Error(`read item: ${error.message}`);
  return data;
}

describe('mounted part location trigger', () => {
  it('sets storage_location to the bike name when a part is mounted', async () => {
    const bikeId = await seedBike('Trek Domane');
    const itemId = await seedStoredItem('Shimano cassette');

    const { error } = await user.client
      .from('items')
      .update({ bike_id: bikeId, status: 'mounted' })
      .eq('id', itemId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.storage_location).toBe('Trek Domane');
  });

  it('clears storage_location and sets status stored when detached', async () => {
    const bikeId = await seedBike('Canyon Ultimate');
    const itemId = await seedStoredItem('Brake caliper');
    await user.client.from('items').update({ bike_id: bikeId, status: 'mounted' }).eq('id', itemId);

    const { error } = await user.client
      .from('items')
      .update({ bike_id: null, status: 'stored' })
      .eq('id', itemId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.storage_location).toBeNull();
    expect(item.status).toBe('stored');
  });

  it('syncs mounted parts when the bike is renamed', async () => {
    const bikeId = await seedBike('Old Name');
    const itemId = await seedStoredItem('Crankset');
    await user.client.from('items').update({ bike_id: bikeId, status: 'mounted' }).eq('id', itemId);

    const { error } = await user.client.from('bikes').update({ name: 'New Name' }).eq('id', bikeId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.storage_location).toBe('New Name');
  });

  it('rejects marking an item mounted without a bike', async () => {
    const itemId = await seedStoredItem('Loose chain');

    const { error } = await user.client
      .from('items')
      .update({ status: 'mounted' })
      .eq('id', itemId);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
    expect(error?.message).toContain('items_mounted_requires_bike_id');
  });

  it('clears location and resets status to stored when the bike is deleted', async () => {
    const bikeId = await seedBike('Doomed Bike');
    const itemId = await seedStoredItem('Saddle');
    await user.client.from('items').update({ bike_id: bikeId, status: 'mounted' }).eq('id', itemId);

    const { error } = await user.client.from('bikes').delete().eq('id', bikeId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.bike_id).toBeNull();
    expect(item.storage_location).toBeNull();
    expect(item.status).toBe('stored');
  });
});
