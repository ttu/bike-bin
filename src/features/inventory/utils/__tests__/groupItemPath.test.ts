import { getItemPhotoPathPrefix } from '../groupItemPath';
import type { UserId, GroupId } from '@/shared/types';

describe('getItemPhotoPathPrefix', () => {
  it('returns group-prefixed path for group items', () => {
    expect(getItemPhotoPathPrefix({ ownerId: undefined, groupId: 'g1' as GroupId })).toBe(
      'group-g1',
    );
  });

  it('returns owner id for personal items', () => {
    expect(getItemPhotoPathPrefix({ ownerId: 'u1' as UserId, groupId: undefined })).toBe('u1');
  });

  it('throws when item has neither owner nor group', () => {
    expect(() => getItemPhotoPathPrefix({ ownerId: undefined, groupId: undefined })).toThrow(
      'Item has neither ownerId nor groupId',
    );
  });
});
