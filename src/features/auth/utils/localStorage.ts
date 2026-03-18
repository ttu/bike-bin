import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Item } from '@/shared/types/models';

const LOCAL_INVENTORY_KEY = '@bike-bin/local-inventory';

export async function getLocalItems(): Promise<Item[]> {
  const json = await AsyncStorage.getItem(LOCAL_INVENTORY_KEY);
  if (!json) return [];
  return JSON.parse(json) as Item[];
}

export async function saveLocalItems(items: Item[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(items));
}

export async function clearLocalItems(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_INVENTORY_KEY);
}
