import type { AiStudioTool, InvitationTone } from '../../types';

/** Initial values for the AI Studio prompt fields. */
export const DEFAULT_THEME_VIBE = 'Warm, festive, chic and botanical';
export const DEFAULT_INVITE_EXTRAS = 'Dietary options provided, please RSVP 2 weeks prior';
export const DEFAULT_END_TIME = '09:00 PM';
export const DEFAULT_START_TIME = '03:00 PM';
export const DEFAULT_KEY_MOMENTS =
  'Welcome spritz, group photos, dinner courses, speeches & toasts, cake cutting, dance party';
export const DEFAULT_DIETARY_PREF = 'Vegetarian, gluten-free, and refreshing mocktail options';
export const DEFAULT_AGE_GROUP = 'Adults & multi-generational family';

/** One-click vibe presets for the theme generator. */
export const QUICK_VIBES: readonly string[] = [
  'Sunset Botanicals & Spritz',
  'Retro Pastel Disco',
  'Cozy Autumn Harvest',
  'Celestial Indigo & Starlight',
  'Clean Scandinavian Linen',
];

/** Tone options for the invitation studio. */
export const TONE_OPTIONS: readonly { id: InvitationTone; label: string }[] = [
  { id: 'warm', label: 'Warm & Heartfelt' },
  { id: 'playful', label: 'Playful & Bubbly' },
  { id: 'elegant', label: 'Editorial & Formal' },
  { id: 'minimalist', label: 'Modern Minimalist' },
];

/** Sub-navigation entries, in display order. */
export const AI_STUDIO_TOOLS: readonly { id: AiStudioTool; label: string }[] = [
  { id: 'themes', label: 'Party Themes' },
  { id: 'invitations', label: 'Invitations & Thank You' },
  { id: 'timeline', label: 'Day-of Timeline' },
  { id: 'ideas', label: 'Décor, Menu & Games' },
];

/** DOM id helpers so tabs and panels can reference each other. */
export const toolTabId = (tool: AiStudioTool) => `ai-studio-tab-${tool}`;
export const toolPanelId = (tool: AiStudioTool) => `ai-studio-panel-${tool}`;
