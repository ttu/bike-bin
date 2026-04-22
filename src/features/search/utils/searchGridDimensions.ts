import { spacing } from '@/shared/theme';

/** Matches `COLUMN_GAP` between two columns in the search results grid. */
export const SEARCH_GRID_COLUMN_GAP = spacing.sm;

/** Aspect ratios (height/width) for each card variant in the search results grid. */
export const SEARCH_RESULT_IMAGE_ASPECT_RATIOS = {
  hero: 9 / 16,
  wide: 0.75,
  narrow: 1,
} as const;

/** Content width after horizontal padding. */
function contentWidth(windowWidth: number): number {
  return windowWidth - spacing.base * 2;
}

/** Card width for the symmetric 2-column search results grid. */
export function getSearchResultGridCardWidth(windowWidth: number): number {
  return (contentWidth(windowWidth) - SEARCH_GRID_COLUMN_GAP) / 2;
}

export function getSearchResultGridImageHeight(cardWidth: number): number {
  return cardWidth * 0.75;
}

/** Wide card in a 1.6:1 asymmetric row. */
export function getSearchResultGridWideCardWidth(windowWidth: number): number {
  return (contentWidth(windowWidth) - SEARCH_GRID_COLUMN_GAP) * 0.615;
}

/** Narrow card in a 1.6:1 asymmetric row (remainder). */
export function getSearchResultGridNarrowCardWidth(windowWidth: number): number {
  return (
    contentWidth(windowWidth) -
    SEARCH_GRID_COLUMN_GAP -
    getSearchResultGridWideCardWidth(windowWidth)
  );
}

/** Full-width hero card. */
export function getSearchResultGridHeroCardWidth(windowWidth: number): number {
  return contentWidth(windowWidth);
}

/** Hero image height at 16:9 aspect ratio. */
export function getSearchResultGridHeroImageHeight(cardWidth: number): number {
  return cardWidth * (9 / 16);
}
