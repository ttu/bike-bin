import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { GroupId } from '@/shared/types';
import type { SearchGroupResult } from '../types';

/**
 * Search for public groups by name.
 */
export function useSearchGroups(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['search-groups', query],
    queryFn: async () => {
      // Search public groups matching the query
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (groupsError) throw groupsError;

      if (!groups || groups.length === 0) return [] as SearchGroupResult[];

      const groupIds = groups.map((g) => g.id);

      // Get member counts for these groups
      const { data: memberCounts, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (countError) throw countError;

      // Count members per group
      const countMap = new Map<string, number>();
      for (const row of memberCounts ?? []) {
        const gid = row.group_id as string;
        countMap.set(gid, (countMap.get(gid) ?? 0) + 1);
      }

      // Check which groups the current user is a member of
      const memberGroupIds = new Set<string>();
      if (user) {
        const { data: myMemberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .in('group_id', groupIds);

        for (const row of myMemberships ?? []) {
          memberGroupIds.add(row.group_id as string);
        }
      }

      return groups.map((g) => ({
        id: g.id as string as GroupId,
        name: g.name as string,
        description: g.description as string | undefined,
        isPublic: g.is_public as boolean,
        createdAt: g.created_at as string,
        memberCount: countMap.get(g.id as string) ?? 0,
        isMember: memberGroupIds.has(g.id as string),
      })) as SearchGroupResult[];
    },
    enabled: query.length >= 2,
  });
}
