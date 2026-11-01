import React, { useState } from 'react';
import { Guest } from '../../types';
import { Modal, ModalActions } from '../ui/Modal';
import { ChoiceGroup, ChoiceOption, RequiredFieldsNote, SelectField, SelectOption, TextField } from '../ui/FormField';
import { FieldErrors, LIMITS, isValidEmail, isValidPhone, sanitizeText } from '../ui/form';
import { useFormErrors } from '../ui/useFormErrors';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guest: Guest) => void;
  initialGuest?: Guest | null;
}

const MAX_PLUS_ONES = 10;

const RSVP_OPTIONS: ChoiceOption<Guest['rsvp']>[] = [
  { value: 'attending', label: '✨ Attending', selectedClassName: 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400' },
  { value: 'pending', label: '⏳ Pending', selectedClassName: 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-400' },
  { value: 'declined', label: '💌 Declined', selectedClassName: 'bg-stone-100 text-stone-900 border-stone-500 ring-2 ring-stone-400' },
];

const GROUP_OPTIONS: SelectOption<Guest['group']>[] = [
  { value: 'friends', label: 'Friends' },
  { value: 'family', label: 'Family' },
  { value: 'colleagues', label: 'Colleagues' },
  { value: 'vip', label: 'VIP' },
  { value: 'other', label: 'Other' },
];

type GuestField = 'name' | 'email' | 'phone' | 'plusOnes';

export const GuestModal: React.FC<GuestModalProps> = ({ isOpen, onClose, onSave, initialGuest }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={initialGuest ? 'Edit Guest' : 'Add Guest to Celebration'}
    description="Keep track of invitations, RSVP confirmations, plus-ones, and dietary restrictions."
  >
    <GuestForm initialGuest={initialGuest} onSave={onSave} onClose={onClose} />
  </Modal>
);

const GuestForm: React.FC<Omit<GuestModalProps, 'isOpen'>> = ({ initialGuest, onSave, onClose }) => {
  const [name, setName] = useState(initialGuest?.name ?? '');
  const [email, setEmail] = useState(initialGuest?.email ?? '');
  const [phone, setPhone] = useState(initialGuest?.phone ?? '');
  const [rsvp, setRsvp] = useState<Guest['rsvp']>(initialGuest?.rsvp ?? 'pending');
  const [plusOnes, setPlusOnes] = useState(String(initialGuest?.plusOnes ?? 0));
  const [dietary, setDietary] = useState(initialGuest?.dietary ?? 'None');
  const [group, setGroup] = useState<Guest['group']>(initialGuest?.group ?? 'friends');
  const [tableNumber, setTableNumber] = useState(initialGuest?.tableNumber ?? '');
  const [notes, setNotes] = useState(initialGuest?.notes ?? '');
  const { errors, check, clearError, formRef } = useFormErrors<GuestField>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      name: sanitizeText(name, LIMITS.name),
      email: sanitizeText(email, LIMITS.email),
      phone: sanitizeText(phone, LIMITS.phone),
    };
    const plusOnesNum = Number(plusOnes);

    const next: FieldErrors<GuestField> = {};
    if (!clean.name) next.name = 'Please enter the guest’s name.';
    if (clean.email && !isValidEmail(clean.email)) next.email = 'Enter a valid email, e.g. name@example.com.';
    if (clean.phone && !isValidPhone(clean.phone)) next.phone = 'Use digits, spaces, +, -, ( or ) only.';
    if (!Number.isInteger(plusOnesNum) || plusOnesNum < 0 || plusOnesNum > MAX_PLUS_ONES) {
      next.plusOnes = `Enter a whole number from 0 to ${MAX_PLUS_ONES}.`;
    }
    if (!check(next)) return;

    onSave({
      id: initialGuest?.id ?? `g-${Date.now()}`,
      ...clean,
      rsvp,
      plusOnes: plusOnesNum,
      dietary: sanitizeText(dietary, LIMITS.short) || 'None',
      group,
      tableNumber: sanitizeText(tableNumber, LIMITS.short),
      notes: sanitizeText(notes, LIMITS.notes),
    });
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      <RequiredFieldsNote />
      <TextField
        label="Guest Name"
        required
        autoComplete="off"
        maxLength={LIMITS.name}
        placeholder="e.g. Elena Rostova"
        value={name}
        error={errors.name}
        onChange={(e) => {
          setName(e.target.value);
          clearError('name');
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Email Address"
          type="email"
          inputMode="email"
          autoComplete="off"
          maxLength={LIMITS.email}
          placeholder="elena@example.com"
          value={email}
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError('email');
          }}
        />
        <TextField
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={LIMITS.phone}
          placeholder="(555) 000-0000"
          value={phone}
          error={errors.phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError('phone');
          }}
        />
      </div>

      <ChoiceGroup legend="RSVP Status" value={rsvp} onChange={setRsvp} options={RSVP_OPTIONS} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Plus Ones (+ Guests)"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_PLUS_ONES}
          step={1}
          value={plusOnes}
          error={errors.plusOnes}
          onChange={(e) => {
            setPlusOnes(e.target.value);
            clearError('plusOnes');
          }}
        />
        <SelectField label="Guest Group" value={group} onValueChange={setGroup} options={GROUP_OPTIONS} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Dietary Restrictions / Allergies"
          maxLength={LIMITS.short}
          placeholder="e.g. Vegetarian, Nut allergy"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
        />
        <TextField
          label="Table / Seating Group"
          maxLength={LIMITS.short}
          placeholder="e.g. Table 1 - Magnolia"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
        />
      </div>

      <TextField
        label="Personal Notes"
        maxLength={LIMITS.notes}
        placeholder="e.g. Bringing a camera, needs high chair, etc."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <ModalActions onCancel={onClose} submitLabel={initialGuest ? 'Save Changes' : 'Add Guest'} />
    </form>
  );
};
