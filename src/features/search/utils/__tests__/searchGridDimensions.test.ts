import { spacing } from '@/shared/theme';
import {
  getSearchResultGridCardWidth,
  getSearchResultGridImageHeight,
  SEARCH_GRID_COLUMN_GAP,
} from '../searchGridDimensions';

describe('searchGridDimensions', () => {
  it('computes card width from window width and list padding', () => {
    const windowWidth = 400;
    const expected = (windowWidth - spacing.base * 2 - SEARCH_GRID_COLUMN_GAP) / 2;
    expect(getSearchResultGridCardWidth(windowWidth)).toBe(expected);
  });

  it('derives image height from card width', () => {
    const cardWidth = 160;
    expect(getSearchResultGridImageHeight(cardWidth)).toBe(120);
  });
});
