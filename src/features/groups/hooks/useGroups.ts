import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { GroupMember } from '@/shared/types';
import type { GroupId, GroupRow } from '@/shared/types';
import { GroupRole } from '@/shared/types';
import type { GroupFormData } from '../types';
import { mapGroupRow } from '../utils/mapGroupRow';

/**
 * Fetch all groups the current user is a member of.
 */
export function useGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at, groups(*)')
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...mapGroupRow((Array.isArray(row.groups) ? row.groups[0] : row.groups) as GroupRow),
        memberRole: row.role as string as GroupMember['role'],
        joinedAt: row.joined_at as string,
      }));
    },
    enabled: !!user,
  });
}

/**
 * Fetch a single group by ID.
 */
export function useGroup(id: GroupId | undefined) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').eq('id', id!).single();

      if (error) throw error;
      return mapGroupRow(data);
    },
    enabled: !!id,
  });
}

/**
 * Create a new group. The creator becomes the first admin.
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: GroupFormData) => {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description,
          is_public: formData.isPublic,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user!.id,
        role: GroupRole.Admin,
      });

      if (memberError) throw memberError;

      return mapGroupRow(group);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/**
 * Update an existing group (admin only).
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: GroupFormData & { id: GroupId }) => {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description,
          is_public: formData.isPublic,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapGroupRow(data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.id] });
    },
  });
}

/**
 * Delete a group (admin only).
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: GroupId) => {
      const { error } = await supabase.from('groups').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
