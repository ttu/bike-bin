import { renderHook, act } from '@testing-library/react-native';
import { useLocalInventory } from '../useLocalInventory';
import { createMockItem } from '@/test/factories';

// In-memory mock for AsyncStorage
const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStore[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
}));

describe('useLocalInventory', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((key) => delete mockStore[key]);
    jest.clearAllMocks();
  });

  it('starts with empty items', async () => {
    const { result } = renderHook(() => useLocalInventory());

    await act(async () => {});

    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('adds an item to local storage', async () => {
    const item = createMockItem();
    const { result } = renderHook(() => useLocalInventory());

    await act(async () => {});

    await act(async () => {
      await result.current.addItem(item);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(item.id);
  });

  it('persists items across hook re-renders', async () => {
    const item = createMockItem();

    // First render: add item
    const { result: result1, unmount } = renderHook(() => useLocalInventory());
    await act(async () => {});
    await act(async () => {
      await result1.current.addItem(item);
    });
    unmount();

    // Second render: item should be loaded
    const { result: result2 } = renderHook(() => useLocalInventory());
    await act(async () => {});

    expect(result2.current.items).toHaveLength(1);
    expect(result2.current.items[0].id).toBe(item.id);
  });

  it('removes an item', async () => {
    const item1 = createMockItem();
    const item2 = createMockItem();
    const { result } = renderHook(() => useLocalInventory());

    await act(async () => {});
    await act(async () => {
      await result.current.addItem(item1);
    });
    await act(async () => {
      await result.current.addItem(item2);
    });

    await act(async () => {
      await result.current.removeItem(item1.id);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(item2.id);
  });

  it('updates an item', async () => {
    const item = createMockItem();
    const { result } = renderHook(() => useLocalInventory());

    await act(async () => {});
    await act(async () => {
      await result.current.addItem(item);
    });

    const updatedItem = { ...item, name: 'Updated Name' };
    await act(async () => {
      await result.current.updateItem(updatedItem);
    });

    expect(result.current.items[0].name).toBe('Updated Name');
  });

  it('clears all items', async () => {
    const item = createMockItem();
    const { result } = renderHook(() => useLocalInventory());

    await act(async () => {});
    await act(async () => {
      await result.current.addItem(item);
    });

    await act(async () => {
      await result.current.clearAll();
    });

    expect(result.current.items).toEqual([]);
  });
});
