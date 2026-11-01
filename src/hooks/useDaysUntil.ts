import { useEffect, useState } from 'react';
import { getDaysUntil, msUntilNextMidnight } from '../utils/eventStats';

/**
 * Calendar-day countdown to an ISO date that stays correct across midnight.
 *
 * The value only changes once a day, so instead of polling on an interval the
 * hook schedules a single timeout for the next local midnight (re-armed after
 * it fires) and clears it on unmount or when the date changes.
 */
export function useDaysUntil(isoDate: string | undefined): number | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // +50ms guards against firing a hair before midnight due to timer drift.
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msUntilNextMidnight() + 50);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [isoDate]);

  return getDaysUntil(isoDate, now);
}
