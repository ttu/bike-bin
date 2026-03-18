import { ItemStatus } from '@/shared/types';
import { createMockItem } from '@/test/factories';
import { canDelete, canEditAvailability, getStatusColor } from '../status';

describe('canDelete', () => {
  it.each([
    [ItemStatus.Stored, true],
    [ItemStatus.Mounted, true],
    [ItemStatus.Donated, true],
    [ItemStatus.Sold, true],
    [ItemStatus.Archived, true],
  ])('returns true for %s status', (status, expected) => {
    const item = createMockItem({ status });
    expect(canDelete(item)).toBe(expected);
  });

  it.each([
    [ItemStatus.Loaned, false],
    [ItemStatus.Reserved, false],
  ])('returns false for %s status', (status, expected) => {
    const item = createMockItem({ status });
    expect(canDelete(item)).toBe(expected);
  });
});

describe('canEditAvailability', () => {
  it.each([
    [ItemStatus.Stored, true],
    [ItemStatus.Mounted, true],
    [ItemStatus.Donated, true],
    [ItemStatus.Sold, true],
    [ItemStatus.Archived, true],
  ])('returns true for %s status', (status, expected) => {
    const item = createMockItem({ status });
    expect(canEditAvailability(item)).toBe(expected);
  });

  it.each([
    [ItemStatus.Loaned, false],
    [ItemStatus.Reserved, false],
  ])('returns false for %s status', (status, expected) => {
    const item = createMockItem({ status });
    expect(canEditAvailability(item)).toBe(expected);
  });
});

describe('getStatusColor', () => {
  it('returns gray for Stored', () => {
    expect(getStatusColor(ItemStatus.Stored)).toBe('outline');
  });

  it('returns gray for Mounted', () => {
    expect(getStatusColor(ItemStatus.Mounted)).toBe('outline');
  });

  it('returns warning for Loaned', () => {
    expect(getStatusColor(ItemStatus.Loaned)).toBe('warning');
  });

  it('returns warning for Reserved', () => {
    expect(getStatusColor(ItemStatus.Reserved)).toBe('warning');
  });

  it('returns success for Donated', () => {
    expect(getStatusColor(ItemStatus.Donated)).toBe('success');
  });

  it('returns success for Sold', () => {
    expect(getStatusColor(ItemStatus.Sold)).toBe('success');
  });

  it('returns outline for Archived', () => {
    expect(getStatusColor(ItemStatus.Archived)).toBe('outline');
  });
});
