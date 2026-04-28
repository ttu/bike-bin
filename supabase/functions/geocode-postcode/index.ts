// Geocode Postcode Edge Function
// Calls Nominatim API to geocode a postcode, caches results in geocode_cache table.
// Rate-limited to 1 req/sec per Nominatim usage policy.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'BikeBin/1.0 (bike-parts-exchange-app)';

interface GeocodeResult {
  areaName: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    municipality?: string;
    county?: string;
    state?: string;
    neighbourhood?: string;
  };
}

function extractAreaName(result: NominatimResult): string {
  const address = result.address;
  if (!address) {
    // Fall back to first part of display_name
    return result.display_name.split(',')[0].trim();
  }

  // Prefer city > town > village > suburb > municipality > county
  return (
    address.city ??
    address.town ??
    address.village ??
    address.suburb ??
    address.municipality ??
    address.county ??
    result.display_name.split(',')[0].trim()
  );
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function requireAuthenticatedUser(req: Request): Promise<Response | undefined> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse(401, { error: 'Unauthorized' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(500, { error: 'Server misconfigured' });
  }
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAnon.auth.getUser();
  if (authError || !user) return jsonResponse(401, { error: 'Unauthorized' });
  return undefined;
}

function parseAndValidate(raw: {
  postcode?: unknown;
  country?: unknown;
}): { normalizedPostcode: string; normalizedCountry: string } | Response {
  const { postcode, country } = raw;
  if (!postcode || typeof postcode !== 'string' || postcode.trim().length === 0) {
    return jsonResponse(400, { error: 'Postcode is required' });
  }
  const rawCountry = typeof country === 'string' ? country.trim() : '';
  if (rawCountry !== '' && !/^[A-Za-z]{2}$/.test(rawCountry)) {
    return jsonResponse(400, {
      error: 'Country must be an ISO 3166-1 alpha-2 code (e.g. "de", "gb")',
    });
  }
  return {
    normalizedPostcode: postcode.trim().toLowerCase(),
    normalizedCountry: rawCountry.toLowerCase(),
  };
}

async function lookupCache(
  supabase: ReturnType<typeof createClient>,
  postcode: string,
  country: string,
): Promise<GeocodeResult | undefined> {
  const { data: cached, error } = await supabase
    .from('geocode_cache')
    .select('area_name, lat, lng')
    .eq('postcode', postcode)
    .eq('country', country)
    .maybeSingle();
  if (error) {
    console.error('geocode_cache read error:', error.message);
    return undefined;
  }
  if (!cached) return undefined;
  return { areaName: cached.area_name, lat: cached.lat, lng: cached.lng };
}

async function fetchFromNominatim(
  postcode: string,
  country: string,
): Promise<GeocodeResult | Response> {
  const params = new URLSearchParams({
    postalcode: postcode,
    format: 'json',
    addressdetails: '1',
    limit: '1',
  });
  if (country) params.set('countrycodes', country);

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!response.ok) return jsonResponse(502, { error: 'Geocoding service unavailable' });

  const results: NominatimResult[] = await response.json();
  if (results.length === 0) return jsonResponse(404, { error: 'Postcode not found' });

  const top = results[0];
  return {
    areaName: extractAreaName(top),
    lat: Number.parseFloat(top.lat),
    lng: Number.parseFloat(top.lon),
  };
}

async function persistCacheEntry(
  supabase: ReturnType<typeof createClient>,
  postcode: string,
  country: string,
  result: GeocodeResult,
): Promise<void> {
  const { error } = await supabase.from('geocode_cache').upsert({
    postcode,
    country,
    area_name: result.areaName,
    lat: result.lat,
    lng: result.lng,
    cached_at: new Date().toISOString(),
  });
  if (error) console.error('geocode_cache upsert error:', error.message);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  try {
    const authError = await requireAuthenticatedUser(req);
    if (authError) return authError;

    const validated = parseAndValidate(await req.json());
    if (validated instanceof Response) return validated;
    const { normalizedPostcode, normalizedCountry } = validated;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(500, { error: 'Server misconfigured' });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cached = await lookupCache(supabase, normalizedPostcode, normalizedCountry);
    if (cached) return jsonResponse(200, cached);

    const result = await fetchFromNominatim(normalizedPostcode, normalizedCountry);
    if (result instanceof Response) return result;

    await persistCacheEntry(supabase, normalizedPostcode, normalizedCountry, result);
    return jsonResponse(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse(500, { error: message });
  }
});
