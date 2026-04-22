import { spacing } from '@/shared/theme';
import {
  getSearchResultGridCardWidth,
  getSearchResultGridImageHeight,
  getSearchResultGridWideCardWidth,
  getSearchResultGridNarrowCardWidth,
  getSearchResultGridHeroCardWidth,
  getSearchResultGridHeroImageHeight,
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

describe('asymmetric widths', () => {
  const windowWidth = 390; // iPhone 14 width

  it('wide + narrow + gap = content width', () => {
    const wide = getSearchResultGridWideCardWidth(windowWidth);
    const narrow = getSearchResultGridNarrowCardWidth(windowWidth);
    const contentWidth = windowWidth - spacing.base * 2;
    expect(wide + narrow + SEARCH_GRID_COLUMN_GAP).toBeCloseTo(contentWidth, 0);
  });

  it('wide card is larger than narrow card', () => {
    const wide = getSearchResultGridWideCardWidth(windowWidth);
    const narrow = getSearchResultGridNarrowCardWidth(windowWidth);
    expect(wide).toBeGreaterThan(narrow);
  });

  it('hero card fills content width', () => {
    const hero = getSearchResultGridHeroCardWidth(windowWidth);
    const contentWidth = windowWidth - spacing.base * 2;
    expect(hero).toBeCloseTo(contentWidth, 0);
  });

  it('hero image uses 16:9 aspect ratio', () => {
    const hero = getSearchResultGridHeroCardWidth(windowWidth);
    const heroHeight = getSearchResultGridHeroImageHeight(hero);
    expect(heroHeight).toBeCloseTo(hero * (9 / 16), 0);
  });
});
