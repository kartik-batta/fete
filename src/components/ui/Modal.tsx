import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { IconButton } from './IconButton';
import { getTabbable } from './focus';

type ModalSize = 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Decorative visual shown beside the title (hidden from assistive tech). */
  icon?: React.ReactNode;
  size?: ModalSize;
  /** Element to focus on open; defaults to the first tabbable element in the body. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  closeLabel?: string;
  children: React.ReactNode;
}

// ---- Module-level bookkeeping so stacked dialogs behave correctly ----------

/** Open dialogs, top-most last: only the top one reacts to Escape. */
const dialogStack: object[] = [];

let scrollLockCount = 0;
let savedBodyOverflow = '';

function lockBodyScroll(): void {
  if (scrollLockCount++ === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}

function unlockBodyScroll(): void {
  if (--scrollLockCount === 0) document.body.style.overflow = savedBodyOverflow;
}

/** Makes everything except `keep` inert (unfocusable, hidden from AT). */
function inertSiblings(keep: HTMLElement): HTMLElement[] {
  const changed: HTMLElement[] = [];
  for (const el of Array.from(document.body.children)) {
    if (el !== keep && el instanceof HTMLElement && !el.hasAttribute('inert')) {
      el.setAttribute('inert', '');
      changed.push(el);
    }
  }
  return changed;
}

/**
 * Accessible modal dialog rendered in a portal.
 *
 * - `role="dialog"`, `aria-modal`, labelled/described by its title/description
 * - focus moves inside on open, is trapped while open and restored on close
 * - Escape, the close button, or a click on the backdrop closes it
 * - background scroll is locked and the rest of the page is made `inert`
 *
 * Children are only mounted while open, so forms re-initialise on every open.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  initialFocusRef,
  closeLabel = 'Close dialog',
  children,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const pointerDownOnBackdrop = useRef(false);

  // Keep the latest onClose without re-running the open/close effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;

    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = {};
    dialogStack.push(token);
    lockBodyScroll();
    const inerted = inertSiblings(overlay);

    const initial =
      initialFocusRef?.current ??
      dialog.querySelector<HTMLElement>('[data-autofocus]') ??
      (bodyRef.current && getTabbable(bodyRef.current)[0]) ??
      dialog;
    initial.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogStack[dialogStack.length - 1] === token) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      dialogStack.splice(dialogStack.indexOf(token), 1);
      inerted.forEach((el) => el.removeAttribute('inert'));
      unlockBodyScroll();
      if (trigger?.isConnected) trigger.focus();
    };
    // initialFocusRef is read once on open by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /** Focus trap: wrap Tab / Shift+Tab within the dialog. */
  const handleTrapKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const tabbable = getTabbable(dialogRef.current);
    if (tabbable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = tabbable[0];
    const last = tabbable[tabbable.length - 1];
    const active = document.activeElement;
    const outside = !dialogRef.current.contains(active);
    if (e.shiftKey && (active === first || active === dialogRef.current || outside)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || outside)) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-start sm:items-center justify-center p-4"
      onMouseDown={(e) => {
        pointerDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pointerDownOnBackdrop.current && e.target === e.currentTarget) onClose();
        pointerDownOnBackdrop.current = false;
      }}
      data-testid="modal-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
        className={`modal-panel relative my-auto bg-white rounded-3xl w-full ${SIZE_CLASS[size]} p-6 sm:p-8 shadow-2xl border border-stone-200 focus:outline-none`}
      >
        <IconButton
          label={closeLabel}
          icon={X}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full"
          iconClassName="w-5 h-5"
        />

        <div className="flex items-start gap-3 mb-5 pr-10">
          {icon && (
            <div
              aria-hidden="true"
              className="w-10 h-10 shrink-0 rounded-2xl bg-rose-100 flex items-center justify-center text-xl"
            >
              {icon}
            </div>
          )}
          <div>
            <h2 id={titleId} className="font-serif-title text-2xl font-bold text-stone-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-xs text-stone-600">
                {description}
              </p>
            )}
          </div>
        </div>

        <div ref={bodyRef}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

interface ModalActionsProps {
  onCancel: () => void;
  submitLabel: string;
  /** `rose` for celebratory primary actions, `dark` (default) otherwise. */
  tone?: 'dark' | 'rose';
}

const SUBMIT_TONES = {
  dark: 'bg-stone-900 hover:bg-stone-800',
  rose: 'bg-rose-700 hover:bg-rose-800',
} as const;

/** Standard Cancel / Submit footer for modal forms. */
export const ModalActions: React.FC<ModalActionsProps> = ({ onCancel, submitLabel, tone = 'dark' }) => (
  <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
    <button
      type="button"
      onClick={onCancel}
      className="px-4 py-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 font-medium text-xs transition"
    >
      Cancel
    </button>
    <button
      type="submit"
      className={`px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 ${SUBMIT_TONES[tone]}`}
    >
      <Check className="w-4 h-4" aria-hidden="true" />
      <span>{submitLabel}</span>
    </button>
  </div>
);
