import React, { useState } from 'react';
import { EventData, OccasionType } from '../../types';
import { X, Sparkles, Calendar, DollarSign, MapPin, User, Check } from 'lucide-react';
import { triggerFestiveConfetti } from '../../utils/confetti';

interface CreateOrEditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventData) => void;
  initialEvent?: EventData | null;
}

const OCCASIONS: { id: OccasionType; label: string; emoji: string }[] = [
  { id: 'birthday', label: 'Birthday Party', emoji: '🎂' },
  { id: 'wedding', label: 'Wedding / Rehearsal', emoji: '💍' },
  { id: 'baby_shower', label: 'Baby Shower', emoji: '🍼' },
  { id: 'anniversary', label: 'Anniversary', emoji: '🥂' },
  { id: 'office_party', label: 'Office / Corporate', emoji: '🎉' },
  { id: 'dinner_party', label: 'Dinner Soirée', emoji: '🍷' },
  { id: 'holiday', label: 'Holiday Gathering', emoji: '🎄' },
  { id: 'other', label: 'Other Celebration', emoji: '✨' },
];

export const CreateOrEditEventModal: React.FC<CreateOrEditEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialEvent);

  const [title, setTitle] = useState(initialEvent?.title || '');
  const [occasion, setOccasion] = useState<OccasionType>(initialEvent?.occasion || 'birthday');
  const [date, setDate] = useState(initialEvent?.date || '2026-11-28');
  const [time, setTime] = useState(initialEvent?.time || '5:00 PM');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [venueName, setVenueName] = useState(initialEvent?.venueName || '');
  const [hostName, setHostName] = useState(initialEvent?.hostName || '');
  const [hostEmail, setHostEmail] = useState(initialEvent?.hostEmail || '');
  const [totalBudget, setTotalBudget] = useState(initialEvent?.totalBudget?.toString() || '2500');
  const [coverEmoji, setCoverEmoji] = useState(initialEvent?.coverEmoji || '🌸');
  const [themeTitle, setThemeTitle] = useState(initialEvent?.themeTitle || '');
  const [notes, setNotes] = useState(initialEvent?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const savedEvent: EventData = {
      id: initialEvent?.id || `event-${Date.now()}`,
      title: title.trim(),
      occasion,
      date,
      time,
      location,
      venueName,
      hostName: hostName || 'Host',
      hostEmail,
      totalBudget: parseFloat(totalBudget) || 1000,
      coverEmoji,
      coverColor: initialEvent?.coverColor || 'from-rose-100 via-orange-50 to-amber-100',
      status: initialEvent?.status || 'planning',
      themeTitle: themeTitle || `${occasion.replace('_', ' ')} celebration`,
      themeDescription: initialEvent?.themeDescription || 'Warm festive celebratory vibe',
      themePalette: initialEvent?.themePalette || [
        { name: 'Rose Petal', hex: '#FFCAD4' },
        { name: 'Peach Cream', hex: '#FFE5D9' },
        { name: 'Champagne', hex: '#FFF1E6' },
        { name: 'Sage Leaf', hex: '#D8E2DC' },
      ],
      guests: initialEvent?.guests || [],
      expenses: initialEvent?.expenses || [],
      tasks: initialEvent?.tasks || [
        {
          id: `t-${Date.now()}-1`,
          title: 'Confirm venue booking and pay deposit',
          phase: '1_month_before',
          dueDate: date,
          completed: false,
          priority: 'high',
          assignedTo: hostName || 'Host',
        },
        {
          id: `t-${Date.now()}-2`,
          title: 'Draft invitations and create guest list',
          phase: '1_month_before',
          dueDate: date,
          completed: false,
          priority: 'high',
          assignedTo: hostName || 'Host',
        },
      ],
      vendors: initialEvent?.vendors || [],
      timeline: initialEvent?.timeline || [
        {
          id: `tl-${Date.now()}-1`,
          time: time || '5:00 PM',
          title: 'Guest Arrival & Welcome Drinks',
          description: 'Acoustic background music, greeting drinks, photo wall',
          category: 'arrival',
          assignedTo: hostName || 'Host',
        },
        {
          id: `tl-${Date.now()}-2`,
          time: '6:30 PM',
          title: 'Dinner & Feast',
          description: 'Main feast served to guests',
          category: 'food',
          assignedTo: 'Catering Lead',
        },
        {
          id: `tl-${Date.now()}-3`,
          time: '7:45 PM',
          title: 'Celebration Toast & Cake',
          description: 'Toasts, speeches, cake cutting, and music',
          category: 'toast',
          assignedTo: hostName || 'Host',
        },
      ],
      notes,
    };

    onSave(savedEvent);
    triggerFestiveConfetti();
    onClose();
  };

  const emojiChoices = ['🌸', '🎂', '🥂', '🍾', '🎉', '💍', '🍼', '✨', '🎈', '🍰', '🌿', '⭐', '🚀', '🌺'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-xl">
            {coverEmoji}
          </div>
          <div>
            <h2 className="font-serif-title text-2xl font-bold text-stone-900">
              {isEditing ? 'Edit Celebration Details' : 'Plan a New Celebration'}
            </h2>
            <p className="text-xs text-stone-500">
              {isEditing ? 'Update event date, venue, budget, or theme' : 'Fill in the basics to get your celebration underway'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Celebration Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maya's 30th Garden Soirée"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
            />
          </div>

          {/* Occasion Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Occasion Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {OCCASIONS.map((occ) => {
                const isSelected = occasion === occ.id;
                return (
                  <button
                    type="button"
                    key={occ.id}
                    onClick={() => {
                      setOccasion(occ.id);
                      setCoverEmoji(occ.emoji);
                    }}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-left border text-xs font-medium transition ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50/80 text-rose-900 font-semibold ring-1 ring-rose-400'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span>{occ.emoji}</span>
                    <span className="truncate">{occ.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Event Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Start Time
              </label>
              <input
                type="text"
                placeholder="e.g. 4:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
              />
            </div>
          </div>

          {/* Venue & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                placeholder="e.g. The Botanical Glasshouse"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                City / Address
              </label>
              <input
                type="text"
                placeholder="e.g. Napa Valley, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
          </div>

          {/* Host & Total Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Host Name
              </label>
              <input
                type="text"
                placeholder="e.g. Maya Lin"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Total Budget ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="2500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Emoji Badge selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Celebration Icon
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {emojiChoices.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setCoverEmoji(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${
                    coverEmoji === em
                      ? 'bg-rose-100 ring-2 ring-rose-400 scale-110'
                      : 'bg-stone-100 hover:bg-stone-200'
                  }`}
                >
                  {em}
                </button>
              ))}
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
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md hover:shadow-lg transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Celebration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
