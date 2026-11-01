import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copies text to the clipboard and exposes a transient `copied` flag that
 * resets after `resetMs`. The reset timer is cleared on unmount.
 */
export function useCopyToClipboard(resetMs = 2000): {
  copied: boolean;
  copy: (text: string) => void;
} {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard?.writeText(text).catch(() => {
        /* Clipboard permission denied: nothing actionable for the user. */
      });
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs],
  );

  return { copied, copy };
}
