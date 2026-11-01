import React, { useState } from 'react';
import { EventData, OccasionType } from '../../types';
import { triggerFestiveConfetti } from '../../utils/confetti';
import { Modal, ModalActions } from '../ui/Modal';
import { ChoiceGroup, ChoiceOption, RequiredFieldsNote, SelectField, SelectOption, TextField } from '../ui/FormField';
import { FieldErrors, LIMITS, isValidEmail, parseAmount, sanitizeText } from '../ui/form';
import { useFormErrors } from '../ui/useFormErrors';

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

const OCCASION_OPTIONS: ChoiceOption<OccasionType>[] = OCCASIONS.map((o) => ({
  value: o.id,
  label: (
    <>
      <span aria-hidden="true">{o.emoji}</span>
      <span className="truncate">{o.label}</span>
    </>
  ),
}));

const EMOJI_CHOICES: { emoji: string; name: string }[] = [
  { emoji: '🌸', name: 'Blossom' },
  { emoji: '🎂', name: 'Birthday cake' },
  { emoji: '🥂', name: 'Clinking glasses' },
  { emoji: '🍾', name: 'Champagne' },
  { emoji: '🎉', name: 'Party popper' },
  { emoji: '💍', name: 'Ring' },
  { emoji: '🍼', name: 'Baby bottle' },
  { emoji: '✨', name: 'Sparkles' },
  { emoji: '🎈', name: 'Balloon' },
  { emoji: '🍰', name: 'Cake slice' },
  { emoji: '🌿', name: 'Herb' },
  { emoji: '⭐', name: 'Star' },
  { emoji: '🚀', name: 'Rocket' },
  { emoji: '🌺', name: 'Hibiscus' },
];

const EMOJI_OPTIONS: ChoiceOption<string>[] = EMOJI_CHOICES.map(({ emoji, name }) => ({
  value: emoji,
  label: <span aria-hidden="true">{emoji}</span>,
  ariaLabel: name,
  selectedClassName: 'bg-rose-100 border-rose-500 ring-2 ring-rose-500 scale-110',
}));

const STATUS_OPTIONS: SelectOption<EventData['status']>[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'celebrated', label: 'Celebrated' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_PALETTE = [
  { name: 'Rose Petal', hex: '#FFCAD4' },
  { name: 'Peach Cream', hex: '#FFE5D9' },
  { name: 'Champagne', hex: '#FFF1E6' },
  { name: 'Sage Leaf', hex: '#D8E2DC' },
];

type EventField = 'title' | 'date' | 'hostEmail' | 'totalBudget';

interface EventFormValues {
  title: string;
  occasion: OccasionType;
  date: string;
  time: string;
  location: string;
  venueName: string;
  hostName: string;
  hostEmail: string;
  totalBudget: number;
  coverEmoji: string;
  status: EventData['status'];
}

/**
 * Builds the saved event. Editing spreads the existing event first so data the
 * form doesn't touch (guests, invitation draft, menu ideas, ...) is preserved;
 * brand-new events get starter tasks and a sample timeline.
 */
function buildEvent(values: EventFormValues, initial?: EventData | null): EventData {
  const host = values.hostName || 'Host';
  if (initial) {
    return { ...initial, ...values, hostName: host };
  }
  const now = Date.now();
  return {
    id: `event-${now}`,
    ...values,
    hostName: host,
    coverColor: 'from-rose-100 via-orange-50 to-amber-100',
    themeTitle: `${values.occasion.replace('_', ' ')} celebration`,
    themeDescription: 'Warm festive celebratory vibe',
    themePalette: DEFAULT_PALETTE,
    guests: [],
    expenses: [],
    tasks: [
      {
        id: `t-${now}-1`,
        title: 'Confirm venue booking and pay deposit',
        phase: '1_month_before',
        dueDate: values.date,
        completed: false,
        priority: 'high',
        assignedTo: host,
      },
      {
        id: `t-${now}-2`,
        title: 'Draft invitations and create guest list',
        phase: '1_month_before',
        dueDate: values.date,
        completed: false,
        priority: 'high',
        assignedTo: host,
      },
    ],
    vendors: [],
    timeline: [
      {
        id: `tl-${now}-1`,
        time: values.time || '5:00 PM',
        title: 'Guest Arrival & Welcome Drinks',
        description: 'Acoustic background music, greeting drinks, photo wall',
        category: 'arrival',
        assignedTo: host,
      },
      {
        id: `tl-${now}-2`,
        time: '6:30 PM',
        title: 'Dinner & Feast',
        description: 'Main feast served to guests',
        category: 'food',
        assignedTo: 'Catering Lead',
      },
      {
        id: `tl-${now}-3`,
        time: '7:45 PM',
        title: 'Celebration Toast & Cake',
        description: 'Toasts, speeches, cake cutting, and music',
        category: 'toast',
        assignedTo: host,
      },
    ],
    notes: '',
  };
}

export const CreateOrEditEventModal: React.FC<CreateOrEditEventModalProps> = ({ isOpen, onClose, ...formProps }) => {
  const isEditing = Boolean(formProps.initialEvent);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={formProps.initialEvent?.coverEmoji ?? '🌸'}
      title={isEditing ? 'Edit Celebration Details' : 'Plan a New Celebration'}
      description={
        isEditing ? 'Update event date, venue, budget, or theme' : 'Fill in the basics to get your celebration underway'
      }
    >
      <EventForm onClose={onClose} {...formProps} />
    </Modal>
  );
};

const EventForm: React.FC<Omit<CreateOrEditEventModalProps, 'isOpen'>> = ({ onClose, onSave, initialEvent }) => {
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [occasion, setOccasion] = useState<OccasionType>(initialEvent?.occasion ?? 'birthday');
  const [date, setDate] = useState(initialEvent?.date ?? '2026-11-28');
  const [time, setTime] = useState(initialEvent?.time ?? '5:00 PM');
  const [location, setLocation] = useState(initialEvent?.location ?? '');
  const [venueName, setVenueName] = useState(initialEvent?.venueName ?? '');
  const [hostName, setHostName] = useState(initialEvent?.hostName ?? '');
  const [hostEmail, setHostEmail] = useState(initialEvent?.hostEmail ?? '');
  const [totalBudget, setTotalBudget] = useState(String(initialEvent?.totalBudget ?? 2500));
  const [coverEmoji, setCoverEmoji] = useState(initialEvent?.coverEmoji ?? '🌸');
  const [status, setStatus] = useState<EventData['status']>(initialEvent?.status ?? 'planning');
  const { errors, check, clearError, formRef } = useFormErrors<EventField>();

  const handleOccasionChange = (id: OccasionType) => {
    setOccasion(id);
    const match = OCCASIONS.find((o) => o.id === id);
    if (match) setCoverEmoji(match.emoji);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, LIMITS.title);
    const cleanEmail = sanitizeText(hostEmail, LIMITS.email);
    const budget = parseAmount(totalBudget);

    const next: FieldErrors<EventField> = {};
    if (!cleanTitle) next.title = 'Please give your celebration a title.';
    if (!DATE_PATTERN.test(date)) next.date = 'Please choose the event date.';
    if (cleanEmail && !isValidEmail(cleanEmail)) next.hostEmail = 'Enter a valid email, e.g. host@example.com.';
    if (budget === null) next.totalBudget = `Enter a budget between $0 and $${LIMITS.amount.toLocaleString()}.`;
    if (!check(next)) return;

    onSave(
      buildEvent(
        {
          title: cleanTitle,
          occasion,
          date,
          time: sanitizeText(time, 20),
          location: sanitizeText(location, LIMITS.title),
          venueName: sanitizeText(venueName, LIMITS.title),
          hostName: sanitizeText(hostName, LIMITS.name),
          hostEmail: cleanEmail,
          totalBudget: budget || 1000,
          coverEmoji,
          status,
        },
        initialEvent,
      ),
    );
    triggerFestiveConfetti();
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      <RequiredFieldsNote />
      <TextField
        label="Celebration Title"
        required
        maxLength={LIMITS.title}
        placeholder="e.g. Maya's 30th Garden Soirée"
        value={title}
        error={errors.title}
        onChange={(e) => {
          setTitle(e.target.value);
          clearError('title');
        }}
      />

      <ChoiceGroup
        legend="Occasion Type"
        value={occasion}
        onChange={handleOccasionChange}
        options={OCCASION_OPTIONS}
        layoutClassName="grid grid-cols-2 sm:grid-cols-4 gap-2"
        optionClassName="p-2 text-xs"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextField
          label="Event Date"
          type="date"
          required
          value={date}
          error={errors.date}
          onChange={(e) => {
            setDate(e.target.value);
            clearError('date');
          }}
        />
        <TextField
          label="Start Time"
          maxLength={20}
          placeholder="e.g. 4:00 PM"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <SelectField label="Status" value={status} onValueChange={setStatus} options={STATUS_OPTIONS} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Venue Name"
          maxLength={LIMITS.title}
          placeholder="e.g. The Botanical Glasshouse"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
        />
        <TextField
          label="City / Address"
          autoComplete="address-level2"
          maxLength={LIMITS.title}
          placeholder="e.g. Napa Valley, CA"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextField
          label="Host Name"
          autoComplete="name"
          maxLength={LIMITS.name}
          placeholder="e.g. Maya Lin"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />
        <TextField
          label="Host Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          placeholder="maya@example.com"
          value={hostEmail}
          error={errors.hostEmail}
          onChange={(e) => {
            setHostEmail(e.target.value);
            clearError('hostEmail');
          }}
        />
        <TextField
          label="Total Budget ($ USD)"
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.amount}
          step="0.01"
          placeholder="2500"
          value={totalBudget}
          error={errors.totalBudget}
          onChange={(e) => {
            setTotalBudget(e.target.value);
            clearError('totalBudget');
          }}
        />
      </div>

      <ChoiceGroup
        legend="Celebration Icon"
        value={coverEmoji}
        onChange={setCoverEmoji}
        options={EMOJI_OPTIONS}
        layoutClassName="flex items-center gap-1.5 flex-wrap"
        optionClassName="w-9 h-9 justify-center text-lg"
      />

      <ModalActions onCancel={onClose} submitLabel={initialEvent ? 'Save Changes' : 'Create Celebration'} />
    </form>
  );
};
