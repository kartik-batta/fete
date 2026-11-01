import React from 'react';
import { PRINT_TARGET_CLASS, PRINTING_BODY_CLASS } from './printInvitation';

const scope = `body.${PRINTING_BODY_CLASS}`;
const PRINT_CSS = `@media print {
  @page { margin: 12mm; }
  ${scope} * { visibility: hidden !important; }
  ${scope} .${PRINT_TARGET_CLASS}, ${scope} .${PRINT_TARGET_CLASS} * { visibility: visible !important; }
  ${scope} .${PRINT_TARGET_CLASS} {
    position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important;
    box-shadow: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}`;

/** Print stylesheet that isolates the invitation card during {@link printInvitation}. */
export const InvitationPrintStyles: React.FC = () => <style>{PRINT_CSS}</style>;
