/**
 * Returns copies of `items` with fresh ids of the form `${prefix}-${now}-${i}`.
 *
 * AI responses (and the server's curated fallbacks) reuse fixed ids such as
 * `tl-1`, which would collide with items already on the event. Any id still
 * clashing with `existingIds` gets a numeric suffix, so the result is always
 * unique against both itself and the existing collection.
 */
export function assignUniqueIds<T extends { id: string }>(
  items: readonly T[],
  prefix: string,
  existingIds: Iterable<string> = [],
  now: number = Date.now(),
): T[] {
  const taken = new Set(existingIds);
  return items.map((item, i) => {
    const base = `${prefix}-${now}-${i}`;
    let id = base;
    for (let n = 1; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    return { ...item, id };
  });
}
