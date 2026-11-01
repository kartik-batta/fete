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

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'prep' | 'arrival' | 'activity' | 'food' | 'toast' | 'party' | 'wind_down';
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
  tone: 'warm' | 'playful' | 'elegant' | 'minimalist';
  cardStyle: 'floral' | 'champagne' | 'midnight' | 'minimalist';
}

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
  menuIdeas?: {
    starters: string[];
    mains: string[];
    desserts: string[];
    signatureDrinks: string[];
  };
  activityIdeas?: {
    title: string;
    duration: string;
    description: string;
    materialsNeeded?: string;
  }[];
  notes: string;
}
