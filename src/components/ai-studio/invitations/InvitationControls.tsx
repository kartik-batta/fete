import React from 'react';
import type { InvitationMessageType, InvitationTone } from '../../../types';
import { TONE_OPTIONS } from '../constants';
import { FieldGroup, FormField } from '../shared/FormField';
import { GenerateButton } from '../shared/GenerateButton';
import { AiErrorNotice } from '../shared/AiErrorNotice';
import type { ApiError } from '../../../lib/api';

interface InvitationControlsProps {
  messageType: InvitationMessageType;
  onMessageTypeChange: (type: InvitationMessageType) => void;
  tone: InvitationTone;
  onToneChange: (tone: InvitationTone) => void;
  extras: string;
  onExtrasChange: (extras: string) => void;
  isLoading: boolean;
  error: ApiError | null;
  onGenerate: () => void;
}

const MESSAGE_TYPES: readonly { id: InvitationMessageType; label: string }[] = [
  { id: 'invitation', label: '💌 Celebration Invitation' },
  { id: 'thank_you', label: '✨ Thank You Card' },
];

/** Prompt controls for the stationery studio: message type, tone and notes. */
export const InvitationControls: React.FC<InvitationControlsProps> = ({
  messageType,
  onMessageTypeChange,
  tone,
  onToneChange,
  extras,
  onExtrasChange,
  isLoading,
  error,
  onGenerate,
}) => (
  <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs space-y-4">
    <h3 className="font-serif-title text-lg font-bold text-stone-900">Stationery & Message Studio</h3>
    <p className="text-xs text-stone-500">
      Craft bespoke invitations and post-party thank you messages with tailored tones.
    </p>

    <FieldGroup label="Message Type">
      <div className="grid grid-cols-2 gap-2">
        {MESSAGE_TYPES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={messageType === id}
            onClick={() => onMessageTypeChange(id)}
            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
              messageType === id
                ? 'bg-rose-50 text-rose-900 border-rose-300 ring-2 ring-rose-300'
                : 'bg-white text-stone-600 border-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </FieldGroup>

    <FieldGroup label="Tone of Voice">
      <div className="grid grid-cols-2 gap-2">
        {TONE_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tone === id}
            onClick={() => onToneChange(id)}
            className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-left transition ${
              tone === id
                ? 'bg-stone-900 text-white font-semibold'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </FieldGroup>

    <FormField label="Specific Inclusions / Notes">
      {(id) => (
        <textarea
          id={id}
          rows={3}
          placeholder="e.g. Dietary preferences requested, plus-ones welcome, valet parking details"
          value={extras}
          onChange={(e) => onExtrasChange(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      )}
    </FormField>

    <GenerateButton
      fullWidth
      isLoading={isLoading}
      onClick={onGenerate}
      label="Generate New Draft"
      loadingLabel="Crafting Wording..."
    />
    <AiErrorNotice error={error} onRetry={onGenerate} />
  </div>
);
