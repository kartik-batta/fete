import { z } from 'zod';
import { sanitizeUserText } from './sanitize';

// ---------------------------------------------------------------------------
// Request schemas (untrusted client input)
// ---------------------------------------------------------------------------

/**
 * Optional free-text field: bounded length, sanitised for prompt embedding, and
 * normalised so `null`, `''` and whitespace-only values all become `undefined`.
 */
const optionalText = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .nullish()
    .transform((value) => (value ? sanitizeUserText(value) : '') || undefined);

/** Optional non-negative number with an upper bound; `null` becomes `undefined`. */
const optionalNumber = (max: number, { integer = false } = {}) => {
  const base = z.number().min(0).max(max);
  return (integer ? base.int() : base).nullish().transform((value) => value ?? undefined);
};

const guestCount = optionalNumber(10_000, { integer: true });
const budget = optionalNumber(10_000_000);

export const TONES = ['warm', 'playful', 'elegant', 'minimalist'] as const;
export const INVITATION_TYPES = ['invitation', 'thank_you'] as const;
export const TIMELINE_CATEGORIES = [
  'prep',
  'arrival',
  'activity',
  'food',
  'toast',
  'party',
  'wind_down',
] as const;

export const themesRequestSchema = z.object({
  occasion: optionalText(60),
  guestCount,
  budget,
  vibe: optionalText(300),
  notes: optionalText(1_000),
});

export const invitationRequestSchema = z.object({
  eventTitle: optionalText(120),
  occasion: optionalText(60),
  hostName: optionalText(100),
  date: optionalText(40),
  time: optionalText(40),
  location: optionalText(200),
  theme: optionalText(200),
  tone: z.enum(TONES).nullish().transform((value) => value ?? 'warm'),
  extraDetails: optionalText(1_000),
  type: z.enum(INVITATION_TYPES).nullish().transform((value) => value ?? 'invitation'),
});

export const timelineRequestSchema = z.object({
  eventTitle: optionalText(120),
  occasion: optionalText(60),
  startTime: optionalText(40),
  endTime: optionalText(40),
  guestCount,
  vibes: optionalText(300),
  keyMoments: optionalText(1_000),
});

export const ideasRequestSchema = z.object({
  occasion: optionalText(60),
  guestCount,
  budget,
  theme: optionalText(200),
  dietary: optionalText(300),
  ageGroup: optionalText(100),
});

export type ThemesRequest = z.infer<typeof themesRequestSchema>;
export type InvitationRequest = z.infer<typeof invitationRequestSchema>;
export type TimelineRequest = z.infer<typeof timelineRequestSchema>;
export type IdeasRequest = z.infer<typeof ideasRequestSchema>;

// ---------------------------------------------------------------------------
// Model output schemas (untrusted model output, validated before reaching clients)
// ---------------------------------------------------------------------------

const outText = (maxLength = 600) => z.string().trim().min(1).max(maxLength);
const optionalOutText = (maxLength = 600) => z.string().trim().max(maxLength).optional();
const outList = (maxItems: number, maxLength = 300) =>
  z.array(outText(maxLength)).min(1).max(maxItems);

export const themeSchema = z.object({
  id: outText(60),
  title: outText(160),
  tagline: outText(400),
  palette: z
    .array(
      z.object({
        name: outText(60),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #RRGGBB colour'),
      }),
    )
    .min(1)
    .max(8),
  decorIdeas: outList(10),
  musicVibe: optionalOutText(300),
  attirePrompt: optionalOutText(300),
  signatureTouch: outText(400),
});

export const themesOutputSchema = z.array(themeSchema).min(1).max(6);

export const invitationOutputSchema = z.object({
  subjectLine: outText(200),
  headline: outText(200),
  greeting: outText(200),
  body: outText(2_000),
  detailsBlock: z.object({
    when: outText(200),
    where: outText(300),
    rsvpNote: outText(400),
    dressCode: optionalOutText(200),
  }),
  closing: outText(300),
  signoff: outText(200),
});

export const timelineOutputSchema = z
  .array(
    z.object({
      id: outText(60),
      time: outText(40),
      title: outText(160),
      description: outText(600),
      category: z.enum(TIMELINE_CATEGORIES),
      assignedTo: outText(160),
      tips: optionalOutText(400),
    }),
  )
  .min(1)
  .max(15);

export const ideasOutputSchema = z.object({
  decor: z
    .array(
      z.object({
        item: outText(200),
        description: outText(600),
        estimatedCost: optionalOutText(60),
        priority: optionalOutText(30),
      }),
    )
    .min(1)
    .max(12),
  menu: z.object({
    starters: outList(10),
    mains: outList(10),
    desserts: outList(10),
    signatureDrinks: outList(10),
  }),
  activities: z
    .array(
      z.object({
        title: outText(200),
        duration: optionalOutText(80),
        description: outText(600),
        materialsNeeded: optionalOutText(300),
      }),
    )
    .min(1)
    .max(10),
});

export type Theme = z.infer<typeof themeSchema>;
export type InvitationCopy = z.infer<typeof invitationOutputSchema>;
export type Timeline = z.infer<typeof timelineOutputSchema>;
export type Ideas = z.infer<typeof ideasOutputSchema>;
