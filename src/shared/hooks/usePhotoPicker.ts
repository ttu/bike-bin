import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { compressImageForMobileUpload } from '@/shared/utils/compressImageForMobileUpload';

interface PickedPhoto {
  uri: string;
  fileName: string;
}

interface UsePhotoPickerReturn {
  pickPhoto: () => Promise<PickedPhoto | undefined>;
  isPicking: boolean;
}

export function usePhotoPicker(): UsePhotoPickerReturn {
  const [isPicking, setIsPicking] = useState(false);

  const pickPhoto = useCallback(async (): Promise<PickedPhoto | undefined> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return undefined;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) return undefined;

    setIsPicking(true);
    try {
      const asset = result.assets[0];
      const compressed = await compressImageForMobileUpload(asset.uri);

      const fileName = `${Date.now()}.jpg`;
      return { uri: compressed.uri, fileName };
    } finally {
      setIsPicking(false);
    }
  }, []);

  return { pickPhoto, isPicking };
}
