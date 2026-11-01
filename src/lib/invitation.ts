import type { EventData, Guest, InvitationDraft } from '../types';
import { invitableEmails } from './guests';
import { formatLongDate } from './time';

/** Builds the starter invitation shown before anything has been generated. */
export function buildDefaultInvitation(event: EventData): InvitationDraft {
  return {
    subjectLine: `You're Invited: ${event.title} ✨`,
    headline: `Celebrate ${event.title}`,
    greeting: 'Dear friends and family,',
    body: 'We are coming together to celebrate this cherished milestone with laughter, wonderful company, sparkling drinks, and farm-fresh bites. Your presence will make the celebration complete!',
    detailsBlock: {
      when: `${formatLongDate(event.date)} • ${event.time || '4:00 PM'}`,
      where: event.venueName || event.location || 'Our Venue',
      rsvpNote: 'Please kindly RSVP with your dietary preferences.',
      dressCode: event.themeTitle
        ? `Festive Chic • Inspired by "${event.themeTitle}"`
        : 'Festive & Elegant',
    },
    closing: "We can't wait to clink glasses with you!",
    signoff: `With love and excitement, ${event.hostName || 'Your Host'}`,
    tone: 'warm',
    cardStyle: 'floral',
  };
}

/** Renders the invitation body (everything after the subject) as plain text. */
export function formatInvitationBody(invite: InvitationDraft): string {
  const { detailsBlock: d } = invite;
  return [
    invite.headline,
    invite.greeting,
    '',
    invite.body,
    '',
    `WHEN: ${d.when}`,
    `WHERE: ${d.where}`,
    `RSVP: ${d.rsvpNote}`,
    `DRESS CODE: ${d.dressCode || 'Festive'}`,
    '',
    invite.closing,
    invite.signoff,
  ].join('\n');
}

/** Renders an invitation (subject + body) as plain text for copy/paste. */
export function formatInvitationAsText(invite: InvitationDraft): string {
  return `${invite.subjectLine}\n\n${formatInvitationBody(invite)}`;
}

/** Returns a copy of the invitation greeting the given guest by name. */
export function personaliseInvitation(invite: InvitationDraft, guestName: string): InvitationDraft {
  const name = guestName.trim();
  return name ? { ...invite, greeting: `Dear ${name},` } : invite;
}

/**
 * Builds a `mailto:` link that BCCs every attending/pending guest with a valid
 * email (protecting guest privacy) and pre-fills subject and body.
 * Returns `null` when there is nobody to email.
 */
export function buildInvitationMailto(invite: InvitationDraft, guests: readonly Guest[]): string | null {
  const emails = invitableEmails(guests);
  if (emails.length === 0) return null;
  const params = [
    `bcc=${emails.map(encodeURIComponent).join(',')}`,
    `subject=${encodeURIComponent(invite.subjectLine)}`,
    `body=${encodeURIComponent(formatInvitationBody(invite))}`,
  ];
  return `mailto:?${params.join('&')}`;
}
