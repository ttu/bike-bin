import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { ItemId } from '@/shared/types';
import { useAuth } from '@/features/auth';

const MAX_PHOTOS = 5;
const COMPRESS_QUALITY = 0.7;

interface UsePhotoUploadReturn {
  pickAndUpload: (itemId: ItemId) => Promise<string | undefined>;
  isUploading: boolean;
  error: string | undefined;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pickAndUpload = useCallback(
    async (itemId: ItemId): Promise<string | undefined> => {
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

        // Compress image
        const compressed = await manipulateAsync(asset.uri, [{ resize: { width: 1200 } }], {
          compress: COMPRESS_QUALITY,
          format: SaveFormat.JPEG,
        });

        // Upload to Supabase Storage
        const fileName = `${Date.now()}.jpg`;
        const storagePath = `items/${user!.id}/${itemId}/${fileName}`;

        const response = await fetch(compressed.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(storagePath, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        // Get current photo count for sort order
        const { data: existingPhotos } = await supabase
          .from('item_photos')
          .select('id')
          .eq('item_id', itemId);

        const sortOrder = (existingPhotos?.length ?? 0) + 1;

        if (sortOrder > MAX_PHOTOS) {
          setError(`Maximum ${MAX_PHOTOS} photos allowed`);
          return undefined;
        }

        // Create item_photos row
        const { error: dbError } = await supabase.from('item_photos').insert({
          item_id: itemId,
          storage_path: storagePath,
          sort_order: sortOrder,
        });

        if (dbError) throw dbError;

        // Invalidate photos query
        queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });

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
