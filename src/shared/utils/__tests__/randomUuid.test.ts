import { randomUuidV4 } from '../randomUuid';

const v4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('randomUuidV4', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
      writable: true,
    });
  });

  it('returns a UUID v4-shaped string', () => {
    const id = randomUuidV4();
    expect(id).toMatch(v4Regex);
  });

  it('uses crypto.randomUUID when available', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      },
      configurable: true,
    });
    expect(randomUuidV4()).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
  });

  it('uses getRandomValues when randomUUID is missing', () => {
    const getRandomValues = jest.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = i % 256;
      }
    });
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues },
      configurable: true,
    });
    const id = randomUuidV4();
    expect(getRandomValues).toHaveBeenCalled();
    expect(id).toMatch(v4Regex);
  });

  it('falls back when crypto has neither randomUUID nor getRandomValues', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true,
    });
    expect(randomUuidV4()).toMatch(v4Regex);
  });
});
