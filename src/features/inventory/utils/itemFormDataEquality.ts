import { Visibility } from '@/shared/types';
import type { ItemFormData } from './validation';

function sortedStrings(ids: readonly string[] | undefined): string[] {
  return [...(ids ?? [])].map(String).sort();
}

function sortedStringsEqual(
  a: readonly string[] | undefined,
  b: readonly string[] | undefined,
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

/** True when `draft` matches `baseline` for persisted item fields (edit dirty detection). */
export function areItemFormDataEqual(baseline: ItemFormData, draft: ItemFormData): boolean {
  if (baseline.name !== draft.name) return false;
  if (baseline.quantity !== draft.quantity) return false;
  if (baseline.category !== draft.category) return false;
  if ((baseline.subcategory ?? '') !== (draft.subcategory ?? '')) return false;
  if (baseline.condition !== draft.condition) return false;
  if ((baseline.brand ?? '') !== (draft.brand ?? '')) return false;
  if ((baseline.model ?? '') !== (draft.model ?? '')) return false;
  if ((baseline.description ?? '') !== (draft.description ?? '')) return false;

  if (!sortedStringsEqual(baseline.availabilityTypes as string[], draft.availabilityTypes as string[])) {
    return false;
  }

  if (baseline.price !== draft.price) return false;
  if (baseline.deposit !== draft.deposit) return false;
  if ((baseline.borrowDuration ?? '') !== (draft.borrowDuration ?? '')) return false;
  if ((baseline.storageLocation ?? '') !== (draft.storageLocation ?? '')) return false;
  if ((baseline.age ?? '') !== (draft.age ?? '')) return false;
  if (baseline.usageKm !== draft.usageKm) return false;
  if (!numClose(baseline.remainingFraction, draft.remainingFraction, 1e-7)) return false;
  if ((baseline.purchaseDate ?? '') !== (draft.purchaseDate ?? '')) return false;
  if ((baseline.mountedDate ?? '') !== (draft.mountedDate ?? '')) return false;
  if (baseline.pickupLocationId !== draft.pickupLocationId) return false;
  if (baseline.visibility !== draft.visibility) return false;

  if (baseline.visibility === Visibility.Groups || draft.visibility === Visibility.Groups) {
    if (!sortedStringsEqual(baseline.groupIds as string[] | undefined, draft.groupIds as string[] | undefined)) {
      return false;
    }
  }

  if (!sortedStringsEqual(baseline.tags, draft.tags)) {
    return false;
  }

  return true;
}
