import React, { useState } from 'react';
import type { CuratedIdeas } from '../../../types';
import { generateIdeas } from '../../../lib/api';
import { buildActivityMilestones, buildIdeasRequest } from '../../../lib/aiStudio';
import { triggerFestiveConfetti, triggerMiniConfetti } from '../../../utils/confetti';
import { useAiGeneration } from '../hooks/useAiGeneration';
import { addDecorToChecklist, type AiToolProps } from '../eventActions';
import { DEFAULT_AGE_GROUP, DEFAULT_DIETARY_PREF } from '../constants';
import { FormField } from '../shared/FormField';
import { GenerateButton } from '../shared/GenerateButton';
import { AiErrorNotice } from '../shared/AiErrorNotice';
import { PANEL_CLASS, TEXT_INPUT_CLASS } from '../shared/styles';
import { MenuIdeasCard } from './MenuIdeasCard';
import { ActivityIdeasCard } from './ActivityIdeasCard';
import { DecorIdeasCard } from './DecorIdeasCard';

interface IdeasGeneratorProps extends AiToolProps {
  /** Theme prompt to use when the event has no theme applied yet. */
  fallbackTheme: string;
}

/** AI tool that curates menu, décor and activity recommendations. */
export const IdeasGenerator: React.FC<IdeasGeneratorProps> = ({
  event,
  onUpdateEvent,
  fallbackTheme,
}) => {
  const [dietary, setDietary] = useState(DEFAULT_DIETARY_PREF);
  const [ageGroup, setAgeGroup] = useState(DEFAULT_AGE_GROUP);
  const [ideas, setIdeas] = useState<CuratedIdeas | null>(null);
  const { generate, isLoading, error } = useAiGeneration(generateIdeas);

  const handleGenerate = async () => {
    const result = await generate(buildIdeasRequest(event, { fallbackTheme, dietary, ageGroup }));
    if (result) {
      setIdeas(result);
      triggerMiniConfetti(0.5, 0.4);
    }
  };

  const handleSaveMenu = (current: CuratedIdeas) => {
    onUpdateEvent({ ...event, menuIdeas: current.menu });
    triggerFestiveConfetti();
    alert('Saved menu ideas to celebration profile!');
  };

  const handleAddActivities = (current: CuratedIdeas) => {
    onUpdateEvent({
      ...event,
      timeline: [...event.timeline, ...buildActivityMilestones(current.activities, event)],
    });
    triggerFestiveConfetti();
    alert('Added activities to event schedule!');
  };

  return (
    <div className="space-y-6">
      <div className={PANEL_CLASS}>
        <h3 className="font-serif-title text-lg font-bold text-stone-900 mb-1">
          Menu, Décor & Party Activities
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Curate delicious hors d'oeuvres, signature cocktails, memorable guest icebreakers, and styling accents.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormField label="Dietary Preferences & Bar">
            {(id) => (
              <input
                id={id}
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className={TEXT_INPUT_CLASS}
              />
            )}
          </FormField>

          <FormField label="Crowd Dynamic & Age Group">
            {(id) => (
              <input
                id={id}
                type="text"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className={TEXT_INPUT_CLASS}
              />
            )}
          </FormField>
        </div>

        <GenerateButton
          isLoading={isLoading}
          onClick={handleGenerate}
          label="Generate Recommendations"
          loadingLabel="Cooking up ideas..."
        />
        <AiErrorNotice error={error} onRetry={handleGenerate} />
      </div>

      {ideas && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MenuIdeasCard menu={ideas.menu} onSave={() => handleSaveMenu(ideas)} />
          <ActivityIdeasCard
            activities={ideas.activities}
            onAddToSchedule={() => handleAddActivities(ideas)}
          />
          <DecorIdeasCard
            decor={ideas.decor}
            onAddToTasks={() =>
              addDecorToChecklist(
                event,
                onUpdateEvent,
                ideas.decor.map((d) => d.item),
              )
            }
          />
        </div>
      )}
    </div>
  );
};
