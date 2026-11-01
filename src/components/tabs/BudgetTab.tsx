import React, { useState } from 'react';
import { EventData, Expense, ExpenseCategory } from '../../types';
import {
  DollarSign,
  Plus,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { ExpenseModal } from '../modals/ExpenseModal';
import { triggerMiniConfetti } from '../../utils/confetti';

interface BudgetTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({ event, onUpdateEvent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingBudgetLimit, setEditingBudgetLimit] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState(event.totalBudget.toString());

  // Metrics
  const totalBudget = event.totalBudget;
  const totalBudgeted = event.expenses.reduce((acc, exp) => acc + (exp.budgeted || 0), 0);
  const totalActual = event.expenses.reduce((acc, exp) => acc + (exp.actual || 0), 0);
  const totalCommitted = event.expenses.reduce(
    (acc, exp) => acc + (exp.actual > 0 ? exp.actual : exp.budgeted),
    0
  );
  const remaining = Math.max(0, totalBudget - totalCommitted);
  const percentageSpent = totalBudget > 0 ? Math.round((totalCommitted / totalBudget) * 100) : 0;

  // Categories list
  const categoryNames: Record<ExpenseCategory, string> = {
    venue: 'Venue & Location',
    catering: 'Catering & Drinks',
    decor: 'Décor & Florals',
    entertainment: 'Music & Entertainment',
    photo: 'Photography & Video',
    favors: 'Favors & Stationery',
    apparel: 'Attire & Styling',
    other: 'Miscellaneous',
  };

  const categoryTotals: Record<ExpenseCategory, { budgeted: number; actual: number }> = {
    venue: { budgeted: 0, actual: 0 },
    catering: { budgeted: 0, actual: 0 },
    decor: { budgeted: 0, actual: 0 },
    entertainment: { budgeted: 0, actual: 0 },
    photo: { budgeted: 0, actual: 0 },
    favors: { budgeted: 0, actual: 0 },
    apparel: { budgeted: 0, actual: 0 },
    other: { budgeted: 0, actual: 0 },
  };

  event.expenses.forEach((exp) => {
    if (categoryTotals[exp.category]) {
      categoryTotals[exp.category].budgeted += exp.budgeted || 0;
      categoryTotals[exp.category].actual += exp.actual || 0;
    }
  });

  const filteredExpenses =
    selectedCategory === 'all'
      ? event.expenses
      : event.expenses.filter((exp) => exp.category === selectedCategory);

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
    const val = parseFloat(newBudgetLimit) || 0;
    onUpdateEvent({ ...event, totalBudget: val });
    setEditingBudgetLimit(false);
  };

  const vendorNames = event.vendors.map((v) => v.name);

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

        {/* Committed / Spent */}
        <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Allocated</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-900">
            ${totalCommitted.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            {percentageSpent}% of total budget
          </p>
        </div>

        {/* Paid So Far */}
        <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Actual Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-900">
            ${totalActual.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Paid deposits & full settlements
          </p>
        </div>

        {/* Remaining */}
        <div
          className={`p-5 rounded-3xl border shadow-xs ${
            remaining > 0
              ? 'bg-white border-[#EFE5D8]'
              : 'bg-rose-50/80 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {remaining > 0 ? 'Remaining Funds' : 'Over Budget'}
            </span>
            <DollarSign className={`w-4 h-4 ${remaining > 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold ${
              remaining > 0 ? 'text-stone-900' : 'text-rose-700'
            }`}
          >
            ${remaining.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {remaining > 0 ? 'Available for extras' : 'Adjust expense allocations'}
          </p>
        </div>
      </div>

      {/* Visual Budget Progress Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#EFE5D8] shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
          <span>Budget Utilization Gauge</span>
          <span>
            ${totalCommitted.toLocaleString()} of ${totalBudget.toLocaleString()} ({percentageSpent}%)
          </span>
        </div>
        <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              percentageSpent > 100
                ? 'bg-rose-500'
                : percentageSpent > 85
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          />
        </div>
      </div>

      {/* Category Pills & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE5D8] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories ({event.expenses.length})
          </button>
          {Object.entries(categoryNames).map(([catKey, label]) => {
            const hasItems = event.expenses.some((e) => e.category === catKey);
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === catKey
                    ? 'bg-rose-500 text-white'
                    : hasItems
                    ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                }`}
              >
                {label}
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
                          {categoryNames[expense.category] || expense.category}
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
                            expense.status === 'paid_in_full'
                              ? 'bg-emerald-100 text-emerald-800'
                              : expense.status === 'deposit_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {expense.status === 'paid_in_full'
                            ? '✅ Paid in Full'
                            : expense.status === 'deposit_paid'
                            ? '⏳ Deposit Paid'
                            : '📝 Planned'}
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
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Expense"
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialExpense={editingExpense}
        vendorNames={vendorNames}
      />
    </div>
  );
};
