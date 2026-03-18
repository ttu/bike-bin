import { useCallback, useEffect, useState } from 'react';
import type { Item } from '@/shared/types/models';
import { getLocalItems, saveLocalItems, clearLocalItems } from '../utils/localStorage';

interface UseLocalInventoryReturn {
  items: Item[];
  addItem: (item: Item) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItem: (item: Item) => Promise<void>;
  clearAll: () => Promise<void>;
  isLoading: boolean;
}

export function useLocalInventory(): UseLocalInventoryReturn {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLocalItems().then((loaded) => {
      setItems(loaded);
      setIsLoading(false);
    });
  }, []);

  const addItem = useCallback(async (item: Item) => {
    setItems((prev) => {
      const next = [...prev, item];
      saveLocalItems(next);
      return next;
    });
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      saveLocalItems(next);
      return next;
    });
  }, []);

  const updateItem = useCallback(async (item: Item) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === item.id ? item : i));
      saveLocalItems(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setItems([]);
    await clearLocalItems();
  }, []);

  return { items, addItem, removeItem, updateItem, clearAll, isLoading };
}
