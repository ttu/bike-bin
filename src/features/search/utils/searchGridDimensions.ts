import { spacing } from '@/shared/theme';

/** Matches `COLUMN_GAP` between two columns in the search results grid. */
export const SEARCH_GRID_COLUMN_GAP = spacing.sm;

/**
 * Card width for the search results grid. Matches list horizontal padding
 * (`spacing.base` on each side) and the gap between the two columns.
 */
export function getSearchResultGridCardWidth(windowWidth: number): number {
  const horizontalPadding = spacing.base * 2;
  return (windowWidth - horizontalPadding - SEARCH_GRID_COLUMN_GAP) / 2;
}

export function getSearchResultGridImageHeight(cardWidth: number): number {
  return cardWidth * 0.75;
}
