import {
  buildDefaultInvitation,
  buildInvitationMailto,
  formatInvitationAsText,
  personaliseInvitation,
} from './invitation';
import { makeEvent, makeGuest } from './__fixtures__/event';

describe('buildDefaultInvitation', () => {
  it('derives wording from the event', () => {
    const invite = buildDefaultInvitation(makeEvent());
    expect(invite.headline).toBe("Celebrate Maya's 30th");
    expect(invite.detailsBlock.when).toBe('Saturday, November 21, 2026 • 4:00 PM');
    expect(invite.detailsBlock.where).toBe('The Grove');
    expect(invite.detailsBlock.dressCode).toBe('Festive Chic • Inspired by "Sunset Botanicals"');
    expect(invite.signoff).toBe('With love and excitement, Maya');
    expect(invite).toMatchObject({ tone: 'warm', cardStyle: 'floral' });
  });

  it('falls back when event details are missing', () => {
    const invite = buildDefaultInvitation(
      makeEvent({ date: '', time: '', venueName: '', location: '', themeTitle: '', hostName: '' }),
    );
    expect(invite.detailsBlock.when).toBe('Upcoming Date • 4:00 PM');
    expect(invite.detailsBlock.where).toBe('Our Venue');
    expect(invite.detailsBlock.dressCode).toBe('Festive & Elegant');
    expect(invite.signoff).toContain('Your Host');
  });
});

describe('formatInvitationAsText', () => {
  it('renders the subject, body and details as plain text', () => {
    const text = formatInvitationAsText(buildDefaultInvitation(makeEvent()));
    expect(text.startsWith("You're Invited: Maya's 30th ✨\n\nCelebrate Maya's 30th\n")).toBe(true);
    expect(text).toContain('WHERE: The Grove');
    expect(text).toContain('DRESS CODE: Festive Chic');
  });

  it('defaults a missing dress code', () => {
    const invite = buildDefaultInvitation(makeEvent());
    delete invite.detailsBlock.dressCode;
    expect(formatInvitationAsText(invite)).toContain('DRESS CODE: Festive');
  });
});

describe('personaliseInvitation', () => {
  it('greets the guest by name without mutating the draft', () => {
    const invite = buildDefaultInvitation(makeEvent());
    expect(personaliseInvitation(invite, ' Elena ').greeting).toBe('Dear Elena,');
    expect(invite.greeting).toBe('Dear friends and family,');
  });

  it('returns the draft unchanged for a blank name', () => {
    const invite = buildDefaultInvitation(makeEvent());
    expect(personaliseInvitation(invite, '  ')).toBe(invite);
  });
});

describe('buildInvitationMailto', () => {
  const invite = buildDefaultInvitation(makeEvent());

  it('BCCs invitable guests and URL-encodes subject and body', () => {
    const href = buildInvitationMailto(invite, [
      makeGuest({ id: 'a', email: 'a+1@example.com' }),
      makeGuest({ id: 'b', email: 'b@example.com', rsvp: 'pending' }),
      makeGuest({ id: 'c', email: 'c@example.com', rsvp: 'declined' }),
    ]);
    expect(href).not.toBeNull();
    const url = new URL(href as string);
    expect(url.protocol).toBe('mailto:');
    expect(url.searchParams.get('bcc')).toBe('a+1@example.com,b@example.com');
    expect(url.searchParams.get('subject')).toBe(invite.subjectLine);
    expect(url.searchParams.get('body')).toContain('WHERE: The Grove');
    expect(href).toContain('a%2B1%40example.com');
    expect(href).not.toContain(' ');
  });

  it('returns null when nobody can be emailed', () => {
    expect(buildInvitationMailto(invite, [])).toBeNull();
  });
});
