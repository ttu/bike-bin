import { requireRemotePlaywrightBaseUrl } from '../playwrightRemoteBaseUrl';

describe('requireRemotePlaywrightBaseUrl', () => {
  const previous = process.env.PLAYWRIGHT_BASE_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.PLAYWRIGHT_BASE_URL;
    } else {
      process.env.PLAYWRIGHT_BASE_URL = previous;
    }
  });

  it('throws when PLAYWRIGHT_BASE_URL is unset', () => {
    delete process.env.PLAYWRIGHT_BASE_URL;
    expect(() => requireRemotePlaywrightBaseUrl()).toThrow(/PLAYWRIGHT_BASE_URL/);
  });

  it('throws when PLAYWRIGHT_BASE_URL is blank', () => {
    process.env.PLAYWRIGHT_BASE_URL = '   ';
    expect(() => requireRemotePlaywrightBaseUrl()).toThrow(/PLAYWRIGHT_BASE_URL/);
  });

  it('returns trimmed URL', () => {
    process.env.PLAYWRIGHT_BASE_URL = '  https://staging.example.test/app  ';
    expect(requireRemotePlaywrightBaseUrl()).toBe('https://staging.example.test/app');
  });
});
