import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { BikeId } from '@/shared/types';
import { fetchBikeThumbnailPaths } from '@/shared/utils/fetchBikeThumbnailPaths';
import type { BikeFormData } from '../types';
import { mapBikeRow } from '../utils/mapBikeRow';
import { mapBikePhotoRow } from '../utils/mapBikePhotoRow';

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
      const bikes = (data ?? []).map((row) => mapBikeRow(row as Record<string, unknown>));
      const thumbMap = await fetchBikeThumbnailPaths(bikes.map((b) => b.id));
      return bikes.map((bike) => ({
        ...bike,
        thumbnailStoragePath: thumbMap.get(bike.id),
      }));
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
      return mapBikeRow(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}

export function useBikePhotos(bikeId: BikeId) {
  return useQuery({
    queryKey: ['bike_photos', bikeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bike_photos')
        .select('*')
        .eq('bike_id', bikeId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => mapBikePhotoRow(row as Record<string, unknown>));
    },
    enabled: !!bikeId,
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
      return mapBikeRow(data as Record<string, unknown>);
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
      return mapBikeRow(data as Record<string, unknown>);
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
