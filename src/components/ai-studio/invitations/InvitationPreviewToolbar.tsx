import React, { useId } from 'react';
import type { Guest, InvitationCardStyle } from '../../../types';
import { CARD_STYLES, CARD_STYLE_IDS } from './cardStyles';

interface InvitationPreviewToolbarProps {
  cardStyle: InvitationCardStyle;
  onCardStyleChange: (style: InvitationCardStyle) => void;
  guests: readonly Guest[];
  /** Id of the guest the preview is personalised for, or '' for the generic copy. */
  previewGuestId: string;
  onPreviewGuestChange: (guestId: string) => void;
}

/** Card-style picker and "personalise for a guest" selector above the preview. */
export const InvitationPreviewToolbar: React.FC<InvitationPreviewToolbarProps> = ({
  cardStyle,
  onCardStyleChange,
  guests,
  previewGuestId,
  onPreviewGuestChange,
}) => {
  const styleLabelId = useId();
  const guestSelectId = useId();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EFE5D8] shadow-xs">
      <div className="flex items-center gap-2" role="radiogroup" aria-labelledby={styleLabelId}>
        <span id={styleLabelId} className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Card style
        </span>
        {CARD_STYLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={cardStyle === id}
            onClick={() => onCardStyleChange(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
              cardStyle === id
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span className={`w-3 h-3 rounded-full border ${CARD_STYLES[id].swatch}`} aria-hidden="true" />
            {CARD_STYLES[id].label}
          </button>
        ))}
      </div>

      {guests.length > 0 && (
        <div className="flex items-center gap-2">
          <label
            htmlFor={guestSelectId}
            className="text-[11px] font-semibold uppercase tracking-wider text-stone-500"
          >
            Personalise preview
          </label>
          <select
            id={guestSelectId}
            value={previewGuestId}
            onChange={(e) => onPreviewGuestChange(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="">Everyone (generic)</option>
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
