import React, { useState } from 'react';
import { EventData, TimelineEvent } from '../../types';
import {
  Clock,
  Plus,
  Sparkles,
  Printer,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  User,
  Lightbulb,
} from 'lucide-react';
import { TimelineModal } from '../modals/TimelineModal';
import { triggerMiniConfetti } from '../../utils/confetti';

interface TimelineTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onSwitchTab: (tab: string) => void;
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  prep: { label: 'Setup & Prep', bg: 'bg-stone-100', text: 'text-stone-700', icon: '🛠️' },
  arrival: { label: 'Guest Arrival', bg: 'bg-rose-100', text: 'text-rose-800', icon: '🥂' },
  activity: { label: 'Game / Activity', bg: 'bg-purple-100', text: 'text-purple-800', icon: '🎯' },
  food: { label: 'Feast & Meal', bg: 'bg-amber-100', text: 'text-amber-800', icon: '🍽️' },
  toast: { label: 'Toast & Speech', bg: 'bg-sky-100', text: 'text-sky-800', icon: '🎙️' },
  party: { label: 'Cake & Dance', bg: 'bg-pink-100', text: 'text-pink-800', icon: '💃' },
  wind_down: { label: 'Send-off', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✨' },
};

export const TimelineTab: React.FC<TimelineTabProps> = ({
  event,
  onUpdateEvent,
  onSwitchTab,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<TimelineEvent | null>(null);

  const handleToggleComplete = (id: string, e: React.MouseEvent) => {
    const updated = event.timeline.map((item) => {
      if (item.id === id) {
        const next = !item.completed;
        if (next) {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          triggerMiniConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
        }
        return { ...item, completed: next };
      }
      return item;
    });
    onUpdateEvent({ ...event, timeline: updated });
  };

  const handleSaveMilestone = (milestone: TimelineEvent) => {
    let updated: TimelineEvent[];
    if (editingMilestone) {
      updated = event.timeline.map((item) => (item.id === milestone.id ? milestone : item));
    } else {
      updated = [...event.timeline, milestone];
      triggerMiniConfetti(0.5, 0.5);
    }
    onUpdateEvent({ ...event, timeline: updated });
    setEditingMilestone(null);
  };

  const handleDeleteMilestone = (id: string) => {
    if (confirm('Delete this milestone from the schedule?')) {
      const updated = event.timeline.filter((item) => item.id !== id);
      onUpdateEvent({ ...event, timeline: updated });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar with actions */}
      <div className="bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <h2 className="font-serif-title text-2xl font-bold text-stone-900">
              Day-of Run of Show
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Hour-by-hour choreography for coordinators, hosts, caterers, and photographers.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onSwitchTab('ai-concierge')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Schedule</span>
          </button>

          <button
            onClick={() => {
              setEditingMilestone(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* Visual Timeline Stream */}
      <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 sm:p-8 shadow-xs relative">
        {event.timeline.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="font-serif-title text-base font-bold text-stone-800">
              No timeline milestones scheduled
            </h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Create your day-of flow or use our AI Generator to build an effortless schedule.
            </p>
            <button
              onClick={() => onSwitchTab('ai-concierge')}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Build Day-of Timeline with AI
            </button>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-8 before:absolute before:left-3 sm:before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-rose-100 space-y-6">
            {event.timeline.map((item, idx) => {
              const catInfo = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.prep;
              return (
                <div key={item.id} className="relative flex items-start gap-4 group">
                  {/* Timeline Node Icon Circle */}
                  <div
                    onClick={(e) => handleToggleComplete(item.id, e)}
                    className={`relative z-10 -ml-4 sm:-ml-8 w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white scale-105 shadow-sm'
                        : 'bg-white border-rose-300 hover:border-rose-500 text-stone-400 group-hover:scale-110 shadow-xs'
                    }`}
                    title={item.completed ? 'Completed' : 'Click to mark complete'}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs">{catInfo.icon}</span>
                    )}
                  </div>

                  {/* Milestone Card */}
                  <div
                    className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all ${
                      item.completed
                        ? 'bg-stone-50/70 border-stone-200/60 opacity-80'
                        : 'bg-stone-50/30 hover:bg-[#FAF7F2] border-[#EFE5D8] hover:border-rose-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-white font-mono font-bold text-xs tracking-tight shadow-xs">
                          {item.time}
                        </span>
                        <h3 className="font-serif-title font-bold text-base sm:text-lg text-stone-900">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${catInfo.bg} ${catInfo.text}`}
                        >
                          {catInfo.label}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => {
                              setEditingMilestone(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(item.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <User className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[11px] font-medium">Lead:</span>
                        <span className="font-semibold text-stone-800">{item.assignedTo}</span>
                      </div>

                      {item.tips && (
                        <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg text-[11px] italic">
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          <span>Tip: {item.tips}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
