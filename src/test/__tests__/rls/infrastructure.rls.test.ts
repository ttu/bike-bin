import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

describe('RLS: geocode_cache', () => {
  let testUser: TestUser;

  beforeAll(async () => {
    testUser = await createTestUser();

    await adminClient.from('geocode_cache').insert({
      postcode: 'TEST-00100',
      country: 'FI',
      area_name: 'Helsinki',
      lat: 60.17,
      lng: 24.94,
    });
  }, 30_000);

  afterAll(async () => {
    // Trigger normalizes postcode to lowercase (see normalize_geocode_cache_key)
    await adminClient.from('geocode_cache').delete().eq('postcode', 'test-00100');
    await cleanupUsers([testUser]);
  });

  describe('geocode_cache — SELECT', () => {
    it('authenticated user cannot read geocode_cache', async () => {
      const { data, error } = await testUser.client.from('geocode_cache').select('*');
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe('geocode_cache — INSERT', () => {
    it('authenticated user cannot insert into geocode_cache', async () => {
      const { error } = await testUser.client.from('geocode_cache').insert({
        postcode: 'BLOCKED-99999',
        country: 'XX',
        area_name: 'Blocked',
        lat: 0,
        lng: 0,
      });
      expect(error).toBeTruthy();
    });
  });

  describe('geocode_cache — UPDATE', () => {
    it('authenticated user cannot update geocode_cache', async () => {
      const { data, error } = await testUser.client
        .from('geocode_cache')
        .update({ area_name: 'Hacked' })
        .eq('postcode', 'TEST-00100')
        .select();
      expect(error).toBeNull(); // RLS silently filters (0 rows matched)
      expect(data).toEqual([]);

      // Verify no mutation occurred
      const { data: original } = await adminClient
        .from('geocode_cache')
        .select('area_name')
        .eq('postcode', 'test-00100')
        .single();
      expect(original?.area_name).toBe('Helsinki');
    });
  });

  describe('geocode_cache — DELETE', () => {
    it('authenticated user cannot delete geocode_cache', async () => {
      const { data, error } = await testUser.client
        .from('geocode_cache')
        .delete()
        .eq('postcode', 'TEST-00100')
        .select();
      expect(error).toBeNull(); // RLS silently filters (0 rows matched)
      expect(data).toEqual([]);

      // Verify row still exists
      const { data: stillExists } = await adminClient
        .from('geocode_cache')
        .select('*')
        .eq('postcode', 'test-00100');
      expect(stillExists).toHaveLength(1);
    });
  });

  describe('geocode_cache — service_role verification', () => {
    it('adminClient (service_role) CAN read geocode_cache', async () => {
      const { data, error } = await adminClient
        .from('geocode_cache')
        .select('*')
        .eq('postcode', 'test-00100');
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].postcode).toBe('test-00100');
    });
  });
});
