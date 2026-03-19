import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { Bike } from '@/shared/types';
import type { BikeId } from '@/shared/types';
import type { BikeFormData } from '../types';

export function useBikes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bikes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('owner_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Bike[];
    },
    enabled: !!user,
  });
}

export function useBike(id: BikeId) {
  return useQuery({
    queryKey: ['bikes', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('bikes').select('*').eq('id', id).single();

      if (error) throw error;
      return data as Bike;
    },
    enabled: !!id,
  });
}

export function useCreateBike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: BikeFormData) => {
      const { data, error } = await supabase
        .from('bikes')
        .insert({
          owner_id: user!.id,
          name: formData.name,
          brand: formData.brand,
          model: formData.model,
          type: formData.type,
          year: formData.year,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Bike;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
    },
  });
}

export function useUpdateBike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: BikeFormData & { id: BikeId }) => {
      const { data, error } = await supabase
        .from('bikes')
        .update({
          name: formData.name,
          brand: formData.brand,
          model: formData.model,
          type: formData.type,
          year: formData.year,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Bike;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      queryClient.invalidateQueries({ queryKey: ['bikes', variables.id] });
    },
  });
}

export function useDeleteBike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: BikeId) => {
      // bike_id FK on items has ON DELETE SET NULL, so parts are safely detached
      const { error } = await supabase.from('bikes').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
