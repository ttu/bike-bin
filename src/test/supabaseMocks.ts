/**
 * Shared Supabase mock factories for test files.
 *
 * Usage (simple chain):
 *   const mocks = createSupabaseMocks();
 *   jest.mock('@/shared/api/supabase', () => ({ supabase: mocks.supabase }));
 *
 * Usage (counter-based):
 *   const mocks = createCounterBasedSupabaseMocks();
 *   mocks.setChains([chain1, chain2]);
 *   jest.mock('@/shared/api/supabase', () => ({ supabase: mocks.supabase }));
 *
 * Usage (storage):
 *   const storageMock = createSupabaseStorageMock();
 *   jest.mock('@/shared/api/supabase', () => ({ supabase: { storage: storageMock.storage } }));
 */

export interface SupabaseChainMocks {
  mockSelect: jest.Mock;
  mockInsert: jest.Mock;
  mockUpdate: jest.Mock;
  mockDelete: jest.Mock;
  mockEq: jest.Mock;
  mockNeq: jest.Mock;
  mockOrder: jest.Mock;
  mockSingle: jest.Mock;
  mockLimit: jest.Mock;
  mockLt: jest.Mock;
  mockIn: jest.Mock;
  mockRpc: jest.Mock;
  supabase: {
    from: jest.Mock;
    rpc: jest.Mock;
  };
}

/**
 * Creates a simple supabase mock with a single `from()` chain.
 * Individual mock fns are exposed so tests can set return values and assert calls.
 */
export function createSupabaseMocks(): SupabaseChainMocks {
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockNeq = jest.fn();
  const mockOrder = jest.fn();
  const mockSingle = jest.fn();
  const mockLimit = jest.fn();
  const mockLt = jest.fn();
  const mockIn = jest.fn();
  const mockRpc = jest.fn();

  const supabase = {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
    rpc: mockRpc,
  };

  return {
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockNeq,
    mockOrder,
    mockSingle,
    mockLimit,
    mockLt,
    mockIn,
    mockRpc,
    supabase,
  };
}

export interface CounterBasedSupabaseMocks {
  supabase: { from: jest.Mock };
  setChains: (chains: Record<string, unknown>[]) => void;
  resetCounter: () => void;
}

/**
 * Creates a counter-based supabase mock for hooks that call `from()` multiple
 * times in a single query function (e.g. useConversations, useBorrowRequests).
 * Call `setChains([chain1, chain2])` before each test to configure responses.
 */
export function createCounterBasedSupabaseMocks(): CounterBasedSupabaseMocks {
  let callCount = 0;
  let chains: Record<string, unknown>[] = [];

  const supabase = {
    from: jest.fn(() => {
      const chain = chains[callCount] ?? chains[chains.length - 1];
      callCount++;
      return chain;
    }),
  };

  return {
    supabase,
    setChains: (c: Record<string, unknown>[]) => {
      chains = c;
    },
    resetCounter: () => {
      callCount = 0;
    },
  };
}

/** Creates a supabase storage mock with `getPublicUrl`. */
export function createSupabaseStorageMock() {
  const mockGetPublicUrl = jest.fn((path: string) => ({
    data: { publicUrl: `https://test/${path}` },
  }));

  return {
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: mockGetPublicUrl,
      })),
    },
    mockGetPublicUrl,
  };
}
