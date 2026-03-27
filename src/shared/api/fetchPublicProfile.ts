import { supabase } from './supabase';

/** Public profile fields returned by `get_public_profile` (no push_token). */
export interface FetchedPublicProfile {
  id: string;
  displayName: string | undefined;
  avatarUrl: string | undefined;
  ratingAvg: number;
  ratingCount: number;
}

function mapRpcRow(data: Record<string, unknown>): FetchedPublicProfile {
  return {
    id: data.id as string,
    displayName: (data.display_name as string) ?? undefined,
    avatarUrl: (data.avatar_url as string) ?? undefined,
    ratingAvg: Number(data.rating_avg ?? 0),
    ratingCount: Number(data.rating_count ?? 0),
  };
}

/**
 * Loads one user's public profile via `get_public_profile` (bypasses RLS safely).
 * Prefer this over selecting from `public_profiles` for other users — that view is
 * security-invoker and only returns the caller's own row under current RLS.
 */
export async function fetchPublicProfile(
  userId: string,
): Promise<FetchedPublicProfile | undefined> {
  const { data, error } = await supabase
    .rpc('get_public_profile', { p_user_id: userId })
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;
  return mapRpcRow(data as Record<string, unknown>);
}

/** Loads public profiles for many user ids in parallel. */
export async function fetchPublicProfilesMap(
  userIds: readonly string[],
): Promise<Map<string, FetchedPublicProfile>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const pairs = await Promise.all(
    unique.map(async (id) => {
      const profile = await fetchPublicProfile(id);
      return profile ? ([id, profile] as const) : undefined;
    }),
  );
  return new Map(
    pairs.filter((p): p is readonly [string, FetchedPublicProfile] => p !== undefined),
  );
}
