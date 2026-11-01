import React from 'react';
import type { InvitationDraft, InvitationMessageType } from '../../../types';
import { EditableText } from './EditableText';
import { CARD_STYLES } from './cardStyles';
import { PRINT_TARGET_CLASS } from './printInvitation';

type InvitationDetails = InvitationDraft['detailsBlock'];

interface InvitationCardPreviewProps {
  invite: InvitationDraft;
  messageType: InvitationMessageType;
  isEditing: boolean;
  onChange: (invite: InvitationDraft) => void;
}

const EDIT_UNDERLINE = 'border-b border-rose-200 bg-transparent focus:outline-none';

/** Live stationery preview whose wording can be edited in place. */
export const InvitationCardPreview: React.FC<InvitationCardPreviewProps> = ({
  invite,
  messageType,
  isEditing,
  onChange,
}) => {
  const s = CARD_STYLES[invite.cardStyle] ?? CARD_STYLES.floral;
  const setField = <K extends keyof InvitationDraft>(key: K, value: InvitationDraft[K]) =>
    onChange({ ...invite, [key]: value });
  const setDetail = <K extends keyof InvitationDetails>(key: K, value: InvitationDetails[K]) =>
    onChange({ ...invite, detailsBlock: { ...invite.detailsBlock, [key]: value } });
  const detailInputClass = `${s.detailValue} w-full text-center ${EDIT_UNDERLINE}`;

  const details: { key: 'when' | 'where' | 'dressCode'; label: string; fallback?: string }[] = [
    { key: 'when', label: 'WHEN' },
    { key: 'where', label: 'WHERE' },
    { key: 'dressCode', label: 'DRESS CODE', fallback: 'Festive Chic' },
  ];

  return (
    <div
      aria-label="Invitation preview"
      role="region"
      className={`${PRINT_TARGET_CLASS} rounded-3xl border-2 shadow-xl p-8 sm:p-12 relative overflow-hidden transition-all ${s.outer}`}
    >
      <div className={`border rounded-2xl p-6 sm:p-8 relative ${s.inner}`}>
        <div className="text-center mb-6">
          <span className="text-2xl mb-1 block" aria-hidden="true">
            {s.emoji}
          </span>
          <span className={`text-[10px] uppercase font-bold tracking-widest block ${s.badge}`}>
            {messageType === 'invitation' ? 'YOU ARE CORDIALLY INVITED' : 'WITH SINCERE GRATITUDE'}
          </span>
        </div>

        <div className="text-center mb-6">
          <EditableText
            isEditing={isEditing}
            label="Headline"
            value={invite.headline}
            onChange={(v) => setField('headline', v)}
            inputClassName={`font-serif-title text-2xl sm:text-3xl font-bold text-center w-full border-b border-rose-300 bg-transparent focus:outline-none ${s.headline}`}
          >
            <h3 className={`font-serif-title text-2xl sm:text-3xl font-bold leading-tight ${s.headline}`}>
              {invite.headline}
            </h3>
          </EditableText>
        </div>

        <div className="space-y-4 text-center max-w-lg mx-auto mb-8">
          <EditableText
            isEditing={isEditing}
            label="Greeting"
            value={invite.greeting}
            onChange={(v) => setField('greeting', v)}
            inputClassName={`text-xs sm:text-sm text-center font-medium w-full ${EDIT_UNDERLINE} ${s.greeting}`}
          >
            <p className={`text-xs sm:text-sm font-medium ${s.greeting}`}>{invite.greeting}</p>
          </EditableText>

          <EditableText
            isEditing={isEditing}
            label="Message body"
            rows={4}
            value={invite.body}
            onChange={(v) => setField('body', v)}
            inputClassName={`text-xs sm:text-sm leading-relaxed w-full p-2 border border-rose-200 rounded-xl bg-transparent focus:outline-none ${s.body}`}
          >
            <p className={`text-xs sm:text-sm leading-relaxed ${s.body}`}>{invite.body}</p>
          </EditableText>
        </div>

        <div
          className={`rounded-2xl p-5 border max-w-md mx-auto text-center space-y-2 text-xs mb-8 ${s.details}`}
        >
          {details.map(({ key, label, fallback }) => (
            <div key={key}>
              <span className={`font-semibold block ${s.detailLabel}`}>{label}</span>
              <EditableText
                isEditing={isEditing}
                label={label.toLowerCase()}
                value={invite.detailsBlock[key] ?? ''}
                onChange={(v) => setDetail(key, v)}
                inputClassName={detailInputClass}
              >
                <span className={s.detailValue}>{invite.detailsBlock[key] || fallback}</span>
              </EditableText>
            </div>
          ))}

          <div className={`pt-1 text-[11px] italic ${s.rsvp}`}>{invite.detailsBlock.rsvpNote}</div>
        </div>

        <div className="text-center space-y-1">
          <p className={`text-2xl ${s.closing}`}>{invite.closing}</p>
          <p className={`font-medium text-xs ${s.signoff}`}>{invite.signoff}</p>
        </div>
      </div>
    </div>
  );
};
