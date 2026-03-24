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

    const normalizedPostcode = postcode.trim().toUpperCase();
    const normalizedCountry = (country ?? '').trim().toLowerCase();
    const cacheKey = normalizedCountry
      ? `${normalizedPostcode}:${normalizedCountry}`
      : normalizedPostcode;

    // Initialize Supabase client with service role for cache access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('geocode_cache')
      .select('area_name, lat, lng')
      .eq('postcode', cacheKey)
      .single();

    if (cached) {
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
    const lat = parseFloat(topResult.lat);
    const lng = parseFloat(topResult.lon);

    // Cache the result
    await supabase.from('geocode_cache').upsert({
      postcode: cacheKey,
      country: normalizedCountry,
      area_name: areaName,
      lat,
      lng,
      cached_at: new Date().toISOString(),
    });

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
