/**
 * Shared Supabase mock variables for test files.
 *
 * All exports are prefixed with `mock` so they can be referenced inside
 * jest.mock() factories (Jest only allows `mock`-prefixed variables there).
 *
 * Usage (simple chain):
 *   import { mockSelect, mockEq, mockSupabase } from '@/test/supabaseMocks';
 *   jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
 *
 * Usage (storage):
 *   import { mockSupabaseStorage } from '@/test/supabaseMocks';
 *   jest.mock('@/shared/api/supabase', () => ({ supabase: { storage: mockSupabaseStorage } }));
 *
 * IMPORTANT: Call jest.clearAllMocks() in beforeEach to reset all mocks between tests.
 */

// Query chain mocks
export const mockSelect = jest.fn();
export const mockInsert = jest.fn();
export const mockUpdate = jest.fn();
export const mockDelete = jest.fn();
export const mockEq = jest.fn();
export const mockNeq = jest.fn();
export const mockOrder = jest.fn();
export const mockSingle = jest.fn();
export const mockLimit = jest.fn();
export const mockLt = jest.fn();
export const mockIn = jest.fn();
export const mockRpc = jest.fn();

/** Simple supabase mock with `from()` returning all query chain methods. */
export const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })),
  rpc: mockRpc,
};

/** Supabase storage mock with `getPublicUrl`. */
export const mockGetPublicUrl = jest.fn((path: string) => ({
  data: { publicUrl: `https://test/${path}` },
}));

export const mockSupabaseStorage = {
  from: jest.fn(() => ({
    getPublicUrl: mockGetPublicUrl,
  })),
};
