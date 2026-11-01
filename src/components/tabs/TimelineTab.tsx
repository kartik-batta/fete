import React, { useEffect, useMemo, useState } from 'react';
import { EventData, TimelineEvent } from '../../types';
import { Check, Clock, Edit2, Lightbulb, Plus, Printer, Radio, Sparkles, Trash2, User } from 'lucide-react';
import { TimelineModal } from '../modals/TimelineModal';
import { triggerMiniConfetti } from '../../utils/confetti';
import { IconButton } from '../ui/IconButton';
import { LiveRegion, useAnnouncer } from '../ui/LiveRegion';
import { findCurrentIndex, sortByTime } from './scheduleTime';

interface TimelineTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onSwitchTab: (tab: string) => void;
}

const CATEGORY_STYLES: Record<TimelineEvent['category'], { label: string; className: string; icon: string }> = {
  prep: { label: 'Setup & Prep', className: 'bg-stone-100 text-stone-800', icon: '🛠️' },
  arrival: { label: 'Guest Arrival', className: 'bg-rose-100 text-rose-900', icon: '🥂' },
  activity: { label: 'Game / Activity', className: 'bg-purple-100 text-purple-900', icon: '🎯' },
  food: { label: 'Feast & Meal', className: 'bg-amber-100 text-amber-900', icon: '🍽️' },
  toast: { label: 'Toast & Speech', className: 'bg-sky-100 text-sky-900', icon: '🎙️' },
  party: { label: 'Cake & Dance', className: 'bg-pink-100 text-pink-900', icon: '💃' },
  wind_down: { label: 'Send-off', className: 'bg-emerald-100 text-emerald-900', icon: '✨' },
};

const minutesSinceMidnight = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Current minute-of-day, refreshed at most once a minute while `enabled`. */
function useMinuteClock(enabled: boolean): number {
  const [now, setNow] = useState(() => minutesSinceMidnight(new Date()));
  useEffect(() => {
    if (!enabled) return;
    setNow(minutesSinceMidnight(new Date()));
    const id = window.setInterval(() => setNow(minutesSinceMidnight(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ event, onUpdateEvent, onSwitchTab }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<TimelineEvent | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const { message, announce } = useAnnouncer();
  const nowMinutes = useMinuteClock(liveMode);

  const milestones = useMemo(() => sortByTime(event.timeline), [event.timeline]);
  const live = liveMode ? findCurrentIndex(milestones, nowMinutes) : null;

  const handleToggleComplete = (item: TimelineEvent, e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !item.completed;
    if (next) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerMiniConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
    }
    onUpdateEvent({
      ...event,
      timeline: event.timeline.map((m) => (m.id === item.id ? { ...m, completed: next } : m)),
    });
    announce(`${item.title} marked ${next ? 'done' : 'not done'}.`);
  };

  const handleSaveMilestone = (milestone: TimelineEvent) => {
    if (editingMilestone) {
      onUpdateEvent({ ...event, timeline: event.timeline.map((m) => (m.id === milestone.id ? milestone : m)) });
      announce(`Updated ${milestone.title}.`);
    } else {
      onUpdateEvent({ ...event, timeline: [...event.timeline, milestone] });
      triggerMiniConfetti(0.5, 0.5);
      announce(`Added ${milestone.title} at ${milestone.time}.`);
    }
    setEditingMilestone(null);
  };

  const handleDeleteMilestone = (item: TimelineEvent) => {
    if (window.confirm(`Delete "${item.title}" from the schedule?`)) {
      onUpdateEvent({ ...event, timeline: event.timeline.filter((m) => m.id !== item.id) });
      announce(`Deleted ${item.title}.`);
    }
  };

  return (
    <div className="space-y-6">
      <LiveRegion message={message} />

      <div className="bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              ⏱️
            </span>
            <h2 className="font-serif-title text-2xl font-bold text-stone-900">Day-of Run of Show</h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Hour-by-hour choreography for coordinators, hosts, caterers, and photographers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto" data-print-hide>
          <button
            type="button"
            aria-pressed={liveMode}
            onClick={() => setLiveMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              liveMode
                ? 'bg-rose-700 text-white border-rose-700'
                : 'border-stone-300 text-stone-800 hover:bg-stone-50'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${liveMode ? 'animate-pulse' : ''}`} aria-hidden="true" />
            <span>Live Mode{liveMode ? ': On' : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchTab('ai-concierge')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold border border-rose-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Generate with AI</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Print Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMilestone(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 sm:p-8 shadow-xs relative">
        {milestones.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-stone-400 mx-auto mb-2" aria-hidden="true" />
            <h3 className="font-serif-title text-base font-bold text-stone-800">No timeline milestones scheduled</h3>
            <p className="text-xs text-stone-600 mt-1 mb-4">
              Create your day-of flow or use our AI Generator to build an effortless schedule.
            </p>
            <button
              type="button"
              onClick={() => onSwitchTab('ai-concierge')}
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs inline-flex items-center gap-1.5"
              data-print-hide
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Build Day-of Timeline with AI
            </button>
          </div>
        ) : (
          <ol
            aria-label="Day-of schedule, in time order"
            className="relative pl-4 sm:pl-8 before:absolute before:left-3 sm:before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-rose-100 space-y-6"
          >
            {milestones.map((item, idx) => {
              const catInfo = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.prep;
              const isLive = live?.index === idx;
              const liveLabel = isLive ? (live?.isUpcoming ? 'Up next' : 'Happening now') : null;
              return (
                <li
                  key={item.id}
                  className="relative flex items-start gap-4 group"
                  aria-current={isLive && !live?.isUpcoming ? 'time' : undefined}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={Boolean(item.completed)}
                    aria-label={`Mark "${item.title}" at ${item.time} done`}
                    onClick={(e) => handleToggleComplete(item, e)}
                    className={`relative z-10 -ml-4 sm:-ml-8 w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.completed
                        ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                        : 'bg-white border-rose-400 hover:border-rose-600 group-hover:scale-110 shadow-xs'
                    }`}
                  >
                    {item.completed ? (
                      <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <span className="text-xs" aria-hidden="true">
                        {catInfo.icon}
                      </span>
                    )}
                  </button>

                  <div
                    data-print-card
                    className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all ${
                      item.completed
                        ? 'bg-stone-50/70 border-stone-200'
                        : 'bg-stone-50/30 hover:bg-[#FAF7F2] border-[#EFE5D8] hover:border-rose-200 hover:shadow-xs'
                    } ${isLive ? 'timeline-now' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <time className="px-2.5 py-1 rounded-xl bg-stone-900 text-white font-mono font-bold text-xs tracking-tight shadow-xs">
                          {item.time}
                        </time>
                        <h3
                          className={`font-serif-title font-bold text-base sm:text-lg ${
                            item.completed ? 'text-stone-600 line-through' : 'text-stone-900'
                          }`}
                        >
                          {item.title}
                        </h3>
                        {item.completed && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Done</span>
                        )}
                        {liveLabel && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-700 text-white">
                            {liveLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${catInfo.className}`}>
                          {catInfo.label}
                        </span>

                        {/* Revealed on hover and on keyboard focus. */}
                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition"
                          data-print-hide
                        >
                          <IconButton
                            label={`Edit ${item.title}`}
                            icon={Edit2}
                            className="p-1 rounded-lg"
                            onClick={() => {
                              setEditingMilestone(item);
                              setIsModalOpen(true);
                            }}
                          />
                          <IconButton
                            label={`Delete ${item.title}`}
                            icon={Trash2}
                            tone="danger"
                            className="p-1 rounded-lg"
                            onClick={() => handleDeleteMilestone(item)}
                          />
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-3">{item.description}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <User className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                        <span className="text-[11px] font-medium">Lead:</span>
                        <span className="font-semibold text-stone-800">{item.assignedTo}</span>
                      </div>

                      {item.tips && (
                        <div className="flex items-center gap-1 text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg text-[11px] italic">
                          <Lightbulb className="w-3 h-3 text-amber-700" aria-hidden="true" />
                          <span>Tip: {item.tips}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <TimelineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMilestone(null);
        }}
        onSave={handleSaveMilestone}
        initialEvent={editingMilestone}
      />
    </div>
  );
};
