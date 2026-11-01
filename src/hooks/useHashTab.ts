import { useCallback, useEffect, useState } from 'react';

function readHash<T extends string>(allowed: readonly T[]): T | null {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  return (allowed as readonly string[]).includes(id) ? (id as T) : null;
}

/**
 * Active-tab state mirrored into the URL hash (`#budget`), so refreshes and
 * shared links land on the same tab and browser back/forward switches tabs.
 * Only ids in `allowed` are honoured — anything else in the hash is ignored.
 */
export function useHashTab<T extends string>(allowed: readonly T[], fallback: T): [T, (tab: string) => void] {
  const [tab, setTab] = useState<T>(() => readHash(allowed) ?? fallback);

  useEffect(() => {
    const onHashChange = () => setTab(readHash(allowed) ?? fallback);
    // Back/forward over pushState entries fires `popstate`; manual edits fire `hashchange`.
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, [allowed, fallback]);

  const selectTab = useCallback(
    (next: string) => {
      if (!(allowed as readonly string[]).includes(next)) return;
      setTab(next as T);
      if (window.location.hash !== `#${next}`) {
        // pushState adds a history entry without triggering `hashchange` or scrolling.
        window.history.pushState(null, '', `#${next}`);
      }
    },
    [allowed]
  );

  return [tab, selectTab];
}
