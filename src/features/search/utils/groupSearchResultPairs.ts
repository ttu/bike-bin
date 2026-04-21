export type RowType = 'wide-narrow' | 'narrow-wide';

export interface SearchResultPair<T> {
  type: RowType;
  items: T[];
}

/**
 * Groups items into pairs for the asymmetric editorial grid.
 * Alternates between wide-narrow and narrow-wide row layouts.
 */
export function groupSearchResultPairs<T>(items: T[]): SearchResultPair<T>[] {
  const pairs: SearchResultPair<T>[] = [];
  const rowTypes: RowType[] = ['wide-narrow', 'narrow-wide'];

  for (let i = 0; i < items.length; i += 2) {
    pairs.push({
      type: rowTypes[(i / 2) % 2],
      items: items.slice(i, i + 2),
    });
  }

  return pairs;
}
