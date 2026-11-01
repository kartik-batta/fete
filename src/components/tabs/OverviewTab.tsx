import React, { memo, useCallback, useMemo } from 'react';
import { EventData, InvitationDraft, MenuIdeas } from '../../types';
import {
  Sparkles,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  Music,
  Shirt,
  Utensils,
  PartyPopper,
  Mail,
  ListTodo,
  AlertTriangle,
} from 'lucide-react';
import { triggerMiniConfetti } from '../../utils/confetti';
import {
  clampPercent,
  getBudgetStats,
  getCommittedAmount,
  getDietaryNotes,
  getGuestStats,
  getLargestExpenses,
  getAttentionItems,
  getUpcomingTasks,
} from '../../utils/eventStats';

interface OverviewTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onSwitchTab: (tab: string) => void;
}

const UPCOMING_TASK_LIMIT = 4;
const DEFAULT_MUSIC_VIBE = 'Acoustic melodies, warm indie folk, and golden hour jazz';
const DEFAULT_ATTIRE = 'Festive chic with subtle pastel or earth tones';
const LARGEST_EXPENSE_LIMIT = 3;

const MENU_COURSES: { key: keyof MenuIdeas; label: string }[] = [
  { key: 'starters', label: 'Starters' },
  { key: 'mains', label: 'Mains' },
  { key: 'desserts', label: 'Desserts' },
  { key: 'signatureDrinks', label: 'Signature drinks' },
];

interface SavedPlansCardProps {
  menuIdeas?: MenuIdeas;
  invitationDraft?: InvitationDraft;
  onOpenAiStudio: () => void;
}

/** Shows the menu and invitation saved from AI Studio, or nothing if neither exists. */
const SavedPlansCard = memo(function SavedPlansCard({
  menuIdeas,
  invitationDraft,
  onOpenAiStudio,
}: SavedPlansCardProps) {
  const courses = menuIdeas ? MENU_COURSES.filter(({ key }) => menuIdeas[key]?.length > 0) : [];
  if (courses.length === 0 && !invitationDraft) return null;

  return (
    <section
      aria-labelledby="saved-plans-heading"
      className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 id="saved-plans-heading" className="font-serif-title text-xl font-bold text-stone-900">
          Saved from AI Studio
        </h2>
        <button
          type="button"
          onClick={onOpenAiStudio}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
        >
          Refine →
        </button>
      </div>

      {courses.length > 0 && menuIdeas && (
        <div>
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <Utensils className="w-3.5 h-3.5" aria-hidden="true" /> Menu
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {courses.map(({ key, label }) => (
              <div key={key} className="p-3 rounded-2xl bg-stone-50/80 border border-stone-100">
                <dt className="font-semibold text-stone-800 mb-1">{label}</dt>
                <dd className="text-stone-600">{menuIdeas[key].join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {invitationDraft && (
        <div>
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Invitation
          </h3>
          <figure className="p-4 rounded-2xl bg-[#FCFBF8] border border-stone-100 text-xs text-stone-700 space-y-1.5">
            {invitationDraft.headline && (
              <p className="font-serif-title text-base font-bold text-stone-900">{invitationDraft.headline}</p>
            )}
            {invitationDraft.greeting && <p>{invitationDraft.greeting}</p>}
            {invitationDraft.body && <p className="line-clamp-3">{invitationDraft.body}</p>}
            {(invitationDraft.detailsBlock?.when || invitationDraft.detailsBlock?.where) && (
              <p className="text-stone-500">
                {[invitationDraft.detailsBlock.when, invitationDraft.detailsBlock.where].filter(Boolean).join(' · ')}
              </p>
            )}
          </figure>
        </div>
      )}
    </section>
  );
});

const PRIORITY_BADGE_CLASSES = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
} as const;

export const OverviewTab = memo(function OverviewTab({ event, onUpdateEvent, onSwitchTab }: OverviewTabProps) {
  const handleToggleTask = useCallback(
    (taskId: string, e: React.MouseEvent<HTMLElement>) => {
      const task = event.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const completed = !task.completed;
      if (completed) {
        const rect = e.currentTarget.getBoundingClientRect();
        triggerMiniConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
      }
      onUpdateEvent({
        ...event,
        tasks: event.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)),
      });
    },
    [event, onUpdateEvent]
  );

  const openAiStudio = useCallback(() => onSwitchTab('ai-concierge'), [onSwitchTab]);
  const guestStats = useMemo(() => getGuestStats(event.guests), [event.guests]);
  const dietaryItems = useMemo(() => getDietaryNotes(event.guests), [event.guests]);
  const nextTasks = useMemo(() => getUpcomingTasks(event.tasks, UPCOMING_TASK_LIMIT), [event.tasks]);
  const budget = useMemo(
    () => getBudgetStats(event.expenses, event.totalBudget),
    [event.expenses, event.totalBudget]
  );
  const attentionItems = useMemo(() => getAttentionItems(event), [event]);
  const largestExpenses = useMemo(
    () => getLargestExpenses(event.expenses, LARGEST_EXPENSE_LIMIT),
    [event.expenses]
  );

  return (
    <div className="space-y-6">
      {attentionItems.length > 0 && (
        <section
          aria-labelledby="needs-attention-heading"
          className="bg-white rounded-3xl border border-amber-200 p-5 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <h2 id="needs-attention-heading" className="font-serif-title text-lg font-bold text-stone-900">
              Needs attention
            </h2>
          </div>
          <ul className="flex flex-wrap gap-2">
            {attentionItems.map((item) => (
              <li key={item.kind}>
                <button
                  type="button"
                  onClick={() => onSwitchTab(item.tab)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition hover:shadow-xs ${
                    item.severity === 'high'
                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {item.message} →
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick AI Action Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AI Themes */}
        <button
          type="button"
          onClick={() => onSwitchTab('ai-concierge')}
          className="text-left w-full p-5 rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50/50 to-white border border-rose-100/90 shadow-xs hover:shadow-md hover:scale-[1.01] transition cursor-pointer group"
        >
          <span className="w-9 h-9 rounded-2xl bg-rose-200/60 flex items-center justify-center text-rose-700 mb-3 group-hover:scale-110 transition">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="block font-serif-title font-bold text-stone-900 text-base mb-1">
            AI Theme Generator
          </span>
          <span className="block text-xs text-stone-600 line-clamp-2 mb-3">
            Get personalized palettes, decor ideas, and styling concepts tailored to your budget.
          </span>
          <span className="flex items-center text-xs font-semibold text-rose-600 group-hover:gap-2 gap-1 transition-all">
            <span>Explore Themes</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </button>

        {/* Card 2: AI Invitations */}
        <button
          type="button"
          onClick={() => onSwitchTab('ai-concierge')}
          className="text-left w-full p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/40 to-white border border-amber-100/90 shadow-xs hover:shadow-md hover:scale-[1.01] transition cursor-pointer group"
        >
          <span className="w-9 h-9 rounded-2xl bg-amber-200/60 flex items-center justify-center text-amber-800 mb-3 group-hover:scale-110 transition">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="block font-serif-title font-bold text-stone-900 text-base mb-1">
            Custom Invitations
          </span>
          <span className="block text-xs text-stone-600 line-clamp-2 mb-3">
            Draft invitations & thank-you notes in warm, playful, or elegant editorial tones.
          </span>
          <span className="flex items-center text-xs font-semibold text-amber-700 group-hover:gap-2 gap-1 transition-all">
            <span>Draft Wording</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </button>

        {/* Card 3: Day-of Timeline */}
        <button
          type="button"
          onClick={() => onSwitchTab('timeline')}
          className="text-left w-full p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-100/90 shadow-xs hover:shadow-md hover:scale-[1.01] transition cursor-pointer group"
        >
          <span className="w-9 h-9 rounded-2xl bg-emerald-200/60 flex items-center justify-center text-emerald-800 mb-3 group-hover:scale-110 transition">
            <Clock className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="block font-serif-title font-bold text-stone-900 text-base mb-1">
            Day-of Run of Show
          </span>
          <span className="block text-xs text-stone-600 line-clamp-2 mb-3">
            Stress-free timeline with designated coordinators, vendor checks, and speech cues.
          </span>
          <span className="flex items-center text-xs font-semibold text-emerald-700 group-hover:gap-2 gap-1 transition-all">
            <span>View Schedule ({event.timeline.length})</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </button>

        {/* Card 4: Menu & Activities */}
        <button
          type="button"
          onClick={() => onSwitchTab('ai-concierge')}
          className="text-left w-full p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white border border-purple-100/90 shadow-xs hover:shadow-md hover:scale-[1.01] transition cursor-pointer group"
        >
          <span className="w-9 h-9 rounded-2xl bg-purple-200/60 flex items-center justify-center text-purple-800 mb-3 group-hover:scale-110 transition">
            <Utensils className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="block font-serif-title font-bold text-stone-900 text-base mb-1">
            Menu & Activities
          </span>
          <span className="block text-xs text-stone-600 line-clamp-2 mb-3">
            Generate artisanal course ideas, signature cocktails, and crowd-pleasing party games.
          </span>
          <span className="flex items-center text-xs font-semibold text-purple-700 group-hover:gap-2 gap-1 transition-all">
            <span>Discover Ideas</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* Main Grid: Pinterest Moodboard Style */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Theme Mood & Upcoming Tasks */}
        <div className="lg:col-span-7 space-y-6">
          {/* Moodboard Board Card */}
          <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <h2 className="font-serif-title text-xl font-bold text-stone-900">
                  Celebration Vibe & Aesthetic
                </h2>
              </div>
              <button
                onClick={() => onSwitchTab('ai-concierge')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Customize in AI Studio
              </button>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed mb-4 italic font-serif">
              "{event.themeDescription || 'A joyful gathering bringing loved ones together.'}"
            </p>

            {/* Color Palette Display */}
            <div className="mb-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-2">
                Curated Color Swatches
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {event.themePalette?.map((color) => (
                  <div
                    key={`${color.hex}-${color.name}`}
                    className="p-2 rounded-2xl border border-stone-100 bg-[#FCFBF8] shadow-xs flex flex-col items-center text-center"
                  >
                    <div
                      className="w-10 h-10 rounded-xl mb-1.5 border border-black/10 shadow-xs"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[11px] font-medium text-stone-800 truncate w-full">
                      {color.name}
                    </span>
                    <span className="text-[9px] font-mono text-stone-400 uppercase">
                      {color.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Styling Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
              <div className="flex items-start gap-2 text-stone-600 bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/60">
                <Music className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-stone-800 block">Ambiance:</span>
                  <span>{event.themeDetails?.musicVibe || DEFAULT_MUSIC_VIBE}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-stone-600 bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/60">
                <Shirt className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-stone-800 block">Guest Attire:</span>
                  <span>{event.themeDetails?.attire || DEFAULT_ATTIRE}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Checklist Card */}
          <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-600" />
                <h2 className="font-serif-title text-xl font-bold text-stone-900">
                  Priority To-Do Items
                </h2>
              </div>
              <button
                onClick={() => onSwitchTab('tasks')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View All ({event.tasks.length}) →
              </button>
            </div>

            {nextTasks.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-100">
                <PartyPopper className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-800">You're all caught up!</p>
                <p className="text-xs text-stone-500">Every priority task is checked off.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {nextTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-stone-100 hover:border-emerald-200 bg-stone-50/50 hover:bg-emerald-50/30 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTask(task.id, e)}
                        aria-label={`Mark "${task.title}" as done`}
                        className="w-5 h-5 rounded-lg border-2 border-stone-300 group-hover:border-emerald-500 flex items-center justify-center transition"
                      >
                        {task.completed && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      </button>
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-stone-800">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                          {task.dueDate && <span>Due: {task.dueDate}</span>}
                          <span>•</span>
                          <span>Assigned: {task.assignedTo}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        PRIORITY_BADGE_CLASSES[task.priority] ?? PRIORITY_BADGE_CLASSES.low
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SavedPlansCard
            menuIdeas={event.menuIdeas}
            invitationDraft={event.invitationDraft}
            onOpenAiStudio={openAiStudio}
          />
        </div>

        {/* Right Column (5 cols): RSVP Pulse & Budget Snapshot */}
        <div className="lg:col-span-5 space-y-6">
          {/* Guest RSVP Snapshot Card */}
          <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                <h2 className="font-serif-title text-xl font-bold text-stone-900">
                  Guest & RSVP Status
                </h2>
              </div>
              <button
                onClick={() => onSwitchTab('guests')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Manage Guests →
              </button>
            </div>

            {/* Status Pills */}
            <div className="grid grid-cols-3 gap-2 text-center mb-5">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-2xl font-bold text-emerald-700 block">
                  {guestStats.attending}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">
                  Attending
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                <span className="text-2xl font-bold text-amber-700 block">
                  {guestStats.pending}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">
                  Pending
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-100/70 border border-stone-200">
                <span className="text-2xl font-bold text-stone-700 block">
                  {guestStats.declined}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-800">
                  Declined
                </span>
              </div>
            </div>

            {/* Dietary Restrictions Highlights */}
            {dietaryItems.length > 0 && (
              <div className="border-t border-stone-100 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-2">
                  Dietary & Allergies to accommodate ({dietaryItems.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dietaryItems.map((item, idx) => (
                    <span
                      key={`${item.name}-${idx}`}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-100"
                    >
                      <strong className="font-semibold">{item.dietary}:</strong> {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget Snapshot Card */}
          <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <h2 className="font-serif-title text-xl font-bold text-stone-900">
                  Budget Snapshot
                </h2>
              </div>
              <button
                onClick={() => onSwitchTab('budget')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
              >
                Budget Details →
              </button>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs text-stone-500 block">Committed</span>
                <span className="text-2xl font-bold text-stone-900">${budget.totalCommitted.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 block">
                  {budget.position === 'over' ? 'Over budget' : budget.position === 'on' ? 'On budget' : 'Remaining'}
                </span>
                <span
                  className={`text-xl font-semibold ${
                    budget.position === 'over' ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {budget.position === 'over'
                    ? `+$${budget.overBy.toLocaleString()}`
                    : `$${budget.remaining.toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${clampPercent(budget.percentCommitted)}%` }}
              />
            </div>

            {/* Top Expenses */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Largest Bookings
              </span>
              {largestExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-stone-50 last:border-0"
                >
                  <span className="text-stone-700 truncate pr-2">{exp.name}</span>
                  <span className="font-semibold text-stone-900 font-mono">
                    ${getCommittedAmount(exp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
