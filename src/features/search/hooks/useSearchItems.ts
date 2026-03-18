import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { ItemId, UserId, LocationId } from '@/shared/types';
import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { usePrimaryLocation } from '@/features/locations';
import type { SearchFilters, SearchResultItem } from '../types';

interface UseSearchItemsOptions {
  filters: SearchFilters;
  enabled?: boolean;
}

/**
 * TanStack Query hook that calls the `search_nearby_items` RPC
 * with the current search filters and the user's primary location.
 */
export function useSearchItems({ filters, enabled = true }: UseSearchItemsOptions) {
  const { data: primaryLocation } = usePrimaryLocation();

  const lat = primaryLocation?.coordinates?.latitude;
  const lng = primaryLocation?.coordinates?.longitude;

  return useQuery({
    queryKey: ['search', 'items', filters, lat, lng],
    queryFn: async (): Promise<SearchResultItem[]> => {
      const maxDistanceMeters = filters.maxDistanceKm * 1000;

      const { data, error } = await supabase.rpc('search_nearby_items', {
        query: filters.query || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        max_distance_meters: maxDistanceMeters,
        p_category: filters.categories.length === 1 ? filters.categories[0] : undefined,
        p_condition: filters.conditions.length === 1 ? filters.conditions[0] : undefined,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;

      const rows = (data ?? []) as RpcRow[];

      // Fetch owner profiles for unique owner IDs
      const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
      const ownerMap = await fetchOwnerProfiles(ownerIds);

      // Fetch area names for unique pickup location IDs
      const locationIds = [...new Set(rows.map((r) => r.pickup_location_id).filter(Boolean))];
      const locationMap = await fetchLocationAreaNames(locationIds as string[]);

      let results = rows.map((row) => mapRow(row, ownerMap, locationMap));

      // Client-side filters for multi-value category/condition and offer type
      if (filters.categories.length > 1) {
        results = results.filter((r) => filters.categories.includes(r.category));
      }
      if (filters.conditions.length > 1) {
        results = results.filter((r) => filters.conditions.includes(r.condition));
      }
      if (filters.offerTypes.length > 0) {
        results = results.filter((r) =>
          r.availabilityTypes.some((a) => filters.offerTypes.includes(a)),
        );
      }
      if (filters.priceMin !== undefined) {
        results = results.filter((r) => r.price !== undefined && r.price >= filters.priceMin!);
      }
      if (filters.priceMax !== undefined) {
        results = results.filter((r) => r.price !== undefined && r.price <= filters.priceMax!);
      }

      // Client-side sorting
      if (filters.sortBy === 'newest') {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (filters.sortBy === 'recently_available') {
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      // 'distance' is the default sort from the RPC

      return results;
    },
    enabled: enabled && filters.query.length > 0,
    staleTime: 60_000, // 1 minute
  });
}

// ── Helpers ──────────────────────────────────────────────────────────

interface RpcRow {
  id: string;
  owner_id: string;
  name: string;
  category: ItemCategory;
  brand: string | null;
  model: string | null;
  description: string | null;
  condition: ItemCondition;
  status: string;
  availability_types: AvailabilityType[];
  price: number | null;
  deposit: number | null;
  borrow_duration: string | null;
  visibility: string;
  pickup_location_id: string | null;
  created_at: string;
  updated_at: string;
  distance_meters: number | null;
}

interface OwnerProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
}

async function fetchOwnerProfiles(ownerIds: string[]): Promise<Map<string, OwnerProfile>> {
  const map = new Map<string, OwnerProfile>();
  if (ownerIds.length === 0) return map;

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, rating_avg, rating_count')
    .in('id', ownerIds);

  for (const row of data ?? []) {
    map.set(row.id, row as OwnerProfile);
  }
  return map;
}

async function fetchLocationAreaNames(locationIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (locationIds.length === 0) return map;

  const { data } = await supabase
    .from('saved_locations')
    .select('id, area_name')
    .in('id', locationIds);

  for (const row of data ?? []) {
    if (row.area_name) {
      map.set(row.id, row.area_name as string);
    }
  }
  return map;
}

function mapRow(
  row: RpcRow,
  ownerMap: Map<string, OwnerProfile>,
  locationMap: Map<string, string>,
): SearchResultItem {
  const owner = ownerMap.get(row.owner_id);
  return {
    id: row.id as ItemId,
    ownerId: row.owner_id as UserId,
    name: row.name,
    category: row.category,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    description: row.description ?? undefined,
    condition: row.condition,
    availabilityTypes: row.availability_types ?? [],
    price: row.price ?? undefined,
    deposit: row.deposit ?? undefined,
    borrowDuration: row.borrow_duration ?? undefined,
    visibility: row.visibility,
    pickupLocationId: (row.pickup_location_id as LocationId) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    distanceMeters: row.distance_meters ?? undefined,
    ownerDisplayName: owner?.display_name ?? undefined,
    ownerAvatarUrl: owner?.avatar_url ?? undefined,
    ownerRatingAvg: owner?.rating_avg ?? 0,
    ownerRatingCount: owner?.rating_count ?? 0,
    areaName: row.pickup_location_id ? locationMap.get(row.pickup_location_id) : undefined,
  };
}
