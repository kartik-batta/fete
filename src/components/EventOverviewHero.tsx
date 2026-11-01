import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventData } from '../types';
import { Calendar, MapPin, Clock, Users, DollarSign, CheckCircle2, Sparkles, Edit3, Share2 } from 'lucide-react';
import { useDaysUntil } from '../hooks/useDaysUntil';
import {
  buildEventShareSummary,
  clampPercent,
  formatCountdown,
  getBudgetStats,
  getGuestStats,
  getTaskStats,
} from '../utils/eventStats';

interface EventOverviewHeroProps {
  event: EventData;
  onEditEvent: () => void;
  onSwitchTab: (tab: string) => void;
}

const COPIED_FEEDBACK_MS = 2000;

const BUDGET_BAR_COLORS = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-500',
  over: 'bg-red-500',
} as const;

/**
 * Copies text to the clipboard, falling back to a hidden textarea +
 * `execCommand('copy')` where the async Clipboard API is missing or blocked
 * (insecure origins, some embedded webviews).
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function formatEventDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const EventOverviewHero = memo(function EventOverviewHero({
  event,
  onEditEvent,
  onSwitchTab,
}: EventOverviewHeroProps) {
  const [shareFeedback, setShareFeedback] = useState<'copied' | 'failed' | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const daysLeft = useDaysUntil(event.date);
  const guestStats = useMemo(() => getGuestStats(event.guests), [event.guests]);
  const budget = useMemo(
    () => getBudgetStats(event.expenses, event.totalBudget),
    [event.expenses, event.totalBudget]
  );
  const taskStats = useMemo(() => getTaskStats(event.tasks), [event.tasks]);
  const formattedDate = useMemo(() => (event.date ? formatEventDate(event.date) : ''), [event.date]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const handleShare = useCallback(async () => {
    const copied = await copyText(buildEventShareSummary(event));
    setShareFeedback(copied ? 'copied' : 'failed');
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setShareFeedback(null), COPIED_FEEDBACK_MS);
  }, [event]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FCF8F5] to-[#FBF2EC] border border-[#EFE3D5] shadow-sm p-6 sm:p-8 mb-8">
      {/* Decorative subtle festive background elements */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-rose-200/40 via-amber-200/30 to-pink-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-56 h-56 bg-gradient-to-tr from-peach-200/30 via-orange-100/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-800 border border-rose-200/80 shadow-xs">
              <span aria-hidden="true">{event.coverEmoji || '✨'}</span>
              <span className="capitalize">{event.occasion.replaceAll('_', ' ')}</span>
            </span>

            {daysLeft !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/90 text-amber-900 border border-amber-200/80 shadow-xs">
                <span aria-hidden="true">⏳</span>
                <span>{formatCountdown(daysLeft, event.status)}</span>
              </span>
            )}

            <span className="text-xs text-stone-500 font-medium px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
              Host: <span className="text-stone-800 font-semibold">{event.hostName || 'You'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              title="Copy an event summary to share"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-white/80 hover:bg-white rounded-xl border border-stone-200 shadow-xs transition"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span aria-live="polite">
                {shareFeedback === 'copied' ? 'Summary copied!' : shareFeedback === 'failed' ? 'Copy failed' : 'Share'}
              </span>
            </button>
            <button
              type="button"
              onClick={onEditEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-rose-700 bg-white/80 hover:bg-rose-50 rounded-xl border border-stone-200 hover:border-rose-200 shadow-xs transition"
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Hero Title & Logistics Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 leading-[1.15]">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-stone-600 pt-1">
              {event.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-500" aria-hidden="true" />
                  <time dateTime={event.date} className="font-medium text-stone-800">
                    {formattedDate}
                  </time>
                </div>
              )}

              {event.time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  <span>{event.time}</span>
                </div>
              )}

              {(event.venueName || event.location) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                  <span className="truncate max-w-xs">{event.venueName || event.location}</span>
                </div>
              )}
            </div>

            {/* Event Theme & Palette Swatches */}
            {event.themeTitle && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Theme Concept:
                  </span>
                  <span className="text-xs font-bold text-stone-800">{event.themeTitle}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {event.themePalette?.map((color) => (
                    <div
                      key={`${color.hex}-${color.name}`}
                      className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 shadow-xs"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-[11px] font-medium text-stone-700">{color.name}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => onSwitchTab('ai-concierge')}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline ml-1"
                  >
                    Explore AI Themes →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            {/* Metric 1: Headcount */}
            <button
              type="button"
              onClick={() => onSwitchTab('guests')}
              className="bg-white/90 p-3 sm:p-4 rounded-2xl border border-rose-100 shadow-xs hover:border-rose-300 hover:shadow-md transition cursor-pointer group text-left w-full"
            >
              <span className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">RSVP</span>
                <Users className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition" aria-hidden="true" />
              </span>
              <span className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-stone-900">{guestStats.headcount}</span>
                <span className="text-[11px] text-stone-500">expected</span>
              </span>
              <span className="block text-[10px] text-stone-500 mt-1 truncate" title="Headcount includes plus-ones">
                {guestStats.attending} yes (incl. plus-ones: {guestStats.headcount})
              </span>
              <span className="block text-[10px] text-stone-400 truncate">
                {guestStats.pending} pending / {guestStats.invited} invited
              </span>
            </button>

            {/* Metric 2: Budget */}
            <button
              type="button"
              onClick={() => onSwitchTab('budget')}
              className="bg-white/90 p-3 sm:p-4 rounded-2xl border border-amber-100 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group text-left w-full"
            >
              <span className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Budget</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition" aria-hidden="true" />
              </span>
              <span className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-stone-900">${budget.totalCommitted.toLocaleString()}</span>
              </span>
              <span aria-hidden="true" className="block w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <span
                  className={`block h-full rounded-full transition-all duration-500 ${BUDGET_BAR_COLORS[budget.health]}`}
                  style={{ width: `${clampPercent(budget.percentCommitted)}%` }}
                />
              </span>
              <span className="block text-[10px] text-stone-500 mt-1 truncate">
                of ${event.totalBudget.toLocaleString()} limit
              </span>
            </button>

            {/* Metric 3: Checklist */}
            <button
              type="button"
              onClick={() => onSwitchTab('tasks')}
              className="bg-white/90 p-3 sm:p-4 rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer group text-left w-full"
            >
              <span className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">To-Do</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition" aria-hidden="true" />
              </span>
              <span className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-stone-900">{taskStats.percent}%</span>
                <span className="text-[11px] text-stone-500">done</span>
              </span>
              <span aria-hidden="true" className="block w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <span
                  className="block h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${taskStats.percent}%` }}
                />
              </span>
              <span className="block text-[10px] text-stone-500 mt-1 truncate">
                {taskStats.completed}/{taskStats.total} tasks completed
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
