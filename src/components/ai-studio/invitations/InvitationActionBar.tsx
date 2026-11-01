import React from 'react';
import { Check, Copy, Edit3, Mail, Printer } from 'lucide-react';

interface InvitationActionBarProps {
  isEditing: boolean;
  onToggleEditing: () => void;
  copied: boolean;
  onCopy: () => void;
  onPrint: () => void;
  /** Prepared `mailto:` link, or `null` when no guest has an email address. */
  mailtoHref: string | null;
  onSave: () => void;
}

const SECONDARY_BUTTON =
  'flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition';

/** Edit / copy / print / email / save actions beneath the invitation preview. */
export const InvitationActionBar: React.FC<InvitationActionBarProps> = ({
  isEditing,
  onToggleEditing,
  copied,
  onCopy,
  onPrint,
  mailtoHref,
  onSave,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EFE5D8] shadow-xs">
    <button
      type="button"
      aria-pressed={isEditing}
      onClick={onToggleEditing}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
        isEditing
          ? 'bg-rose-50 border-rose-300 text-rose-800'
          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
      }`}
    >
      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{isEditing ? 'Done Tweaking' : 'Tweak Text In-Place'}</span>
    </button>

    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onCopy} className={SECONDARY_BUTTON}>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
        )}
        <span aria-live="polite">{copied ? 'Copied!' : 'Copy Text'}</span>
      </button>

      <button type="button" onClick={onPrint} className={SECONDARY_BUTTON}>
        <Printer className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Print / Save as PDF</span>
      </button>

      {mailtoHref ? (
        <a href={mailtoHref} className={SECONDARY_BUTTON}>
          <Mail className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Email Guests</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          title="Add guest email addresses to send invitations"
          className={`${SECONDARY_BUTTON} opacity-50 cursor-not-allowed`}
        >
          <Mail className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Email Guests</span>
        </button>
      )}

      <button
        type="button"
        onClick={onSave}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
      >
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Save to Event</span>
      </button>
    </div>
  </div>
);
