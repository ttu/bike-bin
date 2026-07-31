import { getDefaultCountry } from '../getDefaultCountry';

const mockGetLocales = jest.fn();

jest.mock('expo-localization', () => ({
  getLocales: () => mockGetLocales(),
}));

describe('getDefaultCountry', () => {
  beforeEach(() => {
    mockGetLocales.mockReset();
  });

  it('returns the lowercase region code from the first locale', () => {
    mockGetLocales.mockReturnValue([{ regionCode: 'GB' }]);
    expect(getDefaultCountry()).toBe('gb');
  });

  it('falls back to "fi" when getLocales returns an empty array', () => {
    mockGetLocales.mockReturnValue([]);
    expect(getDefaultCountry()).toBe('fi');
  });

  it('falls back to "fi" when regionCode is missing', () => {
    mockGetLocales.mockReturnValue([{ regionCode: null }]);
    expect(getDefaultCountry()).toBe('fi');
  });

  it('falls back to "fi" when regionCode is not a 2-letter code', () => {
    mockGetLocales.mockReturnValue([{ regionCode: 'XYZ' }]);
    expect(getDefaultCountry()).toBe('fi');
  });
});
