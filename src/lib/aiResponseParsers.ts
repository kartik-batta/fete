/**
 * Runtime shape checks for AI endpoint responses.
 *
 * The server returns model-generated JSON, so the client never trusts it
 * blindly: every payload is validated and normalised into the strict
 * application types before it reaches React state. Parsers throw a
 * {@link ResponseShapeError} describing the first offending path.
 */
import type {
  ActivityIdea,
  AITheme,
  CuratedIdeas,
  DecorIdea,
  GeneratedInvitation,
  MenuIdeas,
  PaletteColor,
  TimelineCategory,
  TimelineEvent,
} from '../types';

/** Raised when a JSON payload does not match the expected contract. */
export class ResponseShapeError extends Error {
  constructor(public readonly path: string, expected: string) {
    super(`Invalid AI response at "${path}": expected ${expected}`);
    this.name = 'ResponseShapeError';
  }
}

type JsonRecord = Record<string, unknown>;

const TIMELINE_CATEGORIES: readonly TimelineCategory[] = [
  'prep',
  'arrival',
  'activity',
  'food',
  'toast',
  'party',
  'wind_down',
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) throw new ResponseShapeError(path, 'an object');
  return value;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new ResponseShapeError(path, 'an array');
  return value;
}

function requiredString(record: JsonRecord, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new ResponseShapeError(`${path}.${key}`, 'a string');
  return value;
}

/** Optional strings tolerate absence/null but reject other types. */
function optionalString(record: JsonRecord, key: string, path: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new ResponseShapeError(`${path}.${key}`, 'a string');
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  return asArray(value, path).map((item, i) => {
    if (typeof item !== 'string') throw new ResponseShapeError(`${path}[${i}]`, 'a string');
    return item;
  });
}

function parsePaletteColor(value: unknown, path: string): PaletteColor {
  const record = asRecord(value, path);
  return { name: requiredString(record, 'name', path), hex: requiredString(record, 'hex', path) };
}

function parseTheme(value: unknown, index: number, path: string): AITheme {
  const record = asRecord(value, path);
  return {
    id: optionalString(record, 'id', path) || `theme-${index + 1}`,
    title: requiredString(record, 'title', path),
    tagline: requiredString(record, 'tagline', path),
    palette: asArray(record.palette ?? [], `${path}.palette`).map((c, i) =>
      parsePaletteColor(c, `${path}.palette[${i}]`),
    ),
    decorIdeas: stringArray(record.decorIdeas ?? [], `${path}.decorIdeas`),
    musicVibe: optionalString(record, 'musicVibe', path) ?? '',
    attirePrompt: optionalString(record, 'attirePrompt', path) ?? '',
    signatureTouch: optionalString(record, 'signatureTouch', path) ?? '',
  };
}

/** Validates a `/api/gemini/themes` body and returns its theme concepts. */
export function parseThemesResponse(body: unknown): AITheme[] {
  const record = asRecord(body, '$');
  return asArray(record.themes, '$.themes').map((t, i) => parseTheme(t, i, `$.themes[${i}]`));
}

/** Validates a `/api/gemini/invitation` body and returns the generated wording. */
export function parseInvitationResponse(body: unknown): GeneratedInvitation {
  const record = asRecord(body, '$');
  const path = '$.invitation';
  const invite = asRecord(record.invitation, path);
  const detailsPath = `${path}.detailsBlock`;
  const details = asRecord(invite.detailsBlock, detailsPath);
  const dressCode = optionalString(details, 'dressCode', detailsPath);

  return {
    subjectLine: requiredString(invite, 'subjectLine', path),
    headline: requiredString(invite, 'headline', path),
    greeting: requiredString(invite, 'greeting', path),
    body: requiredString(invite, 'body', path),
    detailsBlock: {
      when: requiredString(details, 'when', detailsPath),
      where: requiredString(details, 'where', detailsPath),
      rsvpNote: requiredString(details, 'rsvpNote', detailsPath),
      ...(dressCode !== undefined && { dressCode }),
    },
    closing: requiredString(invite, 'closing', path),
    signoff: requiredString(invite, 'signoff', path),
  };
}

function toTimelineCategory(value: string | undefined): TimelineCategory {
  return TIMELINE_CATEGORIES.find((c) => c === value) ?? 'activity';
}

function parseTimelineItem(value: unknown, index: number, path: string): TimelineEvent {
  const record = asRecord(value, path);
  const tips = optionalString(record, 'tips', path);
  return {
    id: optionalString(record, 'id', path) || `tl-${index + 1}`,
    time: requiredString(record, 'time', path),
    title: requiredString(record, 'title', path),
    description: optionalString(record, 'description', path) ?? '',
    category: toTimelineCategory(optionalString(record, 'category', path)),
    assignedTo: optionalString(record, 'assignedTo', path) ?? '',
    ...(tips !== undefined && { tips }),
  };
}

/** Validates a `/api/gemini/timeline` body and returns the run-of-show milestones. */
export function parseTimelineResponse(body: unknown): TimelineEvent[] {
  const record = asRecord(body, '$');
  return asArray(record.timeline, '$.timeline').map((item, i) =>
    parseTimelineItem(item, i, `$.timeline[${i}]`),
  );
}

function parseDecorIdea(value: unknown, path: string): DecorIdea {
  const record = asRecord(value, path);
  const estimatedCost = optionalString(record, 'estimatedCost', path);
  const priority = optionalString(record, 'priority', path);
  return {
    item: requiredString(record, 'item', path),
    description: optionalString(record, 'description', path) ?? '',
    ...(estimatedCost !== undefined && { estimatedCost }),
    ...(priority !== undefined && { priority }),
  };
}

function parseActivityIdea(value: unknown, path: string): ActivityIdea {
  const record = asRecord(value, path);
  const materialsNeeded = optionalString(record, 'materialsNeeded', path);
  return {
    title: requiredString(record, 'title', path),
    duration: optionalString(record, 'duration', path) ?? '',
    description: optionalString(record, 'description', path) ?? '',
    ...(materialsNeeded !== undefined && { materialsNeeded }),
  };
}

function parseMenu(value: unknown, path: string): MenuIdeas {
  const record = asRecord(value, path);
  return {
    starters: stringArray(record.starters, `${path}.starters`),
    mains: stringArray(record.mains, `${path}.mains`),
    desserts: stringArray(record.desserts, `${path}.desserts`),
    signatureDrinks: stringArray(record.signatureDrinks, `${path}.signatureDrinks`),
  };
}

/** Validates a `/api/gemini/ideas` body and returns décor, menu and activity ideas. */
export function parseIdeasResponse(body: unknown): CuratedIdeas {
  const record = asRecord(body, '$');
  const ideas = asRecord(record.ideas, '$.ideas');
  return {
    decor: asArray(ideas.decor, '$.ideas.decor').map((d, i) =>
      parseDecorIdea(d, `$.ideas.decor[${i}]`),
    ),
    menu: parseMenu(ideas.menu, '$.ideas.menu'),
    activities: asArray(ideas.activities, '$.ideas.activities').map((a, i) =>
      parseActivityIdea(a, `$.ideas.activities[${i}]`),
    ),
  };
}
