import { geocodePostcode, GeocodeError } from '../geocoding';

// Mock supabase
const mockInvoke = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe('geocodePostcode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns area name and coordinates for a valid postcode', async () => {
    mockInvoke.mockResolvedValue({
      data: { areaName: 'Berlin Mitte', lat: 52.52, lng: 13.405 },
      error: null,
    });

    const result = await geocodePostcode('10115', 'de');

    expect(result).toEqual({
      areaName: 'Berlin Mitte',
      lat: 52.52,
      lng: 13.405,
    });
    expect(mockInvoke).toHaveBeenCalledWith('geocode-postcode', {
      body: { postcode: '10115', country: 'de' },
    });
  });

  it('calls Edge Function without country when not provided', async () => {
    mockInvoke.mockResolvedValue({
      data: { areaName: 'London', lat: 51.5, lng: -0.12 },
      error: null,
    });

    await geocodePostcode('SW1A 1AA');

    expect(mockInvoke).toHaveBeenCalledWith('geocode-postcode', {
      body: { postcode: 'SW1A 1AA', country: undefined },
    });
  });

  it('trims whitespace from postcode', async () => {
    mockInvoke.mockResolvedValue({
      data: { areaName: 'Test City', lat: 50, lng: 10 },
      error: null,
    });

    await geocodePostcode('  10115  ');

    expect(mockInvoke).toHaveBeenCalledWith('geocode-postcode', {
      body: { postcode: '10115', country: undefined },
    });
  });

  it('throws INVALID_INPUT for empty postcode', async () => {
    await expect(geocodePostcode('')).rejects.toThrow(GeocodeError);
    await expect(geocodePostcode('')).rejects.toThrow('Postcode is required');

    try {
      await geocodePostcode('   ');
    } catch (e) {
      expect(e).toBeInstanceOf(GeocodeError);
      expect((e as GeocodeError).code).toBe('INVALID_INPUT');
    }

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when Edge Function returns 404-like error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Postcode not found' },
    });

    try {
      await geocodePostcode('00000');
    } catch (e) {
      expect(e).toBeInstanceOf(GeocodeError);
      expect((e as GeocodeError).code).toBe('NOT_FOUND');
      expect((e as GeocodeError).message).toBe('Postcode not found');
    }
  });

  it('throws SERVICE_UNAVAILABLE for other Edge Function errors', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    });

    try {
      await geocodePostcode('10115');
    } catch (e) {
      expect(e).toBeInstanceOf(GeocodeError);
      expect((e as GeocodeError).code).toBe('SERVICE_UNAVAILABLE');
    }
  });

  it('throws SERVICE_UNAVAILABLE for invalid response data', async () => {
    mockInvoke.mockResolvedValue({
      data: { invalid: 'response' },
      error: null,
    });

    try {
      await geocodePostcode('10115');
    } catch (e) {
      expect(e).toBeInstanceOf(GeocodeError);
      expect((e as GeocodeError).code).toBe('SERVICE_UNAVAILABLE');
      expect((e as GeocodeError).message).toBe('Invalid response from geocoding service');
    }
  });
});
