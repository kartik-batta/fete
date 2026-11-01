import React, { useCallback, useState } from 'react';

/**
 * Polite screen-reader announcements for add / update / delete feedback.
 * The region is always mounted (required for reliable announcements); an
 * alternating trailing non-breaking space lets identical messages repeat.
 */
export function useAnnouncer() {
  const [message, setMessage] = useState('');
  const announce = useCallback((text: string) => {
    setMessage((prev) => (prev === text ? `${text} ` : text));
  }, []);
  return { message, announce };
}

export const LiveRegion: React.FC<{ message: string }> = ({ message }) => (
  <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
    {message}
  </div>
);
