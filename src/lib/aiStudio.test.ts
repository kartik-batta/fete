import type { AITheme } from '../types';
import {
  applyThemeToEvent,
  buildActivityMilestones,
  buildDecorTasks,
  buildIdeasRequest,
  buildInvitationRequest,
  buildThemesRequest,
  buildTimelineRequest,
  DEFAULT_THEME_BUDGET,
  eventTimeWindow,
  mergeTimeline,
  updateAt,
} from './aiStudio';
import { makeEvent, makeGuest, makeMilestone } from './__fixtures__/event';

const guests = [
  makeGuest({ id: 'a', plusOnes: 1 }),
  makeGuest({ id: 'b', rsvp: 'declined' }),
];

describe('request builders', () => {
  it('builds a themes request with headcount and budget fallback', () => {
    expect(buildThemesRequest(makeEvent({ guests, totalBudget: 0 }), 'Disco', 'Gold')).toEqual({
      occasion: 'birthday',
      guestCount: 2,
      budget: DEFAULT_THEME_BUDGET,
      vibe: 'Disco',
      notes: 'Gold',
    });
  });

  it('builds an invitation request preferring the venue name', () => {
    const opts = { tone: 'playful', extraDetails: 'Bring swimwear', type: 'thank_you' } as const;
    const req = buildInvitationRequest(makeEvent(), opts);
    expect(req).toMatchObject({
      eventTitle: "Maya's 30th",
      location: 'The Grove',
      theme: 'Sunset Botanicals',
      tone: 'playful',
      type: 'thank_you',
    });
    expect(buildInvitationRequest(makeEvent({ venueName: '' }), opts).location).toBe('Napa Valley');
  });

  it('builds a timeline request with a vibe fallback', () => {
    const req = buildTimelineRequest(makeEvent({ themeTitle: '' }), {
      startTime: '3 PM',
      endTime: '9 PM',
      keyMoments: 'Toasts',
    });
    expect(req).toMatchObject({ vibes: 'Celebratory', guestCount: 30, startTime: '3 PM' });
  });

  it('builds an ideas request falling back to the typed vibe', () => {
    const opts = { fallbackTheme: 'Retro Disco', dietary: 'Vegan', ageGroup: 'Kids' };
    expect(buildIdeasRequest(makeEvent({ themeTitle: '' }), opts).theme).toBe('Retro Disco');
    expect(buildIdeasRequest(makeEvent(), opts).theme).toBe('Sunset Botanicals');
  });
});

describe('applyThemeToEvent', () => {
  it('copies visual and non-visual theme details onto the event', () => {
    const theme: AITheme = {
      id: 't1',
      title: 'Velvet Midnight',
      tagline: 'Indigo and gold',
      palette: [{ name: 'Navy', hex: '#2B2D42' }],
      decorIdeas: [],
      musicVibe: 'Neo-soul',
      attirePrompt: 'Cocktail',
      signatureTouch: 'Wish board',
    };
    const updated = applyThemeToEvent(makeEvent(), theme);
    expect(updated).toMatchObject({
      themeTitle: 'Velvet Midnight',
      themeDescription: 'Indigo and gold',
      themePalette: theme.palette,
      themeDetails: { musicVibe: 'Neo-soul', attire: 'Cocktail', signatureTouch: 'Wish board' },
    });
  });
});

describe('buildDecorTasks', () => {
  it('creates 1-month-before tasks due 30 days ahead with unique ids', () => {
    const event = makeEvent({
      tasks: [
        {
          id: 't-decor-5-0',
          title: 'Existing',
          phase: 'day_of',
          dueDate: '',
          completed: false,
          priority: 'low',
          assignedTo: '',
        },
      ],
    });
    const tasks = buildDecorTasks(['Garland', 'Candles'], event, 5);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      title: 'Source décor: Garland',
      phase: '1_month_before',
      dueDate: '2026-10-22',
      assignedTo: 'Maya',
      completed: false,
    });
    expect(tasks.map((t) => t.id)).toEqual(['t-decor-5-0-1', 't-decor-5-1']);
  });

  it('leaves the due date empty when the event has no date', () => {
    expect(buildDecorTasks(['X'], makeEvent({ date: '', hostName: '' }), 1)[0]).toMatchObject({
      dueDate: '',
      assignedTo: 'Host',
    });
  });
});

describe('eventTimeWindow', () => {
  it('uses the event start and a six-hour duration', () => {
    expect(eventTimeWindow('4:00 PM')).toEqual({ start: 960, end: 1320 });
  });

  it('falls back to 3 PM for an unparseable time', () => {
    expect(eventTimeWindow('sunset').start).toBe(900);
  });
});

describe('buildActivityMilestones', () => {
  it('spreads real times across the event window', () => {
    const milestones = buildActivityMilestones(
      [
        { title: 'Trivia', duration: '20 mins', description: 'Quiz', materialsNeeded: 'Cards' },
        { title: 'Toast', duration: '', description: 'Cheers' },
      ],
      makeEvent({ time: '4:00 PM', timeline: [makeMilestone({ id: 'tl-act-9-0' })] }),
      9,
    );
    expect(milestones.map((m) => m.time)).toEqual(['06:00 PM', '08:00 PM']);
    expect(milestones[0]).toMatchObject({
      id: 'tl-act-9-0-1',
      category: 'activity',
      assignedTo: 'Host / MC',
      tips: 'Cards',
    });
    expect(milestones[1].id).toBe('tl-act-9-1');
  });
});

describe('mergeTimeline', () => {
  const existing = [makeMilestone({ id: 'tl-1' }), makeMilestone({ id: 'tl-2' })];
  const suggested = [makeMilestone({ id: 'tl-1', title: 'AI' })];

  it('appends re-identified suggestions without id collisions', () => {
    const merged = mergeTimeline(existing, suggested, 'append', 7);
    expect(merged).toHaveLength(3);
    expect(new Set(merged.map((m) => m.id)).size).toBe(3);
    expect(merged[2]).toMatchObject({ id: 'tl-ai-7-0', title: 'AI' });
  });

  it('replaces the timeline with re-identified suggestions', () => {
    expect(mergeTimeline(existing, suggested, 'replace', 7)).toEqual([
      { ...suggested[0], id: 'tl-ai-7-0' },
    ]);
  });
});

describe('updateAt', () => {
  it('patches only the targeted index', () => {
    const list = [{ a: 1 }, { a: 2 }];
    expect(updateAt(list, 1, { a: 9 })).toEqual([{ a: 1 }, { a: 9 }]);
    expect(list[1].a).toBe(2);
  });
});
