import React from 'react';
import { Clock, Mail, Palette, Sparkles, Utensils, type LucideIcon } from 'lucide-react';
import type { AiStudioTool } from '../../types';
import { AI_STUDIO_TOOLS, toolPanelId, toolTabId } from './constants';

const TOOL_ICONS: Record<AiStudioTool, LucideIcon> = {
  themes: Palette,
  invitations: Mail,
  timeline: Clock,
  ideas: Utensils,
};

interface AiStudioHeaderProps {
  activeTool: AiStudioTool;
  onSelectTool: (tool: AiStudioTool) => void;
}

/** Hero banner for the AI Studio with pill navigation between the AI tools. */
export const AiStudioHeader: React.FC<AiStudioHeaderProps> = ({ activeTool, onSelectTool }) => (
  <div className="bg-gradient-to-r from-rose-100/80 via-amber-100/60 to-purple-100/70 p-6 sm:p-8 rounded-3xl border border-[#EFE3D5] shadow-xs relative overflow-hidden">
    <div className="relative z-10 max-w-2xl">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-rose-800 border border-rose-200 shadow-xs mb-3">
        <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin" aria-hidden="true" />
        <span>AI Celebration Concierge • Powered by Gemini</span>
      </div>
      <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
        Creative Ideas Tailored to Your Celebration
      </h2>
      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
        Generate curated themes, custom stationery wording, day-of timelines, and artisanal menus.
        Every suggestion is completely editable and tweaks can be saved directly to your event!
      </p>
    </div>

    <div
      role="tablist"
      aria-label="AI Studio tools"
      className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar relative z-10"
    >
      {AI_STUDIO_TOOLS.map(({ id, label }) => {
        const Icon = TOOL_ICONS[id];
        const isActive = id === activeTool;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={toolTabId(id)}
            aria-selected={isActive}
            aria-controls={toolPanelId(id)}
            onClick={() => onSelectTool(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition ${
              isActive
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  </div>
);
