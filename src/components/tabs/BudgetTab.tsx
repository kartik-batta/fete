import React, { memo, useCallback, useMemo, useState } from 'react';
import { EventData, Expense, ExpenseCategory } from '../../types';
import { AlertCircle, DollarSign, Plus, TrendingUp, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { ExpenseModal } from '../modals/ExpenseModal';
import { triggerMiniConfetti } from '../../utils/confetti';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  clampPercent,
  getBudgetStats,
  getCategoryTotals,
  getOverAllocatedCategories,
  type BudgetPosition,
} from '../../utils/eventStats';

interface BudgetTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
}

type CategoryFilter = ExpenseCategory | 'all';

const GAUGE_COLORS = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-500',
  over: 'bg-rose-500',
} as const;

const POSITION_CARD: Record<
  BudgetPosition,
  { label: string; hint: string; card: string; icon: string; value: string }
> = {
  under: {
    label: 'Remaining Funds',
    hint: 'Available for extras',
    card: 'bg-white border-[#EFE5D8]',
    icon: 'text-emerald-500',
    value: 'text-stone-900',
  },
  on: {
    label: 'On Budget',
    hint: 'Every dollar is allocated',
    card: 'bg-amber-50/60 border-amber-200',
    icon: 'text-amber-500',
    value: 'text-stone-900',
  },
  over: {
    label: 'Over Budget',
    hint: 'Trim expenses or raise the limit',
    card: 'bg-rose-50/80 border-rose-200',
    icon: 'text-rose-500',
    value: 'text-rose-700',
  },
};

const STATUS_BADGES: Record<Expense['status'], { label: string; className: string }> = {
  paid_in_full: { label: '✅ Paid in Full', className: 'bg-emerald-100 text-emerald-800' },
  deposit_paid: { label: '⏳ Deposit Paid', className: 'bg-amber-100 text-amber-800' },
  planned: { label: '📝 Planned', className: 'bg-stone-100 text-stone-700' },
};

export const BudgetTab = memo(function BudgetTab({ event, onUpdateEvent }: BudgetTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [editingBudgetLimit, setEditingBudgetLimit] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState(event.totalBudget.toString());

  const {
    totalBudget,
    totalBudgeted,
    totalCommitted,
    totalPaid,
    outstanding,
    remaining,
    overBy,
    position,
    percentCommitted,
    health,
  } = useMemo(
    () => getBudgetStats(event.expenses, event.totalBudget),
    [event.expenses, event.totalBudget]
  );
  const categoryTotals = useMemo(() => getCategoryTotals(event.expenses), [event.expenses]);
  const overAllocated = useMemo(() => getOverAllocatedCategories(categoryTotals), [categoryTotals]);

  const filteredExpenses = useMemo(
    () =>
      selectedCategory === 'all'
        ? event.expenses
        : event.expenses.filter((exp) => exp.category === selectedCategory),
    [event.expenses, selectedCategory]
  );
  const vendorNames = useMemo(() => event.vendors.map((v) => v.name), [event.vendors]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingExpense(null);
  }, []);

  const handleSaveExpense = (expense: Expense) => {
    let updated: Expense[];
    if (editingExpense) {
      updated = event.expenses.map((e) => (e.id === expense.id ? expense : e));
    } else {
      updated = [expense, ...event.expenses];
      triggerMiniConfetti(0.5, 0.5);
    }
    onUpdateEvent({ ...event, expenses: updated });
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      const updated = event.expenses.filter((e) => e.id !== id);
      onUpdateEvent({ ...event, expenses: updated });
    }
  };

  const handleSaveBudgetLimit = () => {
    const parsed = parseFloat(newBudgetLimit);
    const val = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    onUpdateEvent({ ...event, totalBudget: val });
    setEditingBudgetLimit(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Budget Card */}
        <div className="p-5 rounded-3xl bg-white border border-[#EFE5D8] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Event Budget</span>
            <button
              onClick={() => {
                setNewBudgetLimit(totalBudget.toString());
                setEditingBudgetLimit(!editingBudgetLimit);
              }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              {editingBudgetLimit ? 'Cancel' : 'Edit Limit'}
            </button>
          </div>

          {editingBudgetLimit ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min={0}
                aria-label="Total event budget"
                value={newBudgetLimit}
                onChange={(e) => setNewBudgetLimit(e.target.value)}
                className="w-28 px-2 py-1 text-sm rounded-lg border border-stone-300 font-bold"
              />
              <button
                onClick={handleSaveBudgetLimit}
                className="px-2.5 py-1 text-xs bg-stone-900 text-white rounded-lg font-semibold"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl font-bold text-stone-900">
              ${totalBudget.toLocaleString()}
            </div>
          )}
          <p className="text-[11px] text-stone-500 mt-1">
            Overall financial allocation
          </p>
        </div>

        {/* Committed (actual cost once known, else estimate) */}
        <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Committed</span>
            <TrendingUp className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-900">
            ${totalCommitted.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            {percentCommitted}% of budget · estimated ${totalBudgeted.toLocaleString()}
          </p>
        </div>

        {/* Paid so far — deposits & full settlements only */}
        <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Paid So Far</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-900">
            ${totalPaid.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            ${outstanding.toLocaleString()} outstanding balance
          </p>
        </div>

        {/* Remaining / over budget */}
        <div className={`p-5 rounded-3xl border shadow-xs ${POSITION_CARD[position].card}`}>
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {POSITION_CARD[position].label}
            </span>
            <DollarSign className={`w-4 h-4 ${POSITION_CARD[position].icon}`} aria-hidden="true" />
          </div>
          <div className={`text-2xl sm:text-3xl font-bold ${POSITION_CARD[position].value}`}>
            {position === 'over' ? `Over by $${overBy.toLocaleString()}` : `$${remaining.toLocaleString()}`}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{POSITION_CARD[position].hint}</p>
        </div>
      </div>

      {/* Visual Budget Progress Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#EFE5D8] shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
          <span>Budget Utilization Gauge</span>
          <span>
            ${totalCommitted.toLocaleString()} of ${totalBudget.toLocaleString()} ({percentCommitted}%)
          </span>
        </div>
        <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${GAUGE_COLORS[health]}`}
            style={{ width: `${clampPercent(percentCommitted)}%` }}
          />
        </div>
      </div>

      {overAllocated.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 bg-rose-50/80 p-4 rounded-3xl border border-rose-200 text-xs text-rose-900"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <span className="font-semibold block mb-1">Categories running over their estimates</span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {overAllocated.map(({ category, overBy: catOver }) => (
                <li key={category}>
                  {EXPENSE_CATEGORY_LABELS[category]}: <strong>+${catOver.toLocaleString()}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Category Pills & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE5D8] shadow-xs">
        {/* Pills wrap instead of scrolling so no category label is clipped off-screen. */}
        <div className="flex flex-wrap items-center gap-1.5 py-1 min-w-0 flex-1">
          <button
            onClick={() => setSelectedCategory('all')}
            aria-pressed={selectedCategory === 'all'}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories ({event.expenses.length})
          </button>
          {EXPENSE_CATEGORIES.map((catKey) => {
            const hasItems = categoryTotals[catKey].count > 0;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                aria-pressed={selectedCategory === catKey}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === catKey
                    ? 'bg-rose-500 text-white'
                    : hasItems
                    ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                }`}
              >
                {EXPENSE_CATEGORY_LABELS[catKey]}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-[#EFE5D8] overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <DollarSign className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="font-serif-title text-base font-bold text-stone-800">
              No expenses in this category
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Add your bookings, floral quotes, catering estimates, and equipment rentals.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EFE5D8] text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Item & Vendor</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Budgeted</th>
                  <th className="py-3 px-3">Actual Paid</th>
                  <th className="py-3 px-3">Variance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredExpenses.map((expense) => {
                  const variance = (expense.actual || 0) - (expense.budgeted || 0);
                  return (
                    <tr key={expense.id} className="hover:bg-stone-50/60 transition group">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-stone-900 text-sm">
                          {expense.name}
                        </div>
                        {expense.vendorName && (
                          <div className="text-[11px] text-stone-500 font-medium">
                            Vendor: {expense.vendorName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 capitalize">
                          {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-stone-900 font-mono">
                        ${expense.budgeted.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-stone-900 font-mono">
                        ${(expense.actual || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3">
                        {expense.actual > 0 ? (
                          variance > 0 ? (
                            <span className="text-rose-600 font-semibold font-mono">
                              +${variance.toLocaleString()}
                            </span>
                          ) : variance < 0 ? (
                            <span className="text-emerald-600 font-semibold font-mono">
                              -${Math.abs(variance).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-stone-400 font-mono">$0</span>
                          )
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            (STATUS_BADGES[expense.status] ?? STATUS_BADGES.planned).className
                          }`}
                        >
                          {(STATUS_BADGES[expense.status] ?? STATUS_BADGES.planned).label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-stone-600 max-w-xs truncate">
                        {expense.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                            title="Edit Expense"
                            aria-label={`Edit ${expense.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Expense"
                            aria-label={`Delete ${expense.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveExpense}
        initialExpense={editingExpense}
        vendorNames={vendorNames}
      />
    </div>
  );
});
