import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiStudioTab } from './AiStudioTab';
import { makeEvent, makeGuest, makeMilestone } from '../../lib/__fixtures__/event';
import type { EventData } from '../../types';

vi.mock('../../utils/confetti', () => ({
  triggerFestiveConfetti: vi.fn(),
  triggerMiniConfetti: vi.fn(),
}));

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const TIMELINE_BODY = {
  success: true,
  timeline: [
    { id: 'tl-1', time: '02:00 PM', title: 'Doors Open', description: 'Drinks', category: 'arrival', assignedTo: 'Greeter' },
  ],
};

function setup(overrides: Partial<EventData> = {}) {
  const event = makeEvent({
    guests: [
      makeGuest({ id: 'g1', name: 'Elena', email: 'elena@example.com' }),
      makeGuest({ id: 'g2', name: 'Bob', email: 'bob@example.com', rsvp: 'declined' }),
    ],
    timeline: [makeMilestone({ id: 'tl-1' })],
    ...overrides,
  });
  const onUpdateEvent = vi.fn();
  const onSwitchTab = vi.fn();
  render(<AiStudioTab event={event} onUpdateEvent={onUpdateEvent} onSwitchTab={onSwitchTab} />);
  return { event, onUpdateEvent, onSwitchTab, user: userEvent.setup() };
}

beforeEach(() => {
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AiStudioTab', () => {
  it('renders the header and the themes tool by default', () => {
    setup();
    expect(screen.getByRole('heading', { name: /Creative Ideas Tailored/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Party Themes/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Desired Vibe / Style')).toHaveValue('Warm, festive, chic and botanical');
  });

  it('switches tools while keeping inactive panels mounted', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Special Notes or Favorite Elements'), 'citrus');
    await user.click(screen.getByRole('tab', { name: /Day-of Timeline/ }));
    expect(screen.getByRole('tabpanel', { name: /Day-of Timeline/ })).toBeVisible();
    expect(screen.getByLabelText('Expected Headcount')).toHaveValue(1);
    await user.click(screen.getByRole('tab', { name: /Party Themes/ }));
    expect(screen.getByLabelText('Special Notes or Favorite Elements')).toHaveValue('citrus');
  });

  it('generates themes via the API and shows a card per concept', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        themes: [{ id: 't1', title: 'Golden Hour', tagline: 'Glow', palette: [], decorIdeas: ['Disco balls'] }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { user, onUpdateEvent } = setup();

    await user.click(screen.getByRole('button', { name: /Generate 3 Theme Concepts/ }));
    expect(await screen.findByRole('heading', { name: 'Golden Hour' })).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ occasion: 'birthday', guestCount: 1 });

    await user.click(screen.getByRole('button', { name: /Add Décor to Checklist/ }));
    const updated: EventData = onUpdateEvent.mock.calls[0][0];
    expect(updated.tasks[0]).toMatchObject({ title: 'Source décor: Disco balls', dueDate: '2026-10-22' });
  });

  it('shows an accessible error when generation fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Slow down' }, 429)));
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Generate 3 Theme Concepts/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Slow down');
  });

  it('appends a generated timeline with fresh ids and switches tab', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(TIMELINE_BODY)));
    const { user, onUpdateEvent, onSwitchTab } = setup();
    await user.click(screen.getByRole('tab', { name: /Day-of Timeline/ }));
    await user.click(screen.getByRole('button', { name: /Generate Day-of Run of Show/ }));
    await user.click(await screen.findByRole('button', { name: 'Append to Existing' }));

    const updated: EventData = onUpdateEvent.mock.calls[0][0];
    expect(updated.timeline).toHaveLength(2);
    expect(new Set(updated.timeline.map((t) => t.id)).size).toBe(2);
    expect(onSwitchTab).toHaveBeenCalledWith('timeline');
  });

  describe('invitation studio', () => {
    it('personalises the preview, switches card style and builds a BCC mailto', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('tab', { name: /Invitations/ }));
      const panel = screen.getByRole('tabpanel', { name: /Invitations/ });

      await user.selectOptions(within(panel).getByLabelText('Personalise preview'), 'g1');
      expect(within(panel).getByText('Dear Elena,')).toBeInTheDocument();

      await user.click(within(panel).getByRole('radio', { name: /Midnight/ }));
      expect(within(panel).getByRole('radio', { name: /Midnight/ })).toHaveAttribute('aria-checked', 'true');

      const href = within(panel).getByRole('link', { name: /Email Guests/ }).getAttribute('href') ?? '';
      expect(href.startsWith('mailto:?bcc=elena%40example.com&subject=')).toBe(true);
      expect(href).not.toContain('bob');
    });

    it('prints and saves the draft to the event', async () => {
      const print = vi.spyOn(window, 'print').mockImplementation(() => {});
      const { user, onUpdateEvent } = setup();
      await user.click(screen.getByRole('tab', { name: /Invitations/ }));
      await user.click(screen.getByRole('button', { name: /Print \/ Save as PDF/ }));
      expect(print).toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /Save to Event/ }));
      await waitFor(() => expect(onUpdateEvent).toHaveBeenCalled());
      expect(onUpdateEvent.mock.calls[0][0].invitationDraft.headline).toBe("Celebrate Maya's 30th");
    });

    it('disables emailing when no guest has an address', async () => {
      const { user } = setup({ guests: [] });
      await user.click(screen.getByRole('tab', { name: /Invitations/ }));
      expect(screen.getByRole('button', { name: /Email Guests/ })).toBeDisabled();
    });
  });
});
