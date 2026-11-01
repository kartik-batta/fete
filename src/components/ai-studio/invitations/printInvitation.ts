/** Class marking the element that the invitation print stylesheet isolates. */
export const PRINT_TARGET_CLASS = 'print-only-target';
/** Body class that activates the print stylesheet only for our print action. */
export const PRINTING_BODY_CLASS = 'printing-invitation';

/**
 * Opens the browser print dialog for just the invitation card. The isolating
 * styles are scoped to a body class that is removed once printing finishes,
 * so normal Ctrl+P on other pages is unaffected.
 */
export function printInvitation(): void {
  const { body } = document;
  const cleanup = () => body.classList.remove(PRINTING_BODY_CLASS);
  body.classList.add(PRINTING_BODY_CLASS);
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  // Some browsers don't fire `afterprint`; print() is blocking in most, so clean up now too.
  setTimeout(cleanup, 0);
}
