import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { fetchPublicProfilesMap } from '@/shared/api/fetchPublicProfile';
import { fetchThumbnailPaths } from '@/shared/utils/fetchThumbnailPaths';
import type {
  AvailabilityType,
  GroupId,
  ItemCategory,
  ItemCondition,
  ItemId,
  LocationId,
  UserId,
} from '@/shared/types';
import { useAuth } from '@/features/auth';
import { usePrimaryLocation } from '@/features/locations';
import type { SearchFilters, SearchResultItem } from '../types';
import { SEARCH_ITEMS_QUERY_KEY } from '@/shared/api/queryKeys';

interface UseSearchItemsOptions {
  filters: SearchFilters;
  enabled?: boolean;
}

/**
 * TanStack Query hook that calls the `search_nearby_items` RPC
 * with the current search filters and the user's primary location.
 */
export function useSearchItems({ filters, enabled = true }: UseSearchItemsOptions) {
  const { isAuthenticated } = useAuth();
  const { data: primaryLocation } = usePrimaryLocation();

  const lat = primaryLocation?.coordinates?.latitude;
  const lng = primaryLocation?.coordinates?.longitude;

  return useQuery({
    queryKey: [...SEARCH_ITEMS_QUERY_KEY, filters, lat, lng],
    queryFn: async (): Promise<SearchResultItem[]> => {
      const maxDistanceMeters = filters.maxDistanceKm * 1000;

      const { data, error } = await supabase.rpc('search_nearby_items', {
        query: filters.query || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        max_distance_meters: maxDistanceMeters,
        p_categories: filters.categories.length > 0 ? filters.categories : undefined,
        p_conditions: filters.conditions.length > 0 ? filters.conditions : undefined,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;

      const rows = (data ?? []) as RpcRow[];

      const ownerIds = [...new Set(rows.map((r) => r.owner_id).filter((v): v is string => !!v))];
      const locationIds = [...new Set(rows.map((r) => r.pickup_location_id).filter(Boolean))];

      const [ownerMap, locationMap, thumbMap] = await Promise.all([
        fetchOwnerProfiles(ownerIds),
        fetchLocationAreaNames(locationIds as string[]),
        fetchThumbnailPaths(rows.map((r) => r.id as ItemId)),
      ]);

      const results = rows.map((row) => mapRow(row, ownerMap, locationMap, thumbMap));
      const filtered = applyClientFilters(results, filters);
      return sortResults(filtered, filters.sortBy);
    },
    enabled: enabled && isAuthenticated && filters.query.length > 0,
    staleTime: 60_000, // 1 minute
  });
}

// ── Client-side filtering & sorting ─────────────────────────────────

function applyClientFilters(
  results: SearchResultItem[],
  filters: SearchFilters,
): SearchResultItem[] {
  let filtered = results;

  if (filters.offerTypes.length > 0) {
    filtered = filtered.filter((r) =>
      r.availabilityTypes.some((a) => filters.offerTypes.includes(a)),
    );
  }
  if (filters.priceMin !== undefined) {
    filtered = filtered.filter((r) => r.price !== undefined && r.price >= filters.priceMin!);
  }
  if (filters.priceMax !== undefined) {
    filtered = filtered.filter((r) => r.price !== undefined && r.price <= filters.priceMax!);
  }

  return filtered;
}

function sortResults(
  results: SearchResultItem[],
  sortBy: SearchFilters['sortBy'],
): SearchResultItem[] {
  if (sortBy === 'newest') {
    return [...results].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  if (sortBy === 'recently_available') {
    return [...results].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }
  // 'distance' is the default sort from the RPC
  return results;
}

// ── Helpers ──────────────────────────────────────────────────────────

interface RpcRow {
  id: string;
  owner_id: string | null;
  group_id?: string | null;
  name: string;
  category: ItemCategory;
  brand: string | null;
  model: string | null;
  description: string | null;
  condition: ItemCondition;
  status: string;
  quantity?: number | null;
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

  const profiles = await fetchPublicProfilesMap(ownerIds);
  for (const id of ownerIds) {
    const p = profiles.get(id);
    if (p) {
      map.set(id, {
        id: p.id,
        display_name: p.displayName ?? null,
        avatar_url: p.avatarUrl ?? null,
        rating_avg: p.ratingAvg,
        rating_count: p.ratingCount,
      });
    }
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
  thumbMap: Map<string, string>,
): SearchResultItem {
  const owner = row.owner_id ? ownerMap.get(row.owner_id) : undefined;
  return {
    id: row.id as ItemId,
    ownerId: (row.owner_id as UserId | null) ?? undefined,
    name: row.name,
    category: row.category,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    description: row.description ?? undefined,
    condition: row.condition,
    quantity: typeof row.quantity === 'number' && row.quantity >= 1 ? row.quantity : 1,
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
    thumbnailStoragePath: thumbMap.get(row.id),
    groupId: (row.group_id as GroupId | null | undefined) ?? undefined,
    groupName: undefined,
    groupRatingAvg: 0,
    groupRatingCount: 0,
  };
}
