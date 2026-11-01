import type { Guest } from '../types';

/** Headcount assumed when the guest list is still empty. */
export const DEFAULT_GUEST_COUNT = 30;

const headcountOf = (guests: readonly Guest[]) =>
  guests.reduce((sum, g) => sum + 1 + Math.max(0, g.plusOnes || 0), 0);

/**
 * Expected headcount for AI planning prompts.
 *
 * 1. Confirmed attendees including their plus-ones.
 * 2. If nobody has confirmed yet: everyone not declined, including plus-ones.
 * 3. If the list is empty: {@link DEFAULT_GUEST_COUNT}.
 */
export function expectedHeadcount(guests: readonly Guest[]): number {
  const attending = headcountOf(guests.filter((g) => g.rsvp === 'attending'));
  if (attending > 0) return attending;
  const invited = headcountOf(guests.filter((g) => g.rsvp !== 'declined'));
  return invited || DEFAULT_GUEST_COUNT;
}

/** Unique, trimmed emails of guests who are attending or have not replied yet. */
export function invitableEmails(guests: readonly Guest[]): string[] {
  const emails = guests
    .filter((g) => g.rsvp !== 'declined')
    .map((g) => g.email.trim())
    .filter((email) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email));
  return [...new Set(emails)];
}
