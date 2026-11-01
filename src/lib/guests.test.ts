import { DEFAULT_GUEST_COUNT, expectedHeadcount, invitableEmails } from './guests';
import { makeGuest } from './__fixtures__/event';

describe('expectedHeadcount', () => {
  it('counts attending guests plus their plus-ones', () => {
    const guests = [
      makeGuest({ id: 'a', rsvp: 'attending', plusOnes: 1 }),
      makeGuest({ id: 'b', rsvp: 'attending', plusOnes: 0 }),
      makeGuest({ id: 'c', rsvp: 'pending', plusOnes: 3 }),
      makeGuest({ id: 'd', rsvp: 'declined', plusOnes: 2 }),
    ];
    expect(expectedHeadcount(guests)).toBe(3);
  });

  it('falls back to all non-declined guests when nobody has confirmed', () => {
    const guests = [
      makeGuest({ id: 'a', rsvp: 'pending', plusOnes: 1 }),
      makeGuest({ id: 'b', rsvp: 'declined' }),
    ];
    expect(expectedHeadcount(guests)).toBe(2);
  });

  it('uses the default for an empty or fully declined list', () => {
    expect(expectedHeadcount([])).toBe(DEFAULT_GUEST_COUNT);
    expect(expectedHeadcount([makeGuest({ rsvp: 'declined' })])).toBe(DEFAULT_GUEST_COUNT);
  });

  it('ignores negative plus-ones', () => {
    expect(expectedHeadcount([makeGuest({ plusOnes: -4 })])).toBe(1);
  });
});

describe('invitableEmails', () => {
  it('returns unique valid emails of attending and pending guests', () => {
    const guests = [
      makeGuest({ id: 'a', email: ' ada@example.com ', rsvp: 'attending' }),
      makeGuest({ id: 'b', email: 'ada@example.com', rsvp: 'pending' }),
      makeGuest({ id: 'c', email: 'bob@example.com', rsvp: 'declined' }),
      makeGuest({ id: 'd', email: 'not-an-email', rsvp: 'pending' }),
      makeGuest({ id: 'e', email: 'x@y.com,evil@z.com', rsvp: 'pending' }),
      makeGuest({ id: 'f', email: '', rsvp: 'pending' }),
    ];
    expect(invitableEmails(guests)).toEqual(['ada@example.com']);
  });
});
