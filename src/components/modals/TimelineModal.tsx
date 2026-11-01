import React, { useState } from 'react';
import { TimelineEvent } from '../../types';
import { Modal, ModalActions } from '../ui/Modal';
import { ChoiceGroup, ChoiceOption, RequiredFieldsNote, TextAreaField, TextField } from '../ui/FormField';
import { FieldErrors, LIMITS, sanitizeText } from '../ui/form';
import { useFormErrors } from '../ui/useFormErrors';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
  initialEvent?: TimelineEvent | null;
}

const CATEGORY_OPTIONS: ChoiceOption<TimelineEvent['category']>[] = [
  { value: 'prep', label: '🛠️ Setup & Prep' },
  { value: 'arrival', label: '🥂 Guest Arrival' },
  { value: 'activity', label: '🎯 Game / Activity' },
  { value: 'food', label: '🍽️ Feast & Food' },
  { value: 'toast', label: '🎙️ Toast & Speech' },
  { value: 'party', label: '💃 Cake & Dance' },
  { value: 'wind_down', label: '✨ Farewell Send-off' },
];

type TimelineField = 'time' | 'title';

export const TimelineModal: React.FC<TimelineModalProps> = ({ isOpen, onClose, ...formProps }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={formProps.initialEvent ? 'Edit Milestone' : 'Add Day-Of Schedule Milestone'}
    description="Orchestrate exact times, transitions, responsible coordinators, and reminders."
  >
    <TimelineForm onClose={onClose} {...formProps} />
  </Modal>
);

const TimelineForm: React.FC<Omit<TimelineModalProps, 'isOpen'>> = ({ onClose, onSave, initialEvent }) => {
  const [time, setTime] = useState(initialEvent?.time ?? '04:00 PM');
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [description, setDescription] = useState(initialEvent?.description ?? '');
  const [category, setCategory] = useState<TimelineEvent['category']>(initialEvent?.category ?? 'arrival');
  const [assignedTo, setAssignedTo] = useState(initialEvent?.assignedTo ?? 'Host');
  const [tips, setTips] = useState(initialEvent?.tips ?? '');
  const { errors, check, clearError, formRef } = useFormErrors<TimelineField>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTime = sanitizeText(time, 20);
    const cleanTitle = sanitizeText(title, LIMITS.title);
    const next: FieldErrors<TimelineField> = {};
    if (!cleanTime) next.time = 'Please enter a time, e.g. 04:30 PM.';
    if (!cleanTitle) next.title = 'Please give this milestone a title.';
    if (!check(next)) return;

    onSave({
      id: initialEvent?.id ?? `tl-${Date.now()}`,
      time: cleanTime,
      title: cleanTitle,
      description: sanitizeText(description, LIMITS.notes),
      category,
      assignedTo: sanitizeText(assignedTo, LIMITS.short) || 'Host',
      tips: sanitizeText(tips, LIMITS.notes),
      completed: initialEvent?.completed ?? false,
    });
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      <RequiredFieldsNote />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextField
          label="Time"
          required
          maxLength={20}
          placeholder="e.g. 04:30 PM"
          value={time}
          error={errors.time}
          onChange={(e) => {
            setTime(e.target.value);
            clearError('time');
          }}
        />
        <TextField
          label="Milestone Title"
          required
          className="sm:col-span-2"
          maxLength={LIMITS.title}
          placeholder="e.g. Welcome Spritz & Grazing Table"
          value={title}
          error={errors.title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearError('title');
          }}
        />
      </div>

      <ChoiceGroup
        legend="Category"
        value={category}
        onChange={setCategory}
        options={CATEGORY_OPTIONS}
        layoutClassName="grid grid-cols-2 sm:grid-cols-4 gap-2"
        optionClassName="p-2 text-xs"
      />

      <TextAreaField
        label="What Happens (Description)"
        maxLength={LIMITS.notes}
        placeholder="e.g. Guests arrive through conservatory; acoustic playlist plays; drinks poured"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Assigned Lead / Person"
          maxLength={LIMITS.short}
          placeholder="e.g. Elena (Host) & Catering Lead"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        />
        <TextField
          label="Day-of Pro Tip / Note"
          maxLength={LIMITS.notes}
          placeholder="e.g. Light candles 15 min prior"
          value={tips}
          onChange={(e) => setTips(e.target.value)}
        />
      </div>

      <ModalActions onCancel={onClose} submitLabel={initialEvent ? 'Save Changes' : 'Add Milestone'} />
    </form>
  );
};
