import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EventData } from '../types';
import { Header } from './Header';

vi.mock('../utils/confetti', () => ({ triggerFestiveConfetti: vi.fn() }));

const makeEvent = (id: string, title: string): EventData =>
  ({
    id,
    title,
    occasion: 'birthday',
    date: '2026-12-01',
    coverEmoji: '🎂',
    totalBudget: 1000,
    guests: [],
    tasks: [],
    vendors: [],
    timeline: [],
    expenses: [],
  }) as unknown as EventData;

const events = [makeEvent('a', 'Maya’s 30th'), makeEvent('b', 'Office Gala')];

function Harness(props: { onSelectEvent?: (id: string) => void; onDeleteEvent?: (id: string) => void }) {
  const [tab, setTab] = useState('overview');
  return (
    <Header
      events={events}
      activeEvent={events[0]}
      onSelectEvent={props.onSelectEvent ?? (() => {})}
      onOpenCreateModal={() => {}}
      activeTab={tab}
      onSelectTab={setTab}
      onDeleteEvent={props.onDeleteEvent}
    />
  );
}

describe('Header tablist', () => {
  it('renders an ARIA tablist with roving tabindex and panel ids', () => {
    render(<Harness />);
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs).toHaveLength(7);
    const overview = screen.getByRole('tab', { name: /overview/i });
    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(overview).toHaveAttribute('id', 'tab-overview');
    expect(overview).toHaveAttribute('aria-controls', 'panel-overview');
    expect(overview).toHaveAttribute('tabindex', '0');
    expect(tabs.filter((t) => t.getAttribute('tabindex') === '0')).toHaveLength(1);
  });

  it('moves focus and selection with arrow keys, Home and End', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    screen.getByRole('tab', { name: /overview/i }).focus();

    await user.keyboard('{ArrowRight}');
    const guests = screen.getByRole('tab', { name: /guests/i });
    expect(guests).toHaveFocus();
    expect(guests).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /ai studio/i })).toHaveFocus();

    await user.keyboard('{ArrowRight}'); // wraps
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveFocus();

    await user.keyboard('{ArrowLeft}'); // wraps back
    expect(screen.getByRole('tab', { name: /ai studio/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('provides a skip link to the main content', () => {
    render(<Harness />);
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main-content');
  });
});

describe('Header event switcher', () => {
  it('is keyboard operable and closes on Escape, returning focus', async () => {
    const user = userEvent.setup();
    const onSelectEvent = vi.fn();
    render(<Harness onSelectEvent={onSelectEvent} />);
    const trigger = screen.getByRole('button', { name: /current celebration/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitemradio', { name: /maya/i })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: /office gala/i })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectEvent).toHaveBeenCalledWith('b');
  });

  it('offers delete only when onDeleteEvent is provided, after confirmation', async () => {
    const user = userEvent.setup();
    const onDeleteEvent = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { unmount } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: /current celebration/i }));
    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument();
    unmount();

    render(<Harness onDeleteEvent={onDeleteEvent} />);
    await user.click(screen.getByRole('button', { name: /current celebration/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete this celebration/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(onDeleteEvent).toHaveBeenCalledWith('a');
  });
});
