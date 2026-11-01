import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { X, Check, DollarSign } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  initialExpense?: Expense | null;
  vendorNames?: string[];
}

const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'venue', label: 'Venue & Location' },
  { id: 'catering', label: 'Catering & Drinks' },
  { id: 'decor', label: 'Décor & Florals' },
  { id: 'entertainment', label: 'Entertainment & Music' },
  { id: 'photo', label: 'Photography & Video' },
  { id: 'favors', label: 'Favors & Stationery' },
  { id: 'apparel', label: 'Attire & Styling' },
  { id: 'other', label: 'Miscellaneous' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  vendorNames = [],
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialExpense?.name || '');
  const [category, setCategory] = useState<ExpenseCategory>(initialExpense?.category || 'decor');
  const [budgeted, setBudgeted] = useState(initialExpense?.budgeted?.toString() || '200');
  const [actual, setActual] = useState(initialExpense?.actual?.toString() || '0');
  const [status, setStatus] = useState<'planned' | 'deposit_paid' | 'paid_in_full'>(
    initialExpense?.status || 'planned'
  );
  const [vendorName, setVendorName] = useState(initialExpense?.vendorName || '');
  const [notes, setNotes] = useState(initialExpense?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialExpense?.id || `exp-${Date.now()}`,
      name: name.trim(),
      category,
      budgeted: parseFloat(budgeted) || 0,
      actual: parseFloat(actual) || 0,
      status,
      vendorName: vendorName.trim(),
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
          {initialExpense ? 'Edit Expense Item' : 'Add Celebration Expense'}
        </h2>
        <p className="text-xs text-stone-500 mb-5">
          Record budgeted amounts, actual payments made, and payment status.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Expense Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Wildflower Bud Vases"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
            />
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Budgeted Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="200"
                value={budgeted}
                onChange={(e) => setBudgeted(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Actual Amount Paid ($)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="0"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('planned')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                  status === 'planned'
                    ? 'bg-stone-100 text-stone-800 border-stone-300 ring-2 ring-stone-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                📝 Planned
              </button>
              <button
                type="button"
                onClick={() => setStatus('deposit_paid')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                  status === 'deposit_paid'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                ⏳ Deposit Paid
              </button>
              <button
                type="button"
                onClick={() => setStatus('paid_in_full')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                  status === 'paid_in_full'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                ✅ Paid in Full
              </button>
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Associated Vendor
            </label>
            <input
              type="text"
              list="vendor-options"
              placeholder="e.g. Bloom & Petal Florals"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
            />
            {vendorNames.length > 0 && (
              <datalist id="vendor-options">
                {vendorNames.map((vn, i) => (
                  <option key={i} value={vn} />
                ))}
              </datalist>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Notes & Contract Terms
            </label>
            <input
              type="text"
              placeholder="e.g. Balance due 48 hours prior to event"
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
              <span>{initialExpense ? 'Save Changes' : 'Add Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
