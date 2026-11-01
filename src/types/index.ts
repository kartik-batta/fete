export type OccasionType =
  | 'birthday'
  | 'wedding'
  | 'baby_shower'
  | 'anniversary'
  | 'office_party'
  | 'dinner_party'
  | 'holiday'
  | 'other';

export type TaskPhase =
  | '2_months_before'
  | '1_month_before'
  | '1_2_weeks'
  | 'day_before'
  | 'day_of'
  | 'post_event';

export type ExpenseCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'entertainment'
  | 'photo'
  | 'favors'
  | 'apparel'
  | 'other';

export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'florist'
  | 'music_dj'
  | 'cake_bakery'
  | 'rentals'
  | 'decor'
  | 'entertainment'
  | 'other';

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvp: 'attending' | 'declined' | 'pending';
  plusOnes: number;
  dietary: string;
  group: 'family' | 'friends' | 'colleagues' | 'vip' | 'other';
  tableNumber?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  name: string;
  budgeted: number;
  actual: number;
  status: 'planned' | 'deposit_paid' | 'paid_in_full';
  vendorName?: string;
  notes?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  phase: TaskPhase;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  costQuote: number;
  status: 'researching' | 'contacted' | 'booked' | 'paid';
  notes: string;
}

/** Phase of the celebration a run-of-show milestone belongs to. */
export type TimelineCategory =
  | 'prep'
  | 'arrival'
  | 'activity'
  | 'food'
  | 'toast'
  | 'party'
  | 'wind_down';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  category: TimelineCategory;
  assignedTo: string;
  tips?: string;
  completed?: boolean;
}

export interface InvitationDraft {
  subjectLine: string;
  headline: string;
  greeting: string;
  body: string;
  detailsBlock: {
    when: string;
    where: string;
    rsvpNote: string;
    dressCode?: string;
  };
  closing: string;
  signoff: string;
  tone: InvitationTone;
  cardStyle: InvitationCardStyle;
}

/** Voice used when wording invitations and thank-you notes. */
export type InvitationTone = 'warm' | 'playful' | 'elegant' | 'minimalist';

/** Visual stationery style of an invitation card. */
export type InvitationCardStyle = 'floral' | 'champagne' | 'midnight' | 'minimalist';

/** Kind of stationery message the AI should write. */
export type InvitationMessageType = 'invitation' | 'thank_you';

export interface AITheme {
  id: string;
  title: string;
  tagline: string;
  palette: PaletteColor[];
  decorIdeas: string[];
  musicVibe: string;
  attirePrompt: string;
  signatureTouch: string;
}

export interface EventData {
  id: string;
  title: string;
  occasion: OccasionType;
  date: string;
  time: string;
  location: string;
  venueName: string;
  hostName: string;
  hostEmail: string;
  totalBudget: number;
  themeTitle: string;
  themeDescription: string;
  themePalette: PaletteColor[];
  coverEmoji: string;
  coverColor: string;
  status: 'planning' | 'confirmed' | 'celebrated';
  guests: Guest[];
  expenses: Expense[];
  tasks: ChecklistTask[];
  vendors: Vendor[];
  timeline: TimelineEvent[];
  invitationDraft?: InvitationDraft;
  menuIdeas?: MenuIdeas;
  activityIdeas?: ActivityIdea[];
  /** Extra styling cues saved when an AI theme is applied. */
  themeDetails?: ThemeDetails;
  notes: string;
}

/** Non-visual parts of an applied AI theme (playlist, attire, signature touch). */
export interface ThemeDetails {
  musicVibe?: string;
  attire?: string;
  signatureTouch?: string;
}

/** A curated celebration menu, grouped by course. */
export interface MenuIdeas {
  starters: string[];
  mains: string[];
  desserts: string[];
  signatureDrinks: string[];
}

/** A party game or guest-engagement moment. */
export interface ActivityIdea {
  title: string;
  duration: string;
  description: string;
  materialsNeeded?: string;
}

/** A décor accent suggested by the AI stylist. */
export interface DecorIdea {
  item: string;
  description: string;
  estimatedCost?: string;
  priority?: string;
}

/** Combined décor, menu and activity recommendations. */
export interface CuratedIdeas {
  decor: DecorIdea[];
  menu: MenuIdeas;
  activities: ActivityIdea[];
}

/* -------------------------------------------------------------------------- */
/* AI Studio request / response contracts (mirrors /api/gemini/* endpoints)    */
/* -------------------------------------------------------------------------- */

/** The AI tools available in the AI Studio tab. */
export type AiStudioTool = 'themes' | 'invitations' | 'timeline' | 'ideas';

/** POST /api/gemini/themes request body. */
export interface ThemesRequest {
  occasion: OccasionType;
  guestCount: number;
  budget: number;
  vibe: string;
  notes: string;
}

/** POST /api/gemini/invitation request body. */
export interface InvitationRequest {
  eventTitle: string;
  occasion: OccasionType;
  hostName: string;
  date: string;
  time: string;
  location: string;
  theme: string;
  tone: InvitationTone;
  extraDetails: string;
  type: InvitationMessageType;
}

/** POST /api/gemini/timeline request body. */
export interface TimelineRequest {
  eventTitle: string;
  occasion: OccasionType;
  startTime: string;
  endTime: string;
  guestCount: number;
  vibes: string;
  keyMoments: string;
}

/** POST /api/gemini/ideas request body. */
export interface IdeasRequest {
  occasion: OccasionType;
  guestCount: number;
  budget: number;
  theme: string;
  dietary: string;
  ageGroup: string;
}

/** Invitation wording as returned by the server (styling is applied client-side). */
export type GeneratedInvitation = Omit<InvitationDraft, 'tone' | 'cardStyle'>;

/** POST /api/gemini/themes response body. */
export interface ThemesResponse {
  success: boolean;
  themes: AITheme[];
}

/** POST /api/gemini/invitation response body. */
export interface InvitationResponse {
  success: boolean;
  invitation: GeneratedInvitation;
}

/** POST /api/gemini/timeline response body. */
export interface TimelineResponse {
  success: boolean;
  timeline: TimelineEvent[];
}

/** POST /api/gemini/ideas response body. */
export interface IdeasResponse {
  success: boolean;
  ideas: CuratedIdeas;
}
