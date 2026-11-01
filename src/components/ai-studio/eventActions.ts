import type { EventData } from '../../types';
import { buildDecorTasks } from '../../lib/aiStudio';
import { triggerFestiveConfetti } from '../../utils/confetti';

/** Callback every AI tool uses to persist changes to the active event. */
export type EventUpdateHandler = (updated: EventData) => void;

/** Props shared by every AI Studio tool panel. */
export interface AiToolProps {
  event: EventData;
  onUpdateEvent: EventUpdateHandler;
}

/**
 * Adds décor ideas to the event checklist and celebrates the change.
 * Shared by the theme generator and the ideas tool.
 */
export function addDecorToChecklist(
  event: EventData,
  onUpdateEvent: EventUpdateHandler,
  decorItems: readonly string[],
): void {
  onUpdateEvent({ ...event, tasks: [...event.tasks, ...buildDecorTasks(decorItems, event)] });
  triggerFestiveConfetti();
  alert(`Added ${decorItems.length} décor items to your To-Do checklist!`);
}
