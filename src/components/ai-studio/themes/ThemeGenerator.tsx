import React, { useState } from 'react';
import type { AITheme } from '../../../types';
import { generateThemes } from '../../../lib/api';
import { applyThemeToEvent, buildThemesRequest } from '../../../lib/aiStudio';
import { triggerMiniConfetti } from '../../../utils/confetti';
import { TweakThemeModal } from '../../modals/TweakThemeModal';
import { useAiGeneration } from '../hooks/useAiGeneration';
import { addDecorToChecklist, type AiToolProps } from '../eventActions';
import { QUICK_VIBES } from '../constants';
import { FormField } from '../shared/FormField';
import { GenerateButton } from '../shared/GenerateButton';
import { AiErrorNotice } from '../shared/AiErrorNotice';
import { FOCUSABLE_TEXT_INPUT_CLASS, PANEL_CLASS } from '../shared/styles';
import { ThemeConceptCard } from './ThemeConceptCard';

interface ThemeGeneratorProps extends AiToolProps {
  /** The desired vibe is lifted so the ideas tool can reuse it as a fallback theme. */
  vibe: string;
  onVibeChange: (vibe: string) => void;
}

/** AI tool that proposes three cohesive party theme concepts. */
export const ThemeGenerator: React.FC<ThemeGeneratorProps> = ({
  event,
  onUpdateEvent,
  vibe,
  onVibeChange,
}) => {
  const [notes, setNotes] = useState('');
  const [themes, setThemes] = useState<AITheme[]>([]);
  const [themeToTweak, setThemeToTweak] = useState<AITheme | null>(null);
  const { generate, isLoading, error } = useAiGeneration(generateThemes);

  const handleGenerate = async () => {
    const result = await generate(buildThemesRequest(event, vibe, notes));
    if (result) {
      setThemes(result);
      triggerMiniConfetti(0.5, 0.4);
    }
  };

  return (
    <div className="space-y-6">
      <div className={PANEL_CLASS}>
        <h3 className="font-serif-title text-lg font-bold text-stone-900 mb-1">
          Party Theme Inspiration
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Suggests cohesive aesthetic packages with palettes, floral/decor motifs, attire guidance, and playlist cues.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormField label="Desired Vibe / Style">
            {(id) => (
              <input
                id={id}
                type="text"
                placeholder="e.g. Warm French botanical, retro sunset disco, enchanted forest..."
                value={vibe}
                onChange={(e) => onVibeChange(e.target.value)}
                className={FOCUSABLE_TEXT_INPUT_CLASS}
              />
            )}
          </FormField>

          <FormField label="Special Notes or Favorite Elements">
            {(id) => (
              <input
                id={id}
                type="text"
                placeholder="e.g. Include dried citrus, outdoor fairy lights, peach tones"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={FOCUSABLE_TEXT_INPUT_CLASS}
              />
            )}
          </FormField>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <span className="text-[11px] text-stone-400 font-medium">Quick vibes:</span>
          {QUICK_VIBES.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onVibeChange(chip)}
              aria-pressed={vibe === chip}
              className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 transition"
            >
              {chip}
            </button>
          ))}
        </div>

        <GenerateButton
          isLoading={isLoading}
          onClick={handleGenerate}
          label="Generate 3 Theme Concepts"
          loadingLabel="Styling Concepts..."
        />
        <AiErrorNotice error={error} onRetry={handleGenerate} />
      </div>

      {themes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {themes.map((theme, idx) => (
            <ThemeConceptCard
              key={theme.id || idx}
              theme={theme}
              index={idx}
              onTweak={setThemeToTweak}
              onAddDecor={(items) => addDecorToChecklist(event, onUpdateEvent, items)}
            />
          ))}
        </div>
      )}

      {themeToTweak && (
        <TweakThemeModal
          key={themeToTweak.id}
          isOpen
          onClose={() => setThemeToTweak(null)}
          theme={themeToTweak}
          onSaveToEvent={(customTheme) => onUpdateEvent(applyThemeToEvent(event, customTheme))}
        />
      )}
    </div>
  );
};
