import React, { useState } from 'react';
import type { TimelineEvent } from '../../../types';
import { generateTimeline } from '../../../lib/api';
import {
  buildTimelineRequest,
  mergeTimeline,
  updateAt,
  type TimelineMergeMode,
} from '../../../lib/aiStudio';
import { expectedHeadcount } from '../../../lib/guests';
import { triggerFestiveConfetti, triggerMiniConfetti } from '../../../utils/confetti';
import { useAiGeneration } from '../hooks/useAiGeneration';
import type { AiToolProps } from '../eventActions';
import { DEFAULT_END_TIME, DEFAULT_KEY_MOMENTS, DEFAULT_START_TIME } from '../constants';
import { FormField } from '../shared/FormField';
import { GenerateButton } from '../shared/GenerateButton';
import { AiErrorNotice } from '../shared/AiErrorNotice';
import { PANEL_CLASS, TEXT_INPUT_CLASS } from '../shared/styles';
import { TimelineSuggestionList } from './TimelineSuggestionList';

interface TimelineGeneratorProps extends AiToolProps {
  /** Navigates to another top-level tab (used to jump to the saved timeline). */
  onSwitchTab: (tab: string) => void;
}

/** AI tool that drafts an editable day-of run-of-show. */
export const TimelineGenerator: React.FC<TimelineGeneratorProps> = ({
  event,
  onUpdateEvent,
  onSwitchTab,
}) => {
  const [startTime, setStartTime] = useState(event.time || DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [keyMoments, setKeyMoments] = useState(DEFAULT_KEY_MOMENTS);
  const [suggested, setSuggested] = useState<TimelineEvent[]>([]);
  const { generate, isLoading, error } = useAiGeneration(generateTimeline);

  const handleGenerate = async () => {
    const result = await generate(buildTimelineRequest(event, { startTime, endTime, keyMoments }));
    if (result) {
      setSuggested(result);
      triggerMiniConfetti(0.5, 0.4);
    }
  };

  const handleApply = (mode: TimelineMergeMode) => {
    if (suggested.length === 0) return;
    onUpdateEvent({ ...event, timeline: mergeTimeline(event.timeline, suggested, mode) });
    triggerFestiveConfetti();
    alert('Day-of Run of Show successfully updated!');
    onSwitchTab('timeline');
  };

  return (
    <div className="space-y-6">
      <div className={PANEL_CLASS}>
        <h3 className="font-serif-title text-lg font-bold text-stone-900 mb-1">
          AI Day-of Timeline Architect
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Orchestrate a seamless flow of moments, from setup to final toasts and send-off.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <FormField label="Start Time">
            {(id) => (
              <input
                id={id}
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={TEXT_INPUT_CLASS}
              />
            )}
          </FormField>

          <FormField label="End Time">
            {(id) => (
              <input
                id={id}
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={TEXT_INPUT_CLASS}
              />
            )}
          </FormField>

          <FormField label="Expected Headcount">
            {(id) => (
              <input
                id={id}
                type="number"
                value={expectedHeadcount(event.guests)}
                readOnly
                className={`${TEXT_INPUT_CLASS} bg-stone-50 text-stone-600`}
              />
            )}
          </FormField>
        </div>

        <FormField label="Key Desired Moments" className="mb-4">
          {(id) => (
            <input
              id={id}
              type="text"
              value={keyMoments}
              onChange={(e) => setKeyMoments(e.target.value)}
              className={TEXT_INPUT_CLASS}
            />
          )}
        </FormField>

        <GenerateButton
          isLoading={isLoading}
          onClick={handleGenerate}
          label="Generate Day-of Run of Show"
          loadingLabel="Calculating Run of Show..."
        />
        <AiErrorNotice error={error} onRetry={handleGenerate} />
      </div>

      {suggested.length > 0 && (
        <TimelineSuggestionList
          items={suggested}
          onEditItem={(idx, patch) => setSuggested((prev) => updateAt(prev, idx, patch))}
          onApply={handleApply}
        />
      )}
    </div>
  );
};
