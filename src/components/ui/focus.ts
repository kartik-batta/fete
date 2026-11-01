/** Low-level focus helpers shared by dialogs and menus. */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Elements reachable with Tab inside `root`, in DOM order. Unchecked radios
 * are skipped when their group has a checked member (browsers tab only to the
 * checked radio of a group).
 */
export function getTabbable(root: ParentNode): HTMLElement[] {
  const all = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return all.filter((el) => {
    if (el.closest('[inert]') || el.getAttribute('tabindex') === '-1') return false;
    if (el instanceof HTMLInputElement && el.type === 'radio' && !el.checked && el.name) {
      const group = root.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]`);
      return !Array.from(group).some((r) => r.checked);
    }
    return true;
  });
}

/** Moves focus to the next/previous item of `items`, wrapping around. */
export function focusSibling(items: HTMLElement[], current: Element | null, delta: 1 | -1): void {
  if (items.length === 0) return;
  const index = items.indexOf(current as HTMLElement);
  const next = index === -1 ? (delta === 1 ? 0 : items.length - 1) : (index + delta + items.length) % items.length;
  items[next].focus();
}
