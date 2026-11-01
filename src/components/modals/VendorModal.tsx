import React, { useState } from 'react';
import { Vendor, VendorCategory } from '../../types';
import { X, Check } from 'lucide-react';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  initialVendor?: Vendor | null;
}

const CATEGORIES: { id: VendorCategory; label: string }[] = [
  { id: 'venue', label: 'Venue' },
  { id: 'catering', label: 'Catering & Bar' },
  { id: 'photography', label: 'Photography & Video' },
  { id: 'florist', label: 'Florals & Botany' },
  { id: 'music_dj', label: 'Music & DJ' },
  { id: 'cake_bakery', label: 'Bakery & Cake' },
  { id: 'rentals', label: 'Furniture & Rentals' },
  { id: 'decor', label: 'Styling & Lighting' },
  { id: 'other', label: 'Other Service' },
];

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVendor,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialVendor?.name || '');
  const [category, setCategory] = useState<VendorCategory>(initialVendor?.category || 'catering');
  const [contactPerson, setContactPerson] = useState(initialVendor?.contactPerson || '');
  const [phone, setPhone] = useState(initialVendor?.phone || '');
  const [email, setEmail] = useState(initialVendor?.email || '');
  const [website, setWebsite] = useState(initialVendor?.website || '');
  const [costQuote, setCostQuote] = useState(initialVendor?.costQuote?.toString() || '0');
  const [status, setStatus] = useState<'researching' | 'contacted' | 'booked' | 'paid'>(
    initialVendor?.status || 'researching'
  );
  const [notes, setNotes] = useState(initialVendor?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialVendor?.id || `v-${Date.now()}`,
      name: name.trim(),
      category,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      costQuote: parseFloat(costQuote) || 0,
      status,
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
          {initialVendor ? 'Edit Vendor Details' : 'Add Celebration Vendor'}
        </h2>
        <p className="text-xs text-stone-500 mb-5">
          Track vendor quotes, contact points, contracts, and booking status.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Vendor / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Olive & Fig Artisanal Catering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Quoted Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="25"
                placeholder="1200"
                value={costQuote}
                onChange={(e) => setCostQuote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Booking Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('researching')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                  status === 'researching'
                    ? 'bg-stone-100 text-stone-800 border-stone-300 ring-2 ring-stone-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                🔍 Researching
              </button>
              <button
                type="button"
                onClick={() => setStatus('contacted')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                  status === 'contacted'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                💬 Contacted
              </button>
              <button
                type="button"
                onClick={() => setStatus('booked')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                  status === 'booked'
                    ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                📌 Booked
              </button>
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                  status === 'paid'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                ✅ Paid
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="Chef Mateo"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="contact@vendor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Website / Portfolio URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Contract Terms & Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Deposit required by Oct 1st, arrival time 1:30 PM"
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
              <span>{initialVendor ? 'Save Changes' : 'Add Vendor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
