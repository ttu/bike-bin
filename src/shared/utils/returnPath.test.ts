import { decodeReturnPathParam, encodeReturnPath, isSafeTabReturnPath } from './returnPath';

describe('returnPath', () => {
  describe('encodeReturnPath / decodeReturnPathParam', () => {
    it('round-trips a tab path with slashes', () => {
      const path = '/(tabs)/messages/conv-1';
      const encoded = encodeReturnPath(path);
      expect(encoded).not.toContain('/(tabs)');
      expect(decodeReturnPathParam(encoded)).toBe(path);
    });

    it('decodes array param to first value', () => {
      const path = '/(tabs)/search/item-1';
      const encoded = encodeReturnPath(path);
      expect(decodeReturnPathParam([encoded])).toBe(path);
    });

    it('returns undefined for undefined input', () => {
      expect(decodeReturnPathParam(undefined)).toBeUndefined();
    });
  });

  describe('isSafeTabReturnPath', () => {
    it('accepts in-app tab routes', () => {
      expect(isSafeTabReturnPath('/(tabs)/messages/a')).toBe(true);
      expect(isSafeTabReturnPath('/(tabs)/search/x')).toBe(true);
      expect(isSafeTabReturnPath('/(tabs)/profile/u1')).toBe(true);
    });

    it('rejects external and traversal patterns', () => {
      expect(isSafeTabReturnPath('https://evil.test/x')).toBe(false);
      expect(isSafeTabReturnPath('/(tabs)/../inventory')).toBe(false);
      expect(isSafeTabReturnPath('/foo')).toBe(false);
    });
  });
});
