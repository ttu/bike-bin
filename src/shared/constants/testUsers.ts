export const TEST_USER_PASSWORD = 'testpass123';

export const TEST_USERS = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    email: 'test@bikebin.dev',
    displayName: 'Test User',
    persona: 'MTB rider',
    isMain: true,
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    email: 'marcus@bikebin.dev',
    displayName: 'Marcus B.',
    persona: 'Road cyclist',
    isMain: false,
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    email: 'sarah@bikebin.dev',
    displayName: 'Sarah K.',
    persona: 'Commuter',
    isMain: false,
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    email: 'jonas@bikebin.dev',
    displayName: 'Jonas W.',
    persona: 'Touring cyclist',
    isMain: false,
  },
  {
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    email: 'lisa@bikebin.dev',
    displayName: 'Lisa M.',
    persona: 'Gravel racer',
    isMain: false,
  },
  {
    id: 'a1b2c3d4-0006-4000-8000-000000000006',
    email: 'kai@bikebin.dev',
    displayName: 'Kai R.',
    persona: 'MTB enduro',
    isMain: false,
  },
  {
    id: 'a1b2c3d4-0007-4000-8000-000000000007',
    email: 'nina@bikebin.dev',
    displayName: 'Nina T.',
    persona: 'MTB trail/XC',
    isMain: false,
  },
] as const;

export const MAIN_TEST_USER = TEST_USERS[0];
