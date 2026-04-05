import {
  PhotoLimitExceededError,
  getUnknownErrorMessage,
  isBikeLimitExceededError,
  isInventoryLimitExceededError,
  isPhotoLimitExceededError,
} from '../subscriptionLimitErrors';

const pgErr = (message: string, code = '23514') => ({
  code,
  message,
  details: null,
  hint: null,
});

describe('subscriptionLimitErrors', () => {
  it('detects inventory limit', () => {
    expect(isInventoryLimitExceededError(pgErr('inventory_limit_exceeded'))).toBe(true);
    expect(isInventoryLimitExceededError(pgErr('other'))).toBe(false);
  });

  it('detects bike limit', () => {
    expect(isBikeLimitExceededError(pgErr('bike_limit_exceeded'))).toBe(true);
    expect(isBikeLimitExceededError(pgErr('inventory_limit_exceeded'))).toBe(false);
  });

  it('detects photo limit', () => {
    expect(isPhotoLimitExceededError(pgErr('photo_limit_exceeded'))).toBe(true);
    expect(isPhotoLimitExceededError(pgErr('inventory_limit_exceeded'))).toBe(false);
  });

  it('detects photo limit via PhotoLimitExceededError instance', () => {
    expect(isPhotoLimitExceededError(new PhotoLimitExceededError())).toBe(true);
    expect(isInventoryLimitExceededError(new PhotoLimitExceededError())).toBe(false);
  });

  it('detects photo limit when substring is in details', () => {
    expect(
      isPhotoLimitExceededError({
        code: '23514',
        message: 'check constraint',
        details: 'photo_limit_exceeded',
        hint: null,
      }),
    ).toBe(true);
  });

  it('getUnknownErrorMessage reads PostgREST-shaped objects', () => {
    expect(getUnknownErrorMessage(new Error('hello'))).toBe('hello');
    expect(getUnknownErrorMessage({ message: 'pg err' })).toBe('pg err');
    expect(getUnknownErrorMessage({ code: 'xx' })).toBe('');
  });
});
