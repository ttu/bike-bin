import { supabase } from '@/shared/api/supabase';

export interface GeocodeResult {
  areaName: string;
  lat: number;
  lng: number;
}

export class GeocodeError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'SERVICE_UNAVAILABLE' | 'INVALID_INPUT',
  ) {
    super(message);
    this.name = 'GeocodeError';
  }
}

/**
 * Geocode a postcode via the geocode-postcode Edge Function.
 * The Edge Function handles Nominatim API calls and caching.
 *
 * @param postcode - The postcode/ZIP to geocode
 * @param country - Optional ISO 3166-1 alpha-2 country code (e.g. 'de', 'gb')
 * @returns GeocodeResult with areaName, lat, lng
 * @throws GeocodeError if postcode is invalid, not found, or service is unavailable
 */
export async function geocodePostcode(postcode: string, country?: string): Promise<GeocodeResult> {
  const trimmed = postcode.trim();
  if (trimmed.length === 0) {
    throw new GeocodeError('Postcode is required', 'INVALID_INPUT');
  }

  const { data, error } = await supabase.functions.invoke('geocode-postcode', {
    body: { postcode: trimmed, country },
  });

  if (error) {
    // Supabase functions.invoke wraps HTTP errors
    const message = error.message ?? 'Geocoding failed';

    if (message.includes('not found') || message.includes('404')) {
      throw new GeocodeError('Postcode not found', 'NOT_FOUND');
    }

    throw new GeocodeError(message, 'SERVICE_UNAVAILABLE');
  }

  if (!data || typeof data.areaName !== 'string') {
    throw new GeocodeError('Invalid response from geocoding service', 'SERVICE_UNAVAILABLE');
  }

  return {
    areaName: data.areaName,
    lat: data.lat,
    lng: data.lng,
  };
}
