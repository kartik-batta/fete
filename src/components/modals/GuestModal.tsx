import React, { useState } from 'react';
import { Guest } from '../../types';
import { X, Check } from 'lucide-react';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guest: Guest) => void;
  initialGuest?: Guest | null;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGuest,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialGuest?.name || '');
  const [email, setEmail] = useState(initialGuest?.email || '');
  const [phone, setPhone] = useState(initialGuest?.phone || '');
  const [rsvp, setRsvp] = useState<'attending' | 'declined' | 'pending'>(initialGuest?.rsvp || 'pending');
  const [plusOnes, setPlusOnes] = useState<number>(initialGuest?.plusOnes ?? 0);
  const [dietary, setDietary] = useState(initialGuest?.dietary || 'None');
  const [group, setGroup] = useState<'family' | 'friends' | 'colleagues' | 'vip' | 'other'>(initialGuest?.group || 'friends');
  const [tableNumber, setTableNumber] = useState(initialGuest?.tableNumber || '');
  const [notes, setNotes] = useState(initialGuest?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialGuest?.id || `g-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      rsvp,
      plusOnes: Math.max(0, plusOnes),
      dietary: dietary.trim() || 'None',
      group,
      tableNumber: tableNumber.trim(),
      notes: notes.trim(),
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
          {initialGuest ? 'Edit Guest' : 'Add Guest to Celebration'}
        </h2>
        <p className="text-xs text-stone-500 mb-5">
          Keep track of invitations, RSVP confirmations, plus-ones, and dietary restrictions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Guest Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Elena Rostova"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="elena@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
          </div>

          {/* RSVP Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              RSVP Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRsvp('attending')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  rsvp === 'attending'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                ✨ Attending
              </button>
              <button
                type="button"
                onClick={() => setRsvp('pending')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  rsvp === 'pending'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                ⏳ Pending
              </button>
              <button
                type="button"
                onClick={() => setRsvp('declined')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  rsvp === 'declined'
                    ? 'bg-stone-100 text-stone-800 border-stone-300 ring-2 ring-stone-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                💌 Declined
              </button>
            </div>
          </div>

          {/* Plus-Ones & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Plus Ones (+ Guests)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={plusOnes}
                onChange={(e) => setPlusOnes(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Guest Group
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm capitalize"
              >
                <option value="friends">Friends</option>
                <option value="family">Family</option>
                <option value="colleagues">Colleagues</option>
                <option value="vip">VIP</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Dietary Restrictions & Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Dietary Restrictions / Allergies
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetarian, Gluten-Free, Nut allergy"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Table / Seating Group
              </label>
              <input
                type="text"
                placeholder="e.g. Table 1 - Magnolia"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Personal Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Bringing a camera, needs high chair, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
            />
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
              <span>{initialGuest ? 'Save Changes' : 'Add Guest'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
