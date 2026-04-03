import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { compressImageForMobileUpload } from '@/shared/utils/compressImageForMobileUpload';

export interface PickedImage {
  uri: string;
  fileName: string;
}

interface UseImagePickerReturn {
  pickImage: () => Promise<PickedImage | undefined>;
  isPicking: boolean;
}

export function useImagePicker(): UseImagePickerReturn {
  const [isPicking, setIsPicking] = useState(false);

  const pickImage = useCallback(async (): Promise<PickedImage | undefined> => {
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

  return { pickImage, isPicking };
}
