import React from 'react';
import type { TimelineEvent } from '../../../types';
import type { TimelineMergeMode } from '../../../lib/aiStudio';

interface TimelineSuggestionListProps {
  items: TimelineEvent[];
  onEditItem: (index: number, patch: Partial<TimelineEvent>) => void;
  onApply: (mode: TimelineMergeMode) => void;
}

/** Editable list of generated milestones with replace/append actions. */
export const TimelineSuggestionList: React.FC<TimelineSuggestionListProps> = ({
  items,
  onEditItem,
  onApply,
}) => (
  <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 sm:p-8 shadow-xs">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
      <div>
        <h4 className="font-serif-title text-xl font-bold text-stone-900">
          Generated Timeline Schedule ({items.length} Milestones)
        </h4>
        <p className="text-xs text-stone-500">
          Review and tweak times or text directly before applying to your celebration schedule.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onApply('replace')}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition"
        >
          Replace Event Timeline
        </button>
        <button
          type="button"
          onClick={() => onApply('append')}
          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition"
        >
          Append to Existing
        </button>
      </div>
    </div>

    <ol className="space-y-3">
      {items.map((item, idx) => (
        <li
          key={item.id || idx}
          className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3 flex-1">
            <input
              type="text"
              aria-label={`Time for milestone ${idx + 1}`}
              value={item.time}
              onChange={(e) => onEditItem(idx, { time: e.target.value })}
              className="w-24 px-2 py-1 rounded-lg bg-stone-900 text-white font-mono text-xs font-bold text-center"
            />

            <div className="space-y-1 flex-1">
              <input
                type="text"
                aria-label={`Title for milestone ${idx + 1}`}
                value={item.title}
                onChange={(e) => onEditItem(idx, { title: e.target.value })}
                className="font-serif-title font-bold text-sm text-stone-900 w-full bg-transparent border-b border-stone-200 focus:outline-none"
              />
              <textarea
                rows={2}
                aria-label={`Description for milestone ${idx + 1}`}
                value={item.description}
                onChange={(e) => onEditItem(idx, { description: e.target.value })}
                className="text-xs text-stone-600 w-full bg-transparent border-b border-stone-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
              Lead: {item.assignedTo}
            </span>
          </div>
        </li>
      ))}
    </ol>
  </div>
);
