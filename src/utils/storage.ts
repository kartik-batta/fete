import { EventData } from '../types';
import { SAMPLE_EVENTS } from '../data/sampleEvents';

const STORAGE_KEY = 'fete_celebration_events_v1';
const ACTIVE_EVENT_KEY = 'fete_active_event_id';

export function loadSavedEvents(): EventData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EVENTS));
      return SAMPLE_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_EVENTS;
  } catch (err) {
    console.error('Failed to load events from storage:', err);
    return SAMPLE_EVENTS;
  }
}

export function saveEventsToStorage(events: EventData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to storage:', err);
  }
}

export function getActiveEventId(events: EventData[]): string {
  try {
    const saved = localStorage.getItem(ACTIVE_EVENT_KEY);
    if (saved && events.some((e) => e.id === saved)) {
      return saved;
    }
  } catch (err) {
    console.error('Failed to load active event ID:', err);
  }
  return events[0]?.id || '';
}

export function saveActiveEventId(id: string) {
  try {
    localStorage.setItem(ACTIVE_EVENT_KEY, id);
  } catch (err) {
    console.error('Failed to save active event ID:', err);
  }
}
