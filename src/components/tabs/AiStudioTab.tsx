import React, { useState } from 'react';
import type { AiStudioTool, EventData } from '../../types';
import { AiStudioHeader } from '../ai-studio/AiStudioHeader';
import { ThemeGenerator } from '../ai-studio/themes/ThemeGenerator';
import { InvitationStudio } from '../ai-studio/invitations/InvitationStudio';
import { TimelineGenerator } from '../ai-studio/timeline/TimelineGenerator';
import { IdeasGenerator } from '../ai-studio/ideas/IdeasGenerator';
import { DEFAULT_THEME_VIBE, toolPanelId, toolTabId } from '../ai-studio/constants';

interface AiStudioTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onSwitchTab: (tab: string) => void;
}

interface ToolPanelProps {
  tool: AiStudioTool;
  activeTool: AiStudioTool;
  children: React.ReactNode;
}

/**
 * Inactive tools stay mounted (just hidden) so their prompts, generated
 * results and in-flight requests survive switching between tools.
 */
const ToolPanel: React.FC<ToolPanelProps> = ({ tool, activeTool, children }) => (
  <div
    role="tabpanel"
    id={toolPanelId(tool)}
    aria-labelledby={toolTabId(tool)}
    hidden={tool !== activeTool}
  >
    {children}
  </div>
);

/**
 * AI Celebration Concierge: themes, invitations, day-of timelines and
 * menu/décor/activity ideas, each generated server-side via Gemini and
 * editable before being saved to the event.
 */
export const AiStudioTab: React.FC<AiStudioTabProps> = ({ event, onUpdateEvent, onSwitchTab }) => {
  const [activeTool, setActiveTool] = useState<AiStudioTool>('themes');
  // Shared between tools: the ideas generator falls back to the typed vibe.
  const [themeVibe, setThemeVibe] = useState(DEFAULT_THEME_VIBE);

  return (
    <div className="space-y-6">
      <AiStudioHeader activeTool={activeTool} onSelectTool={setActiveTool} />

      <div>
        <ToolPanel tool="themes" activeTool={activeTool}>
          <ThemeGenerator
            event={event}
            onUpdateEvent={onUpdateEvent}
            vibe={themeVibe}
            onVibeChange={setThemeVibe}
          />
        </ToolPanel>
        <ToolPanel tool="invitations" activeTool={activeTool}>
          <InvitationStudio event={event} onUpdateEvent={onUpdateEvent} />
        </ToolPanel>
        <ToolPanel tool="timeline" activeTool={activeTool}>
          <TimelineGenerator event={event} onUpdateEvent={onUpdateEvent} onSwitchTab={onSwitchTab} />
        </ToolPanel>
        <ToolPanel tool="ideas" activeTool={activeTool}>
          <IdeasGenerator event={event} onUpdateEvent={onUpdateEvent} fallbackTheme={themeVibe} />
        </ToolPanel>
      </div>
    </div>
  );
};
