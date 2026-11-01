import React, { useState } from 'react';
import { ChecklistTask, TaskPhase } from '../../types';
import { Modal, ModalActions } from '../ui/Modal';
import { ChoiceGroup, ChoiceOption, RequiredFieldsNote, SelectField, SelectOption, TextField } from '../ui/FormField';
import { FieldErrors, LIMITS, sanitizeText } from '../ui/form';
import { useFormErrors } from '../ui/useFormErrors';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ChecklistTask) => void;
  initialTask?: ChecklistTask | null;
  defaultDueDate?: string;
}

const PHASE_OPTIONS: SelectOption<TaskPhase>[] = [
  { value: '2_months_before', label: '2+ Months Before' },
  { value: '1_month_before', label: '1 Month Before' },
  { value: '1_2_weeks', label: '1 - 2 Weeks Before' },
  { value: 'day_before', label: 'Day Before Event' },
  { value: 'day_of', label: 'Day of Celebration' },
  { value: 'post_event', label: 'Post-Party Wrap Up' },
];

const PRIORITY_OPTIONS: ChoiceOption<ChecklistTask['priority']>[] = [
  { value: 'high', label: '🔥 High', selectedClassName: 'bg-rose-50 text-rose-900 border-rose-500 ring-2 ring-rose-400' },
  { value: 'medium', label: '⚡ Medium', selectedClassName: 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-400' },
  { value: 'low', label: '🌱 Low', selectedClassName: 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type TaskField = 'title' | 'dueDate';

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, ...formProps }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={formProps.initialTask ? 'Edit Task' : 'Add To-Do Item'}
    description="Organize celebration tasks by timeline phase, priority, and assignees."
  >
    <TaskForm onClose={onClose} {...formProps} />
  </Modal>
);

const TaskForm: React.FC<Omit<TaskModalProps, 'isOpen'>> = ({ onClose, onSave, initialTask, defaultDueDate = '' }) => {
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [phase, setPhase] = useState<TaskPhase>(initialTask?.phase ?? '1_month_before');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || defaultDueDate);
  const [priority, setPriority] = useState<ChecklistTask['priority']>(initialTask?.priority ?? 'medium');
  const [assignedTo, setAssignedTo] = useState(initialTask?.assignedTo ?? 'Host');
  const [notes, setNotes] = useState(initialTask?.notes ?? '');
  const { errors, check, clearError, formRef } = useFormErrors<TaskField>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, LIMITS.title);
    const next: FieldErrors<TaskField> = {};
    if (!cleanTitle) next.title = 'Please describe the task.';
    if (dueDate && !DATE_PATTERN.test(dueDate)) next.dueDate = 'Enter a valid date.';
    if (!check(next)) return;

    onSave({
      id: initialTask?.id ?? `t-${Date.now()}`,
      title: cleanTitle,
      phase,
      dueDate,
      completed: initialTask?.completed ?? false,
      priority,
      assignedTo: sanitizeText(assignedTo, LIMITS.short) || 'Host',
      notes: sanitizeText(notes, LIMITS.notes),
    });
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      <RequiredFieldsNote />
      <TextField
        label="Task Title"
        required
        maxLength={LIMITS.title}
        placeholder="e.g. Confirm final floral delivery timing"
        value={title}
        error={errors.title}
        onChange={(e) => {
          setTitle(e.target.value);
          clearError('title');
        }}
      />

      <SelectField label="Planning Phase" value={phase} onValueChange={setPhase} options={PHASE_OPTIONS} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Due Date"
          type="date"
          value={dueDate}
          error={errors.dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            clearError('dueDate');
          }}
        />
        <TextField
          label="Assigned To"
          maxLength={LIMITS.short}
          placeholder="e.g. Maya, Elena, Caterer"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        />
      </div>

      <ChoiceGroup legend="Priority Level" value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />

      <TextField
        label="Notes & Links"
        maxLength={LIMITS.notes}
        placeholder="e.g. Link to playlist, instructions, or contact details"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <ModalActions onCancel={onClose} submitLabel={initialTask ? 'Save Changes' : 'Add Task'} />
    </form>
  );
};
