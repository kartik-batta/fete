import type { EventData, Guest, TimelineEvent } from '../../types';

/** Builds a guest with sensible defaults for tests. */
export function makeGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    id: 'g-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '',
    rsvp: 'attending',
    plusOnes: 0,
    dietary: '',
    group: 'friends',
    ...overrides,
  };
}

/** Builds a timeline milestone with sensible defaults for tests. */
export function makeMilestone(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: 'tl-1',
    time: '04:00 PM',
    title: 'Doors open',
    description: 'Welcome drinks',
    category: 'arrival',
    assignedTo: 'Host',
    ...overrides,
  };
}

/** Builds a minimal, valid event for tests. */
export function makeEvent(overrides: Partial<EventData> = {}): EventData {
  return {
    id: 'evt-1',
    title: "Maya's 30th",
    occasion: 'birthday',
    date: '2026-11-21',
    time: '4:00 PM',
    location: 'Napa Valley',
    venueName: 'The Grove',
    hostName: 'Maya',
    hostEmail: 'maya@example.com',
    totalBudget: 4500,
    themeTitle: 'Sunset Botanicals',
    themeDescription: '',
    themePalette: [],
    coverEmoji: '🌸',
    coverColor: '',
    status: 'planning',
    guests: [],
    expenses: [],
    tasks: [],
    vendors: [],
    timeline: [],
    notes: '',
    ...overrides,
  };
}
