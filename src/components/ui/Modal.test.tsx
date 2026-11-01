import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <Modal isOpen={open} onClose={close} title="Party details" description="Fill these in">
        <input aria-label="First field" />
        <button type="button">Last action</button>
      </Modal>
    </>
  );
}

const openDialog = async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: 'Open dialog' }));
  return user;
};

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exposes dialog semantics labelled and described by its heading', async () => {
    await openDialog();
    const dialog = screen.getByRole('dialog', { name: 'Party details' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Fill these in');
  });

  it('moves focus to the first field in the body on open', async () => {
    await openDialog();
    expect(screen.getByLabelText('First field')).toHaveFocus();
  });

  it('traps Tab and Shift+Tab inside the dialog', async () => {
    const user = await openDialog();
    await user.tab(); // -> Last action
    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus();
    await user.tab(); // wraps -> close button (first)
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    await user.tab({ shift: true }); // wraps back -> last
    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = await openDialog();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dialog' })).toHaveFocus();
  });

  it('closes via the labelled close button', async () => {
    const user = await openDialog();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click but not on clicks inside the panel', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await user.click(screen.getByLabelText('First field'));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll and makes the background inert while open', async () => {
    const user = await openDialog();
    expect(document.body.style.overflow).toBe('hidden');
    const trigger = screen.getByRole('button', { name: 'Open dialog', hidden: true });
    expect(trigger.closest('[inert]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
    expect(trigger.closest('[inert]')).toBeNull();
  });
});
