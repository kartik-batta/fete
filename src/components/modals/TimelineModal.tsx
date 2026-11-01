import React, { useState } from 'react';
import { TimelineEvent } from '../../types';
import { X, Check } from 'lucide-react';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
  initialEvent?: TimelineEvent | null;
}

const CATEGORIES: { id: TimelineEvent['category']; label: string; emoji: string }[] = [
  { id: 'prep', label: 'Setup & Prep', emoji: '🛠️' },
  { id: 'arrival', label: 'Guest Arrival', emoji: '🥂' },
  { id: 'activity', label: 'Game / Activity', emoji: '🎯' },
  { id: 'food', label: 'Feast & Food', emoji: '🍽️' },
  { id: 'toast', label: 'Toast & Speech', emoji: '🎙️' },
  { id: 'party', label: 'Cake & Dance', emoji: '💃' },
  { id: 'wind_down', label: 'Farewell Send-off', emoji: '✨' },
];

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
}) => {
  if (!isOpen) return null;

  const [time, setTime] = useState(initialEvent?.time || '04:00 PM');
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [category, setCategory] = useState<TimelineEvent['category']>(initialEvent?.category || 'arrival');
  const [assignedTo, setAssignedTo] = useState(initialEvent?.assignedTo || 'Host');
  const [tips, setTips] = useState(initialEvent?.tips || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialEvent?.id || `tl-${Date.now()}`,
      time: time.trim(),
      title: title.trim(),
      description: description.trim(),
      category,
      assignedTo: assignedTo.trim() || 'Host',
      tips: tips.trim(),
      completed: initialEvent?.completed || false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-serif-title text-2xl font-bold text-stone-900 mb-1">
          {initialEvent ? 'Edit Milestone' : 'Add Day-Of Schedule Milestone'}
        </h2>
        <p className="text-xs text-stone-500 mb-5">
          Orchestrate exact times, transitions, responsible coordinators, and reminders.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Time *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 04:30 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-semibold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Milestone Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Welcome Spritz & Grazing Table"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-left border text-xs font-medium transition ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50/80 text-rose-900 font-semibold ring-1 ring-rose-400'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              What Happens (Description)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Guests arrive through conservatory; acoustic playlist plays; drinks poured"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Assigned Lead / Person
              </label>
              <input
                type="text"
                placeholder="e.g. Elena (Host) & Catering Lead"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Day-of Pro Tip / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Light candles 15 min prior"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialEvent ? 'Save Changes' : 'Add Milestone'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
