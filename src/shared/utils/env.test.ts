import type { AppEnv } from './env';

describe('env', () => {
  const original = process.env.EXPO_PUBLIC_ENV;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_ENV;
    } else {
      process.env.EXPO_PUBLIC_ENV = original;
    }
    jest.resetModules();
  });

  it.each<[AppEnv, boolean]>([
    ['development', true],
    ['test', true],
    ['preview', true],
    ['staging', true],
    ['production', false],
  ])('isPasswordDemoLoginEnabled when EXPO_PUBLIC_ENV=%s is %s', (env, expected) => {
    process.env.EXPO_PUBLIC_ENV = env;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isPasswordDemoLoginEnabled } = require('./env') as typeof import('./env');
      expect(isPasswordDemoLoginEnabled).toBe(expected);
    });
  });

  it('defaults missing EXPO_PUBLIC_ENV to development (demo login on)', () => {
    delete process.env.EXPO_PUBLIC_ENV;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { APP_ENV, isPasswordDemoLoginEnabled } = require('./env') as typeof import('./env');
      expect(APP_ENV).toBe('development');
      expect(isPasswordDemoLoginEnabled).toBe(true);
    });
  });
});
