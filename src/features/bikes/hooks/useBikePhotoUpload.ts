import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { BikeId } from '@/shared/types';
import { useAuth } from '@/features/auth';

const MAX_PHOTOS = 5;
const COMPRESS_QUALITY = 0.7;

interface UseBikePhotoUploadReturn {
  pickAndUpload: (bikeId: BikeId) => Promise<string | undefined>;
  isUploading: boolean;
  error: string | undefined;
}

export function useBikePhotoUpload(): UseBikePhotoUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pickAndUpload = useCallback(
    async (bikeId: BikeId): Promise<string | undefined> => {
      setError(undefined);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permission to access gallery was denied');
        return undefined;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled || result.assets.length === 0) {
        return undefined;
      }

      setIsUploading(true);
      try {
        const asset = result.assets[0];

        const compressed = await manipulateAsync(asset.uri, [{ resize: { width: 1200 } }], {
          compress: COMPRESS_QUALITY,
          format: SaveFormat.JPEG,
        });

        const fileName = `${Date.now()}.jpg`;
        const storagePath = `bikes/${user!.id}/${bikeId}/${fileName}`;

        const response = await fetch(compressed.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(storagePath, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: existingPhotos } = await supabase
          .from('bike_photos')
          .select('id')
          .eq('bike_id', bikeId);

        const sortOrder = (existingPhotos?.length ?? 0) + 1;

        if (sortOrder > MAX_PHOTOS) {
          setError(`Maximum ${MAX_PHOTOS} photos allowed`);
          return undefined;
        }

        const { error: dbError } = await supabase.from('bike_photos').insert({
          bike_id: bikeId,
          storage_path: storagePath,
          sort_order: sortOrder,
        });

        if (dbError) throw dbError;

        queryClient.invalidateQueries({ queryKey: ['bike_photos', bikeId] });
        queryClient.invalidateQueries({ queryKey: ['bikes'] });

        return storagePath;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        return undefined;
      } finally {
        setIsUploading(false);
      }
    },
    [user, queryClient],
  );

  return { pickAndUpload, isUploading, error };
}
