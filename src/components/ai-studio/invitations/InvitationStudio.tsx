import React, { useMemo, useState } from 'react';
import type { InvitationDraft, InvitationMessageType, InvitationTone } from '../../../types';
import { generateInvitation } from '../../../lib/api';
import { buildInvitationRequest } from '../../../lib/aiStudio';
import {
  buildDefaultInvitation,
  buildInvitationMailto,
  formatInvitationAsText,
  personaliseInvitation,
} from '../../../lib/invitation';
import { triggerMiniConfetti } from '../../../utils/confetti';
import { useAiGeneration } from '../hooks/useAiGeneration';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { DEFAULT_INVITE_EXTRAS } from '../constants';
import type { AiToolProps } from '../eventActions';
import { InvitationControls } from './InvitationControls';
import { InvitationCardPreview } from './InvitationCardPreview';
import { InvitationPreviewToolbar } from './InvitationPreviewToolbar';
import { InvitationActionBar } from './InvitationActionBar';
import { InvitationPrintStyles } from './InvitationPrintStyles';
import { printInvitation } from './printInvitation';

/**
 * AI tool for drafting, styling, personalising, printing, emailing and saving
 * invitations and thank-you notes.
 */
export const InvitationStudio: React.FC<AiToolProps> = ({ event, onUpdateEvent }) => {
  const [messageType, setMessageType] = useState<InvitationMessageType>('invitation');
  const [tone, setTone] = useState<InvitationTone>('warm');
  const [extras, setExtras] = useState(DEFAULT_INVITE_EXTRAS);
  const [invite, setInvite] = useState<InvitationDraft>(
    () => event.invitationDraft ?? buildDefaultInvitation(event),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [previewGuestId, setPreviewGuestId] = useState('');
  const { copied, copy } = useCopyToClipboard();
  const { generate, isLoading, error } = useAiGeneration(generateInvitation);

  const previewGuest = event.guests.find((g) => g.id === previewGuestId);
  // Personalisation is a preview-only overlay; edits always target the shared draft.
  const displayedInvite =
    previewGuest && !isEditing ? personaliseInvitation(invite, previewGuest.name) : invite;
  const mailtoHref = useMemo(() => buildInvitationMailto(invite, event.guests), [invite, event.guests]);

  const handleGenerate = async () => {
    const result = await generate(
      buildInvitationRequest(event, { tone, extraDetails: extras, type: messageType }),
    );
    if (result) {
      setInvite((prev) => ({ ...result, tone, cardStyle: prev.cardStyle || 'floral' }));
      triggerMiniConfetti(0.5, 0.4);
    }
  };

  const handleSave = () => {
    onUpdateEvent({ ...event, invitationDraft: invite });
    triggerMiniConfetti(0.5, 0.5);
    alert('Invitation draft saved to this event!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <InvitationPrintStyles />
      <InvitationControls
        messageType={messageType}
        onMessageTypeChange={setMessageType}
        tone={tone}
        onToneChange={setTone}
        extras={extras}
        onExtrasChange={setExtras}
        isLoading={isLoading}
        error={error}
        onGenerate={handleGenerate}
      />

      <div className="lg:col-span-7 space-y-4">
        <InvitationPreviewToolbar
          cardStyle={invite.cardStyle}
          onCardStyleChange={(cardStyle) => setInvite((prev) => ({ ...prev, cardStyle }))}
          guests={event.guests}
          previewGuestId={previewGuest ? previewGuestId : ''}
          onPreviewGuestChange={setPreviewGuestId}
        />
        <InvitationCardPreview
          invite={displayedInvite}
          messageType={messageType}
          isEditing={isEditing}
          onChange={setInvite}
        />
        <InvitationActionBar
          isEditing={isEditing}
          onToggleEditing={() => setIsEditing((v) => !v)}
          copied={copied}
          onCopy={() => copy(formatInvitationAsText(displayedInvite))}
          onPrint={printInvitation}
          mailtoHref={mailtoHref}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};
