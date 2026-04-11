import { spacing } from '../spacing';
import {
  bottomTabBarOffset,
  fabListScrollPaddingBase,
  fabListScrollPaddingBottom,
  fabOffsetAboveTabBar,
} from '../fabLayout';

describe('fabLayout', () => {
  it('fabOffsetAboveTabBar combines spacing, inset, and tab bar offset', () => {
    expect(fabOffsetAboveTabBar(34)).toBe(spacing.base + 34 + bottomTabBarOffset);
  });

  it('fabListScrollPaddingBottom adds inset to base scroll padding', () => {
    expect(fabListScrollPaddingBottom(0)).toBe(fabListScrollPaddingBase);
    expect(fabListScrollPaddingBottom(20)).toBe(fabListScrollPaddingBase + 20);
  });
});
