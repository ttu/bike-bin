import { groupSearchResultPairs } from '../groupSearchResultPairs';

describe('groupSearchResultPairs', () => {
  it('groups items into alternating wide-narrow / narrow-wide pairs', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const pairs = groupSearchResultPairs(items);
    expect(pairs).toEqual([
      { type: 'wide-narrow', items: ['a', 'b'] },
      { type: 'narrow-wide', items: ['c', 'd'] },
      { type: 'wide-narrow', items: ['e'] },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(groupSearchResultPairs([])).toEqual([]);
  });

  it('handles single item', () => {
    const pairs = groupSearchResultPairs(['a']);
    expect(pairs).toEqual([{ type: 'wide-narrow', items: ['a'] }]);
  });
});
