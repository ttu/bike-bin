/* eslint-disable @typescript-eslint/no-require-imports -- jest.isolateModules requires CommonJS require for fresh supabase module */
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: {} })),
}));

describe('supabase module storybookBundle flag', () => {
  const originalStorybookFlag = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED;

  afterEach(() => {
    process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = originalStorybookFlag;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('passes storybookBundle true to buildSupabaseAuthOptions when EXPO_PUBLIC_STORYBOOK_ENABLED is true', () => {
    process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = 'true';

    jest.isolateModules(() => {
      const auth = require('./supabaseAuthOptions') as typeof import('./supabaseAuthOptions');
      const spy = jest.spyOn(auth, 'buildSupabaseAuthOptions');
      require('./supabase');

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          storybookBundle: true,
        }),
      );
      spy.mockRestore();
    });
  });

  it('passes storybookBundle false when EXPO_PUBLIC_STORYBOOK_ENABLED is not true', () => {
    delete process.env.EXPO_PUBLIC_STORYBOOK_ENABLED;

    jest.isolateModules(() => {
      const auth = require('./supabaseAuthOptions') as typeof import('./supabaseAuthOptions');
      const spy = jest.spyOn(auth, 'buildSupabaseAuthOptions');
      require('./supabase');

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          storybookBundle: false,
        }),
      );
      spy.mockRestore();
    });
  });
});
