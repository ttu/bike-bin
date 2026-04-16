import { spacing } from './spacing';

/**
 * Vertical offset for the default bottom tab bar (icons + labels). Used when positioning
 * FABs so they sit above the bar, not behind it.
 */
export const bottomTabBarOffset = 60;

/**
 * Base bottom padding for scroll content when a FAB floats above the tab bar (clears FAB +
 * margin). Add `insets.bottom` on screens that need home-indicator safe area.
 */
export const fabListScrollPaddingBase = 100;

/** Absolute `bottom` style for a FAB above the bottom tab bar and home indicator. */
export function fabOffsetAboveTabBar(insetsBottom: number): number {
  return spacing.base + insetsBottom + bottomTabBarOffset;
}

/** `paddingBottom` for scroll views / FlatLists whose last rows should clear the FAB. */
export function fabListScrollPaddingBottom(insetsBottom: number): number {
  return fabListScrollPaddingBase + insetsBottom;
}

/**
 * `paddingBottom` for scroll views / FlatLists on tab screens that do **not** have a FAB.
 * Clears the bottom tab bar with comfortable breathing room.
 */
export const tabBarListScrollPaddingBottom = fabListScrollPaddingBase;
