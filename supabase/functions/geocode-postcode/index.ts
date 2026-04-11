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

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Require authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { postcode, country } = await req.json();

    if (!postcode || typeof postcode !== 'string' || postcode.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Postcode is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedPostcode = postcode.trim().toLowerCase();

    // Validate country as ISO 3166-1 alpha-2 (exactly two ASCII letters) or empty
    const rawCountry = typeof country === 'string' ? country.trim() : '';
    if (rawCountry !== '' && !/^[A-Za-z]{2}$/.test(rawCountry)) {
      return new Response(
        JSON.stringify({ error: 'Country must be an ISO 3166-1 alpha-2 code (e.g. "de", "gb")' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const normalizedCountry = rawCountry.toLowerCase();

    // Initialize Supabase client with service role for cache access
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first (composite PK: postcode + country)
    const { data: cached, error: cacheError } = await supabase
      .from('geocode_cache')
      .select('area_name, lat, lng')
      .eq('postcode', normalizedPostcode)
      .eq('country', normalizedCountry)
      .maybeSingle();

    if (cacheError) {
      console.error('geocode_cache read error:', cacheError.message);
      // Fall through to Nominatim lookup
    } else if (cached) {
      const result: GeocodeResult = {
        areaName: cached.area_name,
        lat: cached.lat,
        lng: cached.lng,
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Nominatim API
    const params = new URLSearchParams({
      postalcode: normalizedPostcode,
      format: 'json',
      addressdetails: '1',
      limit: '1',
    });

    if (normalizedCountry) {
      params.set('countrycodes', normalizedCountry);
    }

    const nominatimUrl = `${NOMINATIM_BASE_URL}?${params.toString()}`;
    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!nominatimResponse.ok) {
      return new Response(JSON.stringify({ error: 'Geocoding service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: NominatimResult[] = await nominatimResponse.json();

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: 'Postcode not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const topResult = results[0];
    const areaName = extractAreaName(topResult);
    const lat = Number.parseFloat(topResult.lat);
    const lng = Number.parseFloat(topResult.lon);

    // Cache the result (composite PK: postcode + country); don't fail the request on cache write errors
    const { error: upsertError } = await supabase.from('geocode_cache').upsert({
      postcode: normalizedPostcode,
      country: normalizedCountry,
      area_name: areaName,
      lat,
      lng,
      cached_at: new Date().toISOString(),
    });

    if (upsertError) {
      console.error('geocode_cache upsert error:', upsertError.message);
    }

    const result: GeocodeResult = { areaName, lat, lng };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
