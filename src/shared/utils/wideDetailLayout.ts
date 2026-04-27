import { Platform } from 'react-native';
import { spacing } from '@/shared/theme';

/** Viewport width at which detail screens use a wider, centered column. */
export const WIDE_DETAIL_BREAKPOINT = 768;
/** Max width of the detail content column on large viewports. */
export const WIDE_DETAIL_PAGE_MAX_WIDTH = 1120;
/** Min width per column in the wide split (gallery | content) layout. */
export const WIDE_DETAIL_SPLIT_MIN_COLUMN_WIDTH = 280;

/**
 * Layout for item/bike detail: on web at wide breakpoints, use a two-column row
 * (gallery | content). On native or narrow viewports, stack vertically.
 */
export function getWideDetailLayout(windowWidth: number): {
  isWide: boolean;
  splitLayout: boolean;
  pageWidth: number;
  /** Pass to PhotoGallery `maxGalleryWidth`; omit when undefined (default gallery sizing). */
  galleryMaxWidth: number | undefined;
} {
  const isWide = windowWidth >= WIDE_DETAIL_BREAKPOINT;
  const splitLayout = Platform.OS === 'web' && isWide;
  const pageWidth = Math.min(windowWidth, WIDE_DETAIL_PAGE_MAX_WIDTH);
  const horizontalPadding = spacing.base * 2;
  const columnGap = spacing.lg;

  let galleryMaxWidth: number | undefined;
  if (splitLayout) {
    galleryMaxWidth = Math.max(
      WIDE_DETAIL_SPLIT_MIN_COLUMN_WIDTH,
      Math.floor((pageWidth - horizontalPadding - columnGap) / 2),
    );
  } else if (isWide) {
    galleryMaxWidth = Math.max(320, pageWidth - horizontalPadding);
  }

  return { isWide, splitLayout, pageWidth, galleryMaxWidth };
}
