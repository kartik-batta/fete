import type { InvitationCardStyle } from '../../../types';

/** Tailwind classes for each region of the stationery card. */
export interface CardStyleClasses {
  label: string;
  emoji: string;
  outer: string;
  inner: string;
  badge: string;
  headline: string;
  greeting: string;
  body: string;
  details: string;
  detailLabel: string;
  detailValue: string;
  rsvp: string;
  closing: string;
  signoff: string;
  /** Swatch shown in the style picker. */
  swatch: string;
}

/** Visual treatments for the invitation card, keyed by `InvitationDraft.cardStyle`. */
export const CARD_STYLES: Record<InvitationCardStyle, CardStyleClasses> = {
  floral: {
    label: 'Floral',
    emoji: '🥂',
    outer: 'bg-[#FFFDF9] border-[#E8DCC9]',
    inner: 'border-[#E8DCC9]/70',
    badge: 'text-amber-800',
    headline: 'text-stone-900',
    greeting: 'text-stone-600',
    body: 'text-stone-800 font-serif',
    details: 'bg-[#FAF6EE] border-[#E9DEC8]',
    detailLabel: 'text-stone-900',
    detailValue: 'text-stone-700',
    rsvp: 'text-stone-500',
    closing: 'font-handwriting text-rose-800',
    signoff: 'text-stone-700',
    swatch: 'bg-rose-100 border-rose-300',
  },
  champagne: {
    label: 'Champagne',
    emoji: '🍾',
    outer: 'bg-[#FFF9EC] border-[#E3C98F]',
    inner: 'border-[#D4AF6A]/60',
    badge: 'text-amber-700',
    headline: 'text-amber-950',
    greeting: 'text-amber-900/80',
    body: 'text-stone-800 font-serif',
    details: 'bg-[#FBEFD3] border-[#E3C98F]',
    detailLabel: 'text-amber-950',
    detailValue: 'text-amber-900',
    rsvp: 'text-amber-800/80',
    closing: 'font-handwriting text-amber-800',
    signoff: 'text-amber-900',
    swatch: 'bg-amber-200 border-amber-400',
  },
  midnight: {
    label: 'Midnight',
    emoji: '✨',
    outer: 'bg-[#1F2235] border-[#3B3F5C]',
    inner: 'border-[#C9A96E]/50',
    badge: 'text-[#E0C38C]',
    headline: 'text-white',
    greeting: 'text-indigo-100',
    body: 'text-indigo-50 font-serif',
    details: 'bg-[#2B2F48] border-[#454A6B]',
    detailLabel: 'text-[#E0C38C]',
    detailValue: 'text-indigo-50',
    rsvp: 'text-indigo-200',
    closing: 'font-handwriting text-[#E0C38C]',
    signoff: 'text-indigo-100',
    swatch: 'bg-[#2B2D42] border-[#C9A96E]',
  },
  minimalist: {
    label: 'Minimalist',
    emoji: '◦',
    outer: 'bg-white border-stone-200',
    inner: 'border-stone-200',
    badge: 'text-stone-500',
    headline: 'text-stone-900',
    greeting: 'text-stone-500',
    body: 'text-stone-700',
    details: 'bg-stone-50 border-stone-200',
    detailLabel: 'text-stone-900',
    detailValue: 'text-stone-600',
    rsvp: 'text-stone-400',
    closing: 'font-serif-title text-stone-800',
    signoff: 'text-stone-600',
    swatch: 'bg-white border-stone-400',
  },
};

export const CARD_STYLE_IDS = Object.keys(CARD_STYLES) as InvitationCardStyle[];
