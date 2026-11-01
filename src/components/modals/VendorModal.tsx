import React, { useState } from 'react';
import { Vendor, VendorCategory } from '../../types';
import { Modal, ModalActions } from '../ui/Modal';
import {
  ChoiceGroup,
  ChoiceOption,
  RequiredFieldsNote,
  SelectField,
  SelectOption,
  TextAreaField,
  TextField,
} from '../ui/FormField';
import { FieldErrors, LIMITS, isValidEmail, isValidPhone, parseAmount, sanitizeText, toSafeHttpUrl } from '../ui/form';
import { useFormErrors } from '../ui/useFormErrors';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  initialVendor?: Vendor | null;
}

const CATEGORY_OPTIONS: SelectOption<VendorCategory>[] = [
  { value: 'venue', label: 'Venue' },
  { value: 'catering', label: 'Catering & Bar' },
  { value: 'photography', label: 'Photography & Video' },
  { value: 'florist', label: 'Florals & Botany' },
  { value: 'music_dj', label: 'Music & DJ' },
  { value: 'cake_bakery', label: 'Bakery & Cake' },
  { value: 'rentals', label: 'Furniture & Rentals' },
  { value: 'decor', label: 'Styling & Lighting' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other Service' },
];

const STATUS_OPTIONS: ChoiceOption<Vendor['status']>[] = [
  { value: 'researching', label: '🔍 Researching', selectedClassName: 'bg-stone-100 text-stone-900 border-stone-500 ring-2 ring-stone-400' },
  { value: 'contacted', label: '💬 Contacted', selectedClassName: 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-400' },
  { value: 'booked', label: '📌 Booked', selectedClassName: 'bg-rose-50 text-rose-900 border-rose-500 ring-2 ring-rose-400' },
  { value: 'paid', label: '✅ Paid', selectedClassName: 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400' },
];

type VendorField = 'name' | 'email' | 'phone' | 'website' | 'costQuote';

export const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, ...formProps }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={formProps.initialVendor ? 'Edit Vendor Details' : 'Add Celebration Vendor'}
    description="Track vendor quotes, contact points, contracts, and booking status."
  >
    <VendorForm onClose={onClose} {...formProps} />
  </Modal>
);

const VendorForm: React.FC<Omit<VendorModalProps, 'isOpen'>> = ({ onClose, onSave, initialVendor }) => {
  const [name, setName] = useState(initialVendor?.name ?? '');
  const [category, setCategory] = useState<VendorCategory>(initialVendor?.category ?? 'catering');
  const [contactPerson, setContactPerson] = useState(initialVendor?.contactPerson ?? '');
  const [phone, setPhone] = useState(initialVendor?.phone ?? '');
  const [email, setEmail] = useState(initialVendor?.email ?? '');
  const [website, setWebsite] = useState(initialVendor?.website ?? '');
  const [costQuote, setCostQuote] = useState(String(initialVendor?.costQuote ?? 0));
  const [status, setStatus] = useState<Vendor['status']>(initialVendor?.status ?? 'researching');
  const [notes, setNotes] = useState(initialVendor?.notes ?? '');
  const { errors, check, clearError, formRef } = useFormErrors<VendorField>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      name: sanitizeText(name, LIMITS.name),
      email: sanitizeText(email, LIMITS.email),
      phone: sanitizeText(phone, LIMITS.phone),
      website: sanitizeText(website, LIMITS.url),
    };
    const safeUrl = clean.website ? toSafeHttpUrl(clean.website) : '';
    const cost = parseAmount(costQuote);

    const next: FieldErrors<VendorField> = {};
    if (!clean.name) next.name = 'Please enter the vendor or business name.';
    if (clean.email && !isValidEmail(clean.email)) next.email = 'Enter a valid email, e.g. hello@vendor.com.';
    if (clean.phone && !isValidPhone(clean.phone)) next.phone = 'Use digits, spaces, +, -, ( or ) only.';
    if (safeUrl === null) next.website = 'Enter a valid http(s) web address.';
    if (cost === null) next.costQuote = `Enter an amount between $0 and $${LIMITS.amount.toLocaleString()}.`;
    if (!check(next)) return;

    onSave({
      id: initialVendor?.id ?? `v-${Date.now()}`,
      ...clean,
      website: safeUrl ?? '',
      category,
      contactPerson: sanitizeText(contactPerson, LIMITS.name),
      costQuote: cost ?? 0,
      status,
      notes: sanitizeText(notes, LIMITS.notes),
    });
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      <RequiredFieldsNote />
      <TextField
        label="Vendor / Business Name"
        required
        autoComplete="organization"
        maxLength={LIMITS.name}
        placeholder="e.g. Olive & Fig Artisanal Catering"
        value={name}
        error={errors.name}
        onChange={(e) => {
          setName(e.target.value);
          clearError('name');
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectField label="Category" value={category} onValueChange={setCategory} options={CATEGORY_OPTIONS} />
        <TextField
          label="Quoted Cost ($)"
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.amount}
          step="0.01"
          placeholder="1200"
          value={costQuote}
          error={errors.costQuote}
          onChange={(e) => {
            setCostQuote(e.target.value);
            clearError('costQuote');
          }}
        />
      </div>

      <ChoiceGroup
        legend="Booking Status"
        value={status}
        onChange={setStatus}
        options={STATUS_OPTIONS}
        layoutClassName="grid grid-cols-2 sm:grid-cols-4 gap-2"
        optionClassName="py-2 px-2 text-xs"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextField
          label="Contact Person"
          autoComplete="off"
          maxLength={LIMITS.name}
          placeholder="Chef Mateo"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
        />
        <TextField
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={LIMITS.phone}
          placeholder="(555) 123-4567"
          value={phone}
          error={errors.phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError('phone');
          }}
        />
        <TextField
          label="Email Address"
          type="email"
          inputMode="email"
          autoComplete="off"
          maxLength={LIMITS.email}
          placeholder="contact@vendor.com"
          value={email}
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError('email');
          }}
        />
      </div>

      <TextField
        label="Website / Portfolio URL"
        type="url"
        inputMode="url"
        autoComplete="url"
        maxLength={LIMITS.url}
        placeholder="https://..."
        value={website}
        error={errors.website}
        onChange={(e) => {
          setWebsite(e.target.value);
          clearError('website');
        }}
      />

      <TextAreaField
        label="Contract Terms & Details"
        maxLength={LIMITS.notes}
        placeholder="e.g. Deposit required by Oct 1st, arrival time 1:30 PM"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <ModalActions onCancel={onClose} submitLabel={initialVendor ? 'Save Changes' : 'Add Vendor'} />
    </form>
  );
};
