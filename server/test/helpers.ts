import { vi } from 'vitest';
import './nodeEnv';
import { createApp, type AppDeps } from '../app';
import type { JsonGenerationRequest, JsonGenerator } from '../gemini/client';
import { silentLogger } from '../logger';

/** A mock generator whose behaviour is supplied per test. */
export function mockGenerator(
  impl: (request: JsonGenerationRequest) => Promise<string | undefined>,
): JsonGenerator & { generateJson: ReturnType<typeof vi.fn> } {
  return { generateJson: vi.fn(impl) };
}

/** Generator that always answers with `value` serialised as JSON. */
export function respondingWith(value: unknown) {
  return mockGenerator(async () => JSON.stringify(value));
}

/** Builds a quiet app with a generous rate limit unless overridden. */
export function testApp(overrides: Partial<AppDeps> = {}) {
  return createApp({
    generator: null,
    logger: silentLogger,
    rateLimit: { windowMs: 60_000, max: 1_000 },
    ...overrides,
  });
}

export const validTheme = {
  id: 'ai-1',
  title: 'Moonlit Garden',
  tagline: 'Silver and sage under the stars.',
  palette: [{ name: 'Sage', hex: '#B8D5B8' }],
  decorIdeas: ['Lanterns'],
  musicVibe: 'Jazz',
  attirePrompt: 'Cocktail',
  signatureTouch: 'Star wishes wall',
};

export const validInvitation = {
  subjectLine: 'Join us!',
  headline: 'A Night to Remember',
  greeting: 'Dear friend,',
  body: 'Please celebrate with us.',
  detailsBlock: { when: 'Saturday', where: 'The Garden', rsvpNote: 'RSVP soon' },
  closing: 'See you there',
  signoff: 'Love, Sam',
};

export const validTimeline = [
  {
    id: 'm1',
    time: '6:00 PM',
    title: 'Welcome',
    description: 'Drinks on arrival',
    category: 'arrival',
    assignedTo: 'Host',
  },
];

export const validIdeas = {
  decor: [{ item: 'Garland', description: 'Eucalyptus garland' }],
  menu: { starters: ['Bruschetta'], mains: ['Risotto'], desserts: ['Tart'], signatureDrinks: ['Spritz'] },
  activities: [{ title: 'Trivia', duration: '20 mins', description: 'Fun quiz' }],
};
