import React from 'react';
import type { DecorIdea } from '../../../types';
import { IdeaColumnCard } from '../shared/IdeaColumnCard';

interface DecorIdeasCardProps {
  decor: DecorIdea[];
  onAddToTasks: () => void;
}

/** Suggested décor accents with cost estimates, with an add-to-tasks action. */
export const DecorIdeasCard: React.FC<DecorIdeasCardProps> = ({ decor, onAddToTasks }) => (
  <IdeaColumnCard
    emoji="💐"
    title="Décor & Visuals"
    action={
      <button
        type="button"
        onClick={onAddToTasks}
        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 font-semibold text-xs border border-rose-200 transition"
      >
        Add Décor to To-Do Tasks
      </button>
    }
  >
    <div className="space-y-3">
      {decor.map((dec, i) => (
        <div key={i} className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900">{dec.item}</span>
            {dec.estimatedCost && (
              <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {dec.estimatedCost}
              </span>
            )}
          </div>
          <p className="text-stone-600 leading-relaxed">{dec.description}</p>
        </div>
      ))}
    </div>
  </IdeaColumnCard>
);
