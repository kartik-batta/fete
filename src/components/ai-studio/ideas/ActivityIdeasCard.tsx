import React from 'react';
import type { ActivityIdea } from '../../../types';
import { IdeaColumnCard } from '../shared/IdeaColumnCard';

interface ActivityIdeasCardProps {
  activities: ActivityIdea[];
  onAddToSchedule: () => void;
}

/** Suggested party games and moments, with an add-to-schedule action. */
export const ActivityIdeasCard: React.FC<ActivityIdeasCardProps> = ({
  activities,
  onAddToSchedule,
}) => (
  <IdeaColumnCard
    emoji="🎲"
    title="Party Games & Moments"
    action={
      <button
        type="button"
        onClick={onAddToSchedule}
        className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs border border-purple-200 transition"
      >
        Add Activities to Schedule
      </button>
    }
  >
    <div className="space-y-3">
      {activities.map((act, i) => (
        <div key={i} className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900">{act.title}</span>
            {act.duration && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                {act.duration}
              </span>
            )}
          </div>
          <p className="text-stone-600 leading-relaxed">{act.description}</p>
          {act.materialsNeeded && (
            <p className="text-[10px] text-stone-400 italic">Needs: {act.materialsNeeded}</p>
          )}
        </div>
      ))}
    </div>
  </IdeaColumnCard>
);
