import React, { useId, useState } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { Modal, ModalActions } from '../ui/Modal';
import { ChoiceGroup, ChoiceOption, RequiredFieldsNote, SelectField, SelectOption, TextField } from '../ui/FormField';
import { FieldErrors, LIMITS, parseAmount, sanitizeText } from '../ui/form';
import { useFormErrors } from '../ui/useFormErrors';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  initialExpense?: Expense | null;
  vendorNames?: string[];
}

const CATEGORY_OPTIONS: SelectOption<ExpenseCategory>[] = [
  { value: 'venue', label: 'Venue & Location' },
  { value: 'catering', label: 'Catering & Drinks' },
  { value: 'decor', label: 'Décor & Florals' },
  { value: 'entertainment', label: 'Entertainment & Music' },
  { value: 'photo', label: 'Photography & Video' },
  { value: 'favors', label: 'Favors & Stationery' },
  { value: 'apparel', label: 'Attire & Styling' },
  { value: 'other', label: 'Miscellaneous' },
];

const STATUS_OPTIONS: ChoiceOption<Expense['status']>[] = [
  { value: 'planned', label: '📝 Planned', selectedClassName: 'bg-stone-100 text-stone-900 border-stone-500 ring-2 ring-stone-400' },
  { value: 'deposit_paid', label: '⏳ Deposit Paid', selectedClassName: 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-400' },
  { value: 'paid_in_full', label: '✅ Paid in Full', selectedClassName: 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400' },
];

type ExpenseField = 'name' | 'budgeted' | 'actual';

const AMOUNT_ERROR = `Enter an amount between $0 and $${LIMITS.amount.toLocaleString()}.`;

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, ...formProps }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={formProps.initialExpense ? 'Edit Expense Item' : 'Add Celebration Expense'}
    description="Record budgeted amounts, actual payments made, and payment status."
  >
    <ExpenseForm onClose={onClose} {...formProps} />
  </Modal>
);

const ExpenseForm: React.FC<Omit<ExpenseModalProps, 'isOpen'>> = ({
  onClose,
  onSave,
  initialExpense,
  vendorNames = [],
}) => {
  const [name, setName] = useState(initialExpense?.name ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(initialExpense?.category ?? 'decor');
  const [budgeted, setBudgeted] = useState(String(initialExpense?.budgeted ?? 200));
  const [actual, setActual] = useState(String(initialExpense?.actual ?? 0));
  const [status, setStatus] = useState<Expense['status']>(initialExpense?.status ?? 'planned');
  const [vendorName, setVendorName] = useState(initialExpense?.vendorName ?? '');
  const [notes, setNotes] = useState(initialExpense?.notes ?? '');
  const { errors, check, clearError, formRef } = useFormErrors<ExpenseField>();
  const vendorListId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, LIMITS.title);
    const budgetedNum = parseAmount(budgeted);
    const actualNum = parseAmount(actual);

    const next: FieldErrors<ExpenseField> = {};
    if (!cleanName) next.name = 'Please name this expense.';
    if (budgetedNum === null) next.budgeted = AMOUNT_ERROR;
    if (actualNum === null) next.actual = AMOUNT_ERROR;
    if (!check(next)) return;

    onSave({
      id: initialExpense?.id ?? `exp-${Date.now()}`,
      name: cleanName,
      category,
      budgeted: budgetedNum ?? 0,
      actual: actualNum ?? 0,
      status,
      vendorName: sanitizeText(vendorName, LIMITS.name),
      notes: sanitizeText(notes, LIMITS.notes),
    });
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      <RequiredFieldsNote />
      <TextField
        label="Expense Item Name"
        required
        maxLength={LIMITS.title}
        placeholder="e.g. Organic Wildflower Bud Vases"
        value={name}
        error={errors.name}
        onChange={(e) => {
          setName(e.target.value);
          clearError('name');
        }}
      />

      <SelectField label="Category" value={category} onValueChange={setCategory} options={CATEGORY_OPTIONS} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Budgeted Amount ($)"
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.amount}
          step="0.01"
          placeholder="200"
          value={budgeted}
          error={errors.budgeted}
          onChange={(e) => {
            setBudgeted(e.target.value);
            clearError('budgeted');
          }}
        />
        <TextField
          label="Actual Amount Paid ($)"
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.amount}
          step="0.01"
          placeholder="0"
          value={actual}
          error={errors.actual}
          onChange={(e) => {
            setActual(e.target.value);
            clearError('actual');
          }}
        />
      </div>

      <ChoiceGroup
        legend="Payment Status"
        value={status}
        onChange={setStatus}
        options={STATUS_OPTIONS}
        optionClassName="py-2 px-2.5 text-xs"
      />

      <TextField
        label="Associated Vendor"
        list={vendorNames.length > 0 ? vendorListId : undefined}
        maxLength={LIMITS.name}
        placeholder="e.g. Bloom & Petal Florals"
        value={vendorName}
        onChange={(e) => setVendorName(e.target.value)}
      />
      {vendorNames.length > 0 && (
        <datalist id={vendorListId}>
          {Array.from(new Set(vendorNames)).map((vn) => (
            <option key={vn} value={vn} />
          ))}
        </datalist>
      )}

      <TextField
        label="Notes & Contract Terms"
        maxLength={LIMITS.notes}
        placeholder="e.g. Balance due 48 hours prior to event"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <ModalActions onCancel={onClose} submitLabel={initialExpense ? 'Save Changes' : 'Add Expense'} />
    </form>
  );
};
