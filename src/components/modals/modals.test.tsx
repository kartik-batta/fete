import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EventData } from '../../types';
import { GuestModal } from './GuestModal';
import { VendorModal } from './VendorModal';
import { ExpenseModal } from './ExpenseModal';
import { CreateOrEditEventModal } from './CreateOrEditEventModal';

vi.mock('../../utils/confetti', () => ({
  triggerFestiveConfetti: vi.fn(),
  triggerMiniConfetti: vi.fn(),
}));

describe('GuestModal', () => {
  it('labels every control and marks the name as required', () => {
    render(<GuestModal isOpen onClose={() => {}} onSave={() => {}} />);
    const name = screen.getByLabelText(/guest name/i);
    expect(name).toBeRequired();
    expect(name).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
    expect(screen.getByRole('group', { name: /rsvp status/i })).toBeInTheDocument();
  });

  it('shows a linked inline error, focuses the field and does not save when name is blank', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<GuestModal isOpen onClose={() => {}} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Add Guest' }));

    const name = screen.getByLabelText(/guest name/i);
    expect(onSave).not.toHaveBeenCalled();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription(/enter the guest’s name/i);
    expect(name).toHaveFocus();

    await user.type(name, 'E');
    expect(name).not.toHaveAttribute('aria-invalid');
  });

  it('rejects an invalid email and saves trimmed, sanitised values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<GuestModal isOpen onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText(/guest name/i), '   Elena Rostova   ');
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Add Guest' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/email address/i)).toHaveAccessibleDescription(/valid email/i);

    await user.clear(screen.getByLabelText(/email address/i));
    await user.type(screen.getByLabelText(/email address/i), 'elena@example.com');
    await user.click(screen.getByRole('radio', { name: /attending/i }));
    await user.click(screen.getByRole('button', { name: 'Add Guest' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Elena Rostova', email: 'elena@example.com', rsvp: 'attending' }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});

describe('VendorModal', () => {
  it('refuses non-http(s) websites', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VendorModal isOpen onClose={() => {}} onSave={onSave} />);
    await user.type(screen.getByLabelText(/business name/i), 'Bloom Co');
    await user.type(screen.getByLabelText(/website/i), 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: 'Add Vendor' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/website/i)).toHaveAttribute('aria-invalid', 'true');

    await user.clear(screen.getByLabelText(/website/i));
    await user.type(screen.getByLabelText(/website/i), 'bloom.example');
    await user.click(screen.getByRole('button', { name: 'Add Vendor' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ website: 'https://bloom.example/' }));
  });
});

describe('ExpenseModal', () => {
  it('accepts cent amounts', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ExpenseModal isOpen onClose={() => {}} onSave={onSave} />);
    await user.type(screen.getByLabelText(/expense item name/i), 'Bud vases');
    const budgeted = screen.getByLabelText(/budgeted amount/i);
    await user.clear(budgeted);
    await user.type(budgeted, '149.99');
    await user.click(screen.getByRole('button', { name: 'Add Expense' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ budgeted: 149.99 }));
  });
});

describe('CreateOrEditEventModal', () => {
  it('preserves fields the form does not edit and saves the chosen status', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const initialEvent = {
      id: 'e1',
      title: 'Garden Party',
      occasion: 'birthday',
      date: '2026-12-01',
      time: '5:00 PM',
      location: '',
      venueName: '',
      hostName: 'Maya',
      hostEmail: '',
      totalBudget: 1000,
      themeTitle: 'Bloom',
      themeDescription: '',
      themePalette: [],
      coverEmoji: '🌸',
      coverColor: '',
      status: 'planning',
      guests: [{ id: 'g1' }],
      expenses: [],
      tasks: [],
      vendors: [],
      timeline: [],
      menuIdeas: { starters: ['Bruschetta'], mains: [], desserts: [], signatureDrinks: [] },
      notes: 'keep me',
    } as unknown as EventData;

    render(<CreateOrEditEventModal isOpen onClose={() => {}} onSave={onSave} initialEvent={initialEvent} />);
    await user.selectOptions(screen.getByLabelText(/^status/i), 'confirmed');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    const saved = onSave.mock.calls[0][0] as EventData;
    expect(saved.status).toBe('confirmed');
    expect(saved.menuIdeas?.starters).toEqual(['Bruschetta']);
    expect(saved.guests).toHaveLength(1);
    expect(saved.notes).toBe('keep me');
    expect(saved.id).toBe('e1');
  });
});
