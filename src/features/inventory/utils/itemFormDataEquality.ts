import { Visibility } from '@/shared/types';
import type { ItemFormData } from './validation';

function sortedStrings<T extends string>(ids: readonly T[] | undefined): T[] {
  return [...(ids ?? [])].sort((a, b) => a.localeCompare(b));
}

function sortedStringsEqual<T extends string>(
  a: readonly T[] | undefined,
  b: readonly T[] | undefined,
): boolean {
  const sa = sortedStrings(a);
  const sb = sortedStrings(b);
  if (sa.length !== sb.length) return false;
  for (let i = 0; i < sa.length; i += 1) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

function numClose(a: number | undefined, b: number | undefined, eps: number): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return Math.abs(a - b) < eps;
}

type Comparator = (a: ItemFormData, b: ItemFormData) => boolean;

const DIRECT_KEYS: readonly (keyof ItemFormData)[] = [
  'name',
  'quantity',
  'category',
  'condition',
  'price',
  'deposit',
  'usageKm',
  'pickupLocationId',
  'visibility',
];

const NULLABLE_STRING_KEYS: readonly (keyof ItemFormData)[] = [
  'subcategory',
  'brand',
  'model',
  'description',
  'borrowDuration',
  'storageLocation',
  'age',
  'purchaseDate',
  'mountedDate',
];

const COMPARATORS: readonly Comparator[] = [
  ...DIRECT_KEYS.map(
    (key): Comparator =>
      (a, b) =>
        a[key] === b[key],
  ),
  ...NULLABLE_STRING_KEYS.map(
    (key): Comparator =>
      (a, b) =>
        ((a[key] as string | undefined) ?? '') === ((b[key] as string | undefined) ?? ''),
  ),
  (a, b) => sortedStringsEqual(a.availabilityTypes, b.availabilityTypes),
  (a, b) => numClose(a.remainingFraction, b.remainingFraction, 1e-7),
  (a, b) => sortedStringsEqual(a.tags, b.tags),
];

function groupIdsEqual(baseline: ItemFormData, draft: ItemFormData): boolean {
  const involvesGroups =
    baseline.visibility === Visibility.Groups || draft.visibility === Visibility.Groups;
  if (!involvesGroups) return true;
  return sortedStringsEqual(baseline.groupIds, draft.groupIds);
}

/** True when `draft` matches `baseline` for persisted item fields (edit dirty detection). */
export function areItemFormDataEqual(baseline: ItemFormData, draft: ItemFormData): boolean {
  return COMPARATORS.every((compare) => compare(baseline, draft)) && groupIdsEqual(baseline, draft);
}
