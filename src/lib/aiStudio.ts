/**
 * Pure helpers that translate between event data, AI request payloads and
 * AI output. Nothing here touches React, the network or the DOM, which keeps
 * the AI Studio components thin and makes this logic trivially testable.
 */
import type {
  ActivityIdea,
  AITheme,
  ChecklistTask,
  EventData,
  IdeasRequest,
  InvitationMessageType,
  InvitationRequest,
  InvitationTone,
  ThemesRequest,
  TimelineEvent,
  TimelineRequest,
} from '../types';
import { expectedHeadcount } from './guests';
import { assignUniqueIds } from './ids';
import { parseClockTime, shiftIsoDate, spreadTimes } from './time';

/** Budget assumed for theme suggestions when none is set. */
export const DEFAULT_THEME_BUDGET = 2500;
/** Start time assumed when the event has none (or it is unparseable). */
export const DEFAULT_EVENT_START = '03:00 PM';
/** Celebration length assumed when only a start time is known. */
export const DEFAULT_EVENT_DURATION_MINUTES = 6 * 60;
/** Décor tasks land in the "1 month before" phase, so they are due 30 days out. */
export const DECOR_LEAD_DAYS = 30;

/** How generated milestones are merged into the existing schedule. */
export type TimelineMergeMode = 'replace' | 'append';

/** Builds the theme-generation request from the event and the user's prompt. */
export function buildThemesRequest(event: EventData, vibe: string, notes: string): ThemesRequest {
  return {
    occasion: event.occasion,
    guestCount: expectedHeadcount(event.guests),
    budget: event.totalBudget || DEFAULT_THEME_BUDGET,
    vibe,
    notes,
  };
}

/** Builds the invitation-generation request. */
export function buildInvitationRequest(
  event: EventData,
  options: { tone: InvitationTone; extraDetails: string; type: InvitationMessageType },
): InvitationRequest {
  return {
    eventTitle: event.title,
    occasion: event.occasion,
    hostName: event.hostName,
    date: event.date,
    time: event.time,
    location: event.venueName || event.location,
    theme: event.themeTitle,
    ...options,
  };
}

/** Builds the timeline-generation request. */
export function buildTimelineRequest(
  event: EventData,
  options: { startTime: string; endTime: string; keyMoments: string },
): TimelineRequest {
  return {
    eventTitle: event.title,
    occasion: event.occasion,
    guestCount: expectedHeadcount(event.guests),
    vibes: event.themeTitle || 'Celebratory',
    ...options,
  };
}

/**
 * Builds the ideas-generation request. Falls back to the user's typed vibe
 * when the event has no theme applied yet.
 */
export function buildIdeasRequest(
  event: EventData,
  options: { fallbackTheme: string; dietary: string; ageGroup: string },
): IdeasRequest {
  return {
    occasion: event.occasion,
    guestCount: expectedHeadcount(event.guests),
    budget: event.totalBudget,
    theme: event.themeTitle || options.fallbackTheme,
    dietary: options.dietary,
    ageGroup: options.ageGroup,
  };
}

/**
 * Returns a copy of the event with the (possibly customised) theme applied,
 * including its playlist, attire and signature-touch guidance.
 */
export function applyThemeToEvent(event: EventData, theme: AITheme): EventData {
  return {
    ...event,
    themeTitle: theme.title,
    themeDescription: theme.tagline,
    themePalette: theme.palette,
    themeDetails: {
      musicVibe: theme.musicVibe,
      attire: theme.attirePrompt,
      signatureTouch: theme.signatureTouch,
    },
  };
}

/**
 * Converts décor ideas into checklist tasks in the "1 month before" phase,
 * due {@link DECOR_LEAD_DAYS} days before the event, with ids unique against
 * the event's existing tasks. `now` is injectable for deterministic tests.
 */
export function buildDecorTasks(
  decorItems: readonly string[],
  event: Pick<EventData, 'date' | 'hostName' | 'tasks'>,
  now: number = Date.now(),
): ChecklistTask[] {
  const tasks: ChecklistTask[] = decorItems.map((item) => ({
    id: '',
    title: `Source décor: ${item}`,
    phase: '1_month_before',
    dueDate: event.date ? shiftIsoDate(event.date, -DECOR_LEAD_DAYS) : '',
    completed: false,
    priority: 'medium',
    assignedTo: event.hostName || 'Host',
    notes: 'Added from AI Celebration Stylist',
  }));
  return assignUniqueIds(tasks, 't-decor', event.tasks.map((t) => t.id), now);
}

/**
 * Resolves the event's celebration window in minutes after midnight, using
 * the event start time (or a default) and a default duration.
 */
export function eventTimeWindow(eventTime: string): { start: number; end: number } {
  const start = parseClockTime(eventTime) ?? (parseClockTime(DEFAULT_EVENT_START) as number);
  return { start, end: start + DEFAULT_EVENT_DURATION_MINUTES };
}

/**
 * Converts suggested activities into run-of-show milestones whose times are
 * spread evenly across the event window, with ids unique against the event's
 * existing timeline.
 */
export function buildActivityMilestones(
  activities: readonly ActivityIdea[],
  event: Pick<EventData, 'time' | 'timeline'>,
  now: number = Date.now(),
): TimelineEvent[] {
  const { start, end } = eventTimeWindow(event.time);
  const times = spreadTimes(start, end, activities.length);
  const milestones: TimelineEvent[] = activities.map((act, idx) => ({
    id: '',
    time: times[idx],
    title: act.title,
    description: act.description,
    category: 'activity',
    assignedTo: 'Host / MC',
    tips: act.materialsNeeded,
  }));
  return assignUniqueIds(milestones, 'tl-act', event.timeline.map((t) => t.id), now);
}

/**
 * Replaces or appends generated milestones to the event's existing timeline.
 * Generated items are always re-identified so they never collide with
 * existing ones (AI/fallback output reuses ids like `tl-1`).
 */
export function mergeTimeline(
  existing: readonly TimelineEvent[],
  suggested: readonly TimelineEvent[],
  mode: TimelineMergeMode,
  now: number = Date.now(),
): TimelineEvent[] {
  if (mode === 'replace') return assignUniqueIds(suggested, 'tl-ai', [], now);
  const fresh = assignUniqueIds(suggested, 'tl-ai', existing.map((t) => t.id), now);
  return [...existing, ...fresh];
}

/** Immutably patches one item in a list by index. */
export function updateAt<T>(items: readonly T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}
