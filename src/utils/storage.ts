/**
 * localStorage persistence for celebration events.
 *
 * - Data is stored in a versioned envelope (`{ version, events }`) so future
 *   schema changes can migrate instead of silently breaking.
 * - Everything read back is treated as untrusted input: localStorage can be
 *   edited by the user, extensions or an XSS payload, so each event is
 *   validated and normalised field-by-field. Malformed records are dropped
 *   rather than crashing the app or flowing unchecked into the UI.
 * - Writes report failures (quota exceeded / storage disabled) instead of
 *   throwing, so the UI keeps working in private mode or when storage is full.
 */
import type {
  ChecklistTask,
  EventData,
  Expense,
  Guest,
  InvitationDraft,
  PaletteColor,
  TimelineEvent,
  Vendor,
} from '../types';
import { SAMPLE_EVENTS } from '../data/sampleEvents';

export const STORAGE_KEY = 'fete_celebration_events';
export const ACTIVE_EVENT_KEY = 'fete_active_event_id';
/** Pre-envelope key that held a bare `EventData[]`. Migrated on first load. */
export const LEGACY_STORAGE_KEY_V1 = 'fete_celebration_events_v1';
export const STORAGE_VERSION = 2;

/** Upper bound on events kept, to stop a tampered payload ballooning memory. */
const MAX_EVENTS = 200;
/** Upper bound on any single nested list (guests, tasks, ...). */
const MAX_ITEMS = 2000;
const MAX_STRING_LENGTH = 10_000;

export type SaveFailureReason = 'quota' | 'unavailable';
export type SaveResult = { ok: true } | { ok: false; reason: SaveFailureReason };

interface StorageEnvelope {
  version: number;
  events: unknown;
}

// ---------------------------------------------------------------------------
// Primitive guards
// ---------------------------------------------------------------------------

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, MAX_STRING_LENGTH) : fallback;
}

function optStr(value: unknown): string | undefined {
  return typeof value === 'string' ? value.slice(0, MAX_STRING_LENGTH) : undefined;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').slice(0, MAX_ITEMS) : [];
}

/** Maps a list through a per-item sanitiser, discarding items it rejects. */
function list<T>(value: unknown, sanitize: (item: UnknownRecord) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value.slice(0, MAX_ITEMS)) {
    if (!isRecord(item)) continue;
    const clean = sanitize(item);
    if (clean) out.push(clean);
  }
  return out;
}

function hasId(item: UnknownRecord): item is UnknownRecord & { id: string } {
  return typeof item.id === 'string' && item.id.length > 0;
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// ---------------------------------------------------------------------------
// Entity sanitisers
// ---------------------------------------------------------------------------

function sanitizePaletteColor(item: UnknownRecord): PaletteColor | null {
  const hex = str(item.hex);
  return HEX_COLOR.test(hex) ? { name: str(item.name, hex), hex } : null;
}

function sanitizeGuest(item: UnknownRecord): Guest | null {
  if (!hasId(item)) return null;
  return {
    id: item.id,
    name: str(item.name),
    email: str(item.email),
    phone: str(item.phone),
    rsvp: oneOf(item.rsvp, ['attending', 'declined', 'pending'] as const, 'pending'),
    plusOnes: Math.floor(num(item.plusOnes)),
    dietary: str(item.dietary),
    group: oneOf(item.group, ['family', 'friends', 'colleagues', 'vip', 'other'] as const, 'other'),
    tableNumber: optStr(item.tableNumber),
    notes: optStr(item.notes),
  };
}

function sanitizeExpense(item: UnknownRecord): Expense | null {
  if (!hasId(item)) return null;
  return {
    id: item.id,
    category: oneOf(
      item.category,
      ['venue', 'catering', 'decor', 'entertainment', 'photo', 'favors', 'apparel', 'other'] as const,
      'other'
    ),
    name: str(item.name),
    budgeted: num(item.budgeted),
    actual: num(item.actual),
    status: oneOf(item.status, ['planned', 'deposit_paid', 'paid_in_full'] as const, 'planned'),
    vendorName: optStr(item.vendorName),
    notes: optStr(item.notes),
  };
}

function sanitizeTask(item: UnknownRecord): ChecklistTask | null {
  if (!hasId(item)) return null;
  return {
    id: item.id,
    title: str(item.title),
    phase: oneOf(
      item.phase,
      ['2_months_before', '1_month_before', '1_2_weeks', 'day_before', 'day_of', 'post_event'] as const,
      '1_month_before'
    ),
    dueDate: str(item.dueDate),
    completed: item.completed === true,
    priority: oneOf(item.priority, ['high', 'medium', 'low'] as const, 'medium'),
    assignedTo: str(item.assignedTo),
    notes: optStr(item.notes),
  };
}

function sanitizeVendor(item: UnknownRecord): Vendor | null {
  if (!hasId(item)) return null;
  return {
    id: item.id,
    name: str(item.name),
    category: oneOf(
      item.category,
      [
        'venue',
        'catering',
        'photography',
        'florist',
        'music_dj',
        'cake_bakery',
        'rentals',
        'decor',
        'entertainment',
        'other',
      ] as const,
      'other'
    ),
    contactPerson: str(item.contactPerson),
    phone: str(item.phone),
    email: str(item.email),
    website: str(item.website),
    costQuote: num(item.costQuote),
    status: oneOf(item.status, ['researching', 'contacted', 'booked', 'paid'] as const, 'researching'),
    notes: str(item.notes),
  };
}

function sanitizeTimelineItem(item: UnknownRecord): TimelineEvent | null {
  if (!hasId(item)) return null;
  return {
    id: item.id,
    time: str(item.time),
    title: str(item.title),
    description: str(item.description),
    category: oneOf(
      item.category,
      ['prep', 'arrival', 'activity', 'food', 'toast', 'party', 'wind_down'] as const,
      'activity'
    ),
    assignedTo: str(item.assignedTo),
    tips: optStr(item.tips),
    completed: typeof item.completed === 'boolean' ? item.completed : undefined,
  };
}

function sanitizeInvitation(item: UnknownRecord): InvitationDraft {
  const details = isRecord(item.detailsBlock) ? item.detailsBlock : {};
  return {
    subjectLine: str(item.subjectLine),
    headline: str(item.headline),
    greeting: str(item.greeting),
    body: str(item.body),
    detailsBlock: {
      when: str(details.when),
      where: str(details.where),
      rsvpNote: str(details.rsvpNote),
      dressCode: optStr(details.dressCode),
    },
    closing: str(item.closing),
    signoff: str(item.signoff),
    tone: oneOf(item.tone, ['warm', 'playful', 'elegant', 'minimalist'] as const, 'warm'),
    cardStyle: oneOf(item.cardStyle, ['floral', 'champagne', 'midnight', 'minimalist'] as const, 'floral'),
  };
}

/**
 * Validates and normalises one untrusted event record.
 * Returns `null` when the record lacks the identity fields needed to use it.
 *
 * Optional AI-generated blobs (invitation draft, menu, activities) are rebuilt
 * from their string leaves so a tampered value can never reach the UI as an
 * object (which would crash rendering).
 */
export function sanitizeEvent(raw: unknown): EventData | null {
  if (!isRecord(raw) || !hasId(raw) || typeof raw.title !== 'string') return null;

  const menu = isRecord(raw.menuIdeas) ? raw.menuIdeas : undefined;
  const event: EventData = {
    id: raw.id,
    title: str(raw.title),
    occasion: oneOf(
      raw.occasion,
      ['birthday', 'wedding', 'baby_shower', 'anniversary', 'office_party', 'dinner_party', 'holiday', 'other'] as const,
      'other'
    ),
    date: str(raw.date),
    time: str(raw.time),
    location: str(raw.location),
    venueName: str(raw.venueName),
    hostName: str(raw.hostName),
    hostEmail: str(raw.hostEmail),
    totalBudget: num(raw.totalBudget),
    themeTitle: str(raw.themeTitle),
    themeDescription: str(raw.themeDescription),
    themePalette: list(raw.themePalette, sanitizePaletteColor),
    coverEmoji: str(raw.coverEmoji),
    coverColor: str(raw.coverColor),
    status: oneOf(raw.status, ['planning', 'confirmed', 'celebrated'] as const, 'planning'),
    guests: list(raw.guests, sanitizeGuest),
    expenses: list(raw.expenses, sanitizeExpense),
    tasks: list(raw.tasks, sanitizeTask),
    vendors: list(raw.vendors, sanitizeVendor),
    timeline: list(raw.timeline, sanitizeTimelineItem),
    notes: str(raw.notes),
  };

  if (isRecord(raw.invitationDraft)) {
    event.invitationDraft = sanitizeInvitation(raw.invitationDraft);
  }
  if (isRecord(raw.themeDetails)) {
    event.themeDetails = {
      musicVibe: optStr(raw.themeDetails.musicVibe),
      attire: optStr(raw.themeDetails.attire),
      signatureTouch: optStr(raw.themeDetails.signatureTouch),
    };
  }
  if (menu) {
    event.menuIdeas = {
      starters: stringList(menu.starters),
      mains: stringList(menu.mains),
      desserts: stringList(menu.desserts),
      signatureDrinks: stringList(menu.signatureDrinks),
    };
  }
  if (Array.isArray(raw.activityIdeas)) {
    event.activityIdeas = list(raw.activityIdeas, (a) =>
      typeof a.title === 'string'
        ? {
            title: str(a.title),
            duration: str(a.duration),
            description: str(a.description),
            materialsNeeded: optStr(a.materialsNeeded),
          }
        : null
    );
  }
  return event;
}

/** Sanitises a list of untrusted events, dropping invalid ones and duplicate ids. */
export function sanitizeEvents(raw: unknown): EventData[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const events: EventData[] = [];
  for (const candidate of raw.slice(0, MAX_EVENTS)) {
    const event = sanitizeEvent(candidate);
    if (event && !seen.has(event.id)) {
      seen.add(event.id);
      events.push(event);
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)
  );
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Parses JSON without throwing; returns `undefined` for invalid input. */
function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Reads the raw event list from the current envelope, migrating the v1 key if present. */
function readStoredEvents(): unknown {
  const current = safeGetItem(STORAGE_KEY);
  if (current !== null) {
    const parsed = safeParse(current);
    if (isRecord(parsed) && typeof (parsed as Partial<StorageEnvelope>).version === 'number') {
      return (parsed as unknown as StorageEnvelope).events;
    }
    return undefined;
  }

  const legacy = safeGetItem(LEGACY_STORAGE_KEY_V1);
  if (legacy !== null) {
    // v1 stored a bare array; it is re-saved in the v2 envelope on the next write.
    const parsed = safeParse(legacy);
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
    } catch {
      /* storage unavailable — nothing to clean up */
    }
    return parsed;
  }
  return undefined;
}

/**
 * Loads saved events, falling back to the bundled samples when storage is
 * empty, unreadable, corrupted or contains no valid events.
 */
export function loadSavedEvents(): EventData[] {
  const events = sanitizeEvents(readStoredEvents());
  return events.length > 0 ? events : SAMPLE_EVENTS;
}

/** Persists events. Never throws; returns why it failed so callers can inform the user. */
export function saveEventsToStorage(events: readonly EventData[]): SaveResult {
  const envelope: StorageEnvelope = { version: STORAGE_VERSION, events };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return { ok: true };
  } catch (err) {
    const reason: SaveFailureReason = isQuotaError(err) ? 'quota' : 'unavailable';
    console.warn(`Could not save events to localStorage (${reason}).`, err);
    return { ok: false, reason };
  }
}

export function getActiveEventId(events: readonly EventData[]): string {
  const saved = safeGetItem(ACTIVE_EVENT_KEY);
  if (saved && events.some((e) => e.id === saved)) return saved;
  return events[0]?.id ?? '';
}

export function saveActiveEventId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_EVENT_KEY, id);
  } catch {
    /* Non-critical: falls back to the first event on next load. */
  }
}
