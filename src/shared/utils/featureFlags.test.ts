describe('featureFlags', () => {
  const originalMarketplace = process.env.EXPO_PUBLIC_FEATURE_MARKETPLACE;
  const originalGroups = process.env.EXPO_PUBLIC_FEATURE_GROUPS;

  const restore = (key: string, original: string | undefined) => {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };

  afterEach(() => {
    restore('EXPO_PUBLIC_FEATURE_MARKETPLACE', originalMarketplace);
    restore('EXPO_PUBLIC_FEATURE_GROUPS', originalGroups);
    jest.resetModules();
  });

  it.each<[string | undefined, boolean]>([
    ['true', true],
    ['false', false],
    ['1', false],
    ['', false],
    [undefined, false],
  ])('isMarketplaceEnabled when EXPO_PUBLIC_FEATURE_MARKETPLACE=%s is %s', (value, expected) => {
    restore('EXPO_PUBLIC_FEATURE_MARKETPLACE', value);
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isMarketplaceEnabled } = require('./featureFlags') as typeof import('./featureFlags');
      expect(isMarketplaceEnabled).toBe(expected);
    });
  });

  it.each<[string | undefined, boolean]>([
    ['true', true],
    ['false', false],
    ['1', false],
    ['', false],
    [undefined, false],
  ])('isGroupsEnabled when EXPO_PUBLIC_FEATURE_GROUPS=%s is %s', (value, expected) => {
    restore('EXPO_PUBLIC_FEATURE_GROUPS', value);
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isGroupsEnabled } = require('./featureFlags') as typeof import('./featureFlags');
      expect(isGroupsEnabled).toBe(expected);
    });
  });

  it('flags are independent', () => {
    process.env.EXPO_PUBLIC_FEATURE_MARKETPLACE = 'true';
    delete process.env.EXPO_PUBLIC_FEATURE_GROUPS;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const flags = require('./featureFlags') as typeof import('./featureFlags');
      expect(flags.isMarketplaceEnabled).toBe(true);
      expect(flags.isGroupsEnabled).toBe(false);
    });
  });
});
