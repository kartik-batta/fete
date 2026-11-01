import { afterEach, describe, expect, it, vi } from 'vitest';
import { SAMPLE_EVENTS } from '../data/sampleEvents';
import {
  ACTIVE_EVENT_KEY,
  LEGACY_STORAGE_KEY_V1,
  STORAGE_KEY,
  STORAGE_VERSION,
  getActiveEventId,
  loadSavedEvents,
  sanitizeEvent,
  sanitizeEvents,
  saveActiveEventId,
  saveEventsToStorage,
} from './storage';

const sample = SAMPLE_EVENTS[0];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadSavedEvents', () => {
  it('falls back to sample events when storage is empty', () => {
    expect(loadSavedEvents()).toBe(SAMPLE_EVENTS);
  });

  it('round-trips saved events through the versioned envelope', () => {
    const custom = { ...sample, id: 'custom', title: 'My Party' };
    expect(saveEventsToStorage([custom])).toEqual({ ok: true });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.version).toBe(STORAGE_VERSION);
    expect(loadSavedEvents()).toEqual([custom]);
  });

  it('keeps every sample event intact after a save/load cycle', () => {
    saveEventsToStorage(SAMPLE_EVENTS);
    expect(loadSavedEvents()).toEqual(SAMPLE_EVENTS);
  });

  it('migrates the legacy v1 bare-array key', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY_V1, JSON.stringify([{ ...sample, id: 'legacy' }]));
    const events = loadSavedEvents();
    expect(events.map((e) => e.id)).toEqual(['legacy']);
    expect(localStorage.getItem(LEGACY_STORAGE_KEY_V1)).toBeNull();
  });

  it('falls back on corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSavedEvents()).toBe(SAMPLE_EVENTS);
  });

  it('falls back when the envelope is the wrong shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([sample]));
    expect(loadSavedEvents()).toBe(SAMPLE_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, events: 'nope' }));
    expect(loadSavedEvents()).toBe(SAMPLE_EVENTS);
  });

  it('falls back when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadSavedEvents()).toBe(SAMPLE_EVENTS);
  });
});

describe('sanitizeEvent (tampered data)', () => {
  it('rejects non-objects and records without id/title', () => {
    expect(sanitizeEvent(null)).toBeNull();
    expect(sanitizeEvent('event')).toBeNull();
    expect(sanitizeEvent({ title: 'No id' })).toBeNull();
    expect(sanitizeEvent({ id: 'x', title: 42 })).toBeNull();
  });

  it('fills defaults for missing fields', () => {
    const event = sanitizeEvent({ id: 'x', title: 'Minimal' })!;
    expect(event.guests).toEqual([]);
    expect(event.totalBudget).toBe(0);
    expect(event.occasion).toBe('other');
    expect(event.status).toBe('planning');
  });

  it('coerces bad enums, numbers and drops invalid nested items', () => {
    const event = sanitizeEvent({
      ...sample,
      occasion: '<script>',
      totalBudget: -500,
      guests: [
        { id: 'g1', name: 'Ok', rsvp: 'maybe', plusOnes: 'lots', group: 'enemies' },
        { name: 'missing id' },
        'not an object',
      ],
      expenses: [{ id: 'x1', budgeted: Infinity, actual: '100', category: 'hax', status: 'stolen' }],
    })!;
    expect(event.occasion).toBe('other');
    expect(event.totalBudget).toBe(0);
    expect(event.guests).toHaveLength(1);
    expect(event.guests[0]).toMatchObject({ rsvp: 'pending', plusOnes: 0, group: 'other' });
    expect(event.expenses[0]).toMatchObject({ budgeted: 0, actual: 0, category: 'other', status: 'planned' });
  });

  it('drops palette colours that are not hex codes (no CSS injection via style)', () => {
    const event = sanitizeEvent({
      ...sample,
      themePalette: [
        { name: 'Good', hex: '#ABCDEF' },
        { name: 'Bad', hex: 'red; background:url(https://evil)' },
      ],
    })!;
    expect(event.themePalette).toEqual([{ name: 'Good', hex: '#ABCDEF' }]);
  });

  it('rebuilds AI blobs from strings so objects cannot reach the UI', () => {
    const event = sanitizeEvent({
      ...sample,
      invitationDraft: { headline: { evil: true }, body: 'Hi', detailsBlock: 'x', tone: 'rude' },
      menuIdeas: { starters: ['Soup', 7, null], mains: 'steak' },
      themeDetails: { musicVibe: 'Jazz', attire: ['array'] },
    })!;
    expect(event.invitationDraft).toMatchObject({ headline: '', body: 'Hi', tone: 'warm' });
    expect(event.invitationDraft!.detailsBlock).toEqual({ when: '', where: '', rsvpNote: '', dressCode: undefined });
    expect(event.menuIdeas).toEqual({ starters: ['Soup'], mains: [], desserts: [], signatureDrinks: [] });
    expect(event.themeDetails).toEqual({ musicVibe: 'Jazz', attire: undefined, signatureTouch: undefined });
  });

  it('truncates oversized strings', () => {
    const event = sanitizeEvent({ id: 'x', title: 'a'.repeat(50_000) })!;
    expect(event.title.length).toBe(10_000);
  });

  it('sanitizeEvents removes duplicates and invalid entries', () => {
    const events = sanitizeEvents([sample, { ...sample }, { bogus: true }, 5]);
    expect(events.map((e) => e.id)).toEqual([sample.id]);
    expect(sanitizeEvents({ not: 'an array' })).toEqual([]);
  });
});

describe('saveEventsToStorage', () => {
  it('reports quota errors instead of throwing', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(saveEventsToStorage([sample])).toEqual({ ok: false, reason: 'quota' });
  });

  it('reports other storage failures as unavailable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('disabled');
    });
    expect(saveEventsToStorage([sample])).toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('active event id', () => {
  it('returns the saved id only when it exists in the list', () => {
    saveActiveEventId(SAMPLE_EVENTS[1].id);
    expect(getActiveEventId(SAMPLE_EVENTS)).toBe(SAMPLE_EVENTS[1].id);
    localStorage.setItem(ACTIVE_EVENT_KEY, 'deleted-event');
    expect(getActiveEventId(SAMPLE_EVENTS)).toBe(SAMPLE_EVENTS[0].id);
    expect(getActiveEventId([])).toBe('');
  });

  it('swallows write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('disabled');
    });
    expect(() => saveActiveEventId('x')).not.toThrow();
  });
});
