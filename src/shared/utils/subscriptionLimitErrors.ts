import type { PostgrestError } from '@supabase/supabase-js';

function textFields(error: PostgrestError): string[] {
  const parts: string[] = [];
  if (typeof error.message === 'string') {
    parts.push(error.message);
  }
  if (typeof error.details === 'string') {
    parts.push(error.details);
  }
  if (typeof error.hint === 'string') {
    parts.push(error.hint);
  }
  return parts;
}

function isCheckViolationWithMessage(error: unknown, substring: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const e = error as PostgrestError;
  if (e.code !== '23514') {
    return false;
  }
  return textFields(e).some((t) => t.includes(substring));
}

/** Message from Error, PostgREST-shaped object, or empty string. */
export function getUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string' && m.length > 0) {
      return m;
    }
  }
  return '';
}

/** Thrown client-side when a batch photo upload would exceed the account cap. */
export class PhotoLimitExceededError extends Error {
  constructor() {
    super('photo_limit_exceeded');
    this.name = 'PhotoLimitExceededError';
  }
}

export function isInventoryLimitExceededError(error: unknown): boolean {
  return isCheckViolationWithMessage(error, 'inventory_limit_exceeded');
}

export function isBikeLimitExceededError(error: unknown): boolean {
  return isCheckViolationWithMessage(error, 'bike_limit_exceeded');
}

export function isPhotoLimitExceededError(error: unknown): boolean {
  if (error instanceof PhotoLimitExceededError) {
    return true;
  }
  return isCheckViolationWithMessage(error, 'photo_limit_exceeded');
}
