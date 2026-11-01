import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EventData } from '../../types';
import { TasksTab } from './TasksTab';
import { TimelineTab } from './TimelineTab';
import { VendorsTab } from './VendorsTab';

vi.mock('../../utils/confetti', () => ({ triggerFestiveConfetti: vi.fn(), triggerMiniConfetti: vi.fn() }));

const baseEvent = {
  id: 'e1',
  title: 'Gala',
  date: '2099-01-01',
  guests: [],
  expenses: [],
  tasks: [],
  vendors: [],
  timeline: [],
} as unknown as EventData;

describe('TasksTab', () => {
  it('exposes completion as a checkbox and flags overdue tasks in text', async () => {
    const user = userEvent.setup();
    const onUpdateEvent = vi.fn();
    const event = {
      ...baseEvent,
      tasks: [
        { id: 't1', title: 'Book venue', phase: '1_month_before', dueDate: '2000-01-01', completed: false, priority: 'high', assignedTo: 'Host' },
      ],
    } as EventData;
    render(<TasksTab event={event} onUpdateEvent={onUpdateEvent} onSwitchTab={() => {}} />);

    expect(screen.getByText(/overdue · was due/i)).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', { name: /book venue/i });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await user.click(checkbox);
    expect(onUpdateEvent.mock.calls[0][0].tasks[0].completed).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent(/book venue marked complete/i);
  });
});

describe('TimelineTab', () => {
  it('renders milestones in chronological order', () => {
    const event = {
      ...baseEvent,
      timeline: [
        { id: 'a', time: '7:45 PM', title: 'Toast', description: '', category: 'toast', assignedTo: 'Host' },
        { id: 'b', time: '17:00', title: 'Arrival', description: '', category: 'arrival', assignedTo: 'Host' },
      ],
    } as EventData;
    render(<TimelineTab event={event} onUpdateEvent={() => {}} onSwitchTab={() => {}} />);
    const items = within(screen.getByRole('list', { name: /day-of schedule/i })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Arrival');
    expect(items[1]).toHaveTextContent('Toast');
    expect(screen.getByRole('button', { name: /live mode/i })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('VendorsTab', () => {
  const vendor = {
    id: 'v1',
    name: 'Bloom Co',
    category: 'florist',
    contactPerson: '',
    phone: '',
    email: '',
    website: 'javascript:alert(1)',
    costQuote: 800,
    status: 'booked',
    notes: '',
  };

  it('never renders unsafe website links and adds booked quotes to the budget', async () => {
    const user = userEvent.setup();
    const onUpdateEvent = vi.fn();
    render(<VendorsTab event={{ ...baseEvent, vendors: [vendor] } as EventData} onUpdateEvent={onUpdateEvent} />);

    expect(screen.queryByRole('link', { name: /website/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add quote to budget/i }));
    expect(onUpdateEvent.mock.calls[0][0].expenses[0]).toMatchObject({
      vendorName: 'Bloom Co',
      category: 'decor',
      budgeted: 800,
      actual: 0,
      status: 'planned',
    });
  });

  it('shows "In budget" once an expense for the vendor exists', () => {
    const event = {
      ...baseEvent,
      vendors: [vendor],
      expenses: [{ id: 'x', name: 'Flowers', category: 'decor', budgeted: 800, actual: 0, status: 'planned', vendorName: 'bloom co' }],
    } as EventData;
    render(<VendorsTab event={event} onUpdateEvent={() => {}} />);
    expect(screen.getByText(/in budget/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add quote to budget/i })).not.toBeInTheDocument();
  });
});
