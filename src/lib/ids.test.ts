import { assignUniqueIds } from './ids';

describe('assignUniqueIds', () => {
  const items = [{ id: 'tl-1', v: 'a' }, { id: 'tl-1', v: 'b' }];

  it('re-identifies every item deterministically and preserves other fields', () => {
    expect(assignUniqueIds(items, 'tl', [], 100)).toEqual([
      { id: 'tl-100-0', v: 'a' },
      { id: 'tl-100-1', v: 'b' },
    ]);
  });

  it('avoids collisions with existing ids', () => {
    const result = assignUniqueIds(items, 'tl', ['tl-100-0', 'tl-100-0-1'], 100);
    expect(result.map((r) => r.id)).toEqual(['tl-100-0-2', 'tl-100-1']);
  });

  it('does not mutate the input', () => {
    assignUniqueIds(items, 'tl', [], 1);
    expect(items[0].id).toBe('tl-1');
  });
});
