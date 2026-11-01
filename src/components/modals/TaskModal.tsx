import React, { useState } from 'react';
import { ChecklistTask, TaskPhase } from '../../types';
import { X, Check } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ChecklistTask) => void;
  initialTask?: ChecklistTask | null;
  defaultDueDate?: string;
}

const PHASES: { id: TaskPhase; label: string }[] = [
  { id: '2_months_before', label: '2+ Months Before' },
  { id: '1_month_before', label: '1 Month Before' },
  { id: '1_2_weeks', label: '1 - 2 Weeks Before' },
  { id: 'day_before', label: 'Day Before Event' },
  { id: 'day_of', label: 'Day of Celebration' },
  { id: 'post_event', label: 'Post-Party Wrap Up' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultDueDate = '',
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialTask?.title || '');
  const [phase, setPhase] = useState<TaskPhase>(initialTask?.phase || '1_month_before');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || defaultDueDate || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initialTask?.priority || 'medium');
  const [assignedTo, setAssignedTo] = useState(initialTask?.assignedTo || 'Host');
  const [notes, setNotes] = useState(initialTask?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialTask?.id || `t-${Date.now()}`,
      title: title.trim(),
      phase,
      dueDate,
      completed: initialTask?.completed || false,
      priority,
      assignedTo: assignedTo.trim() || 'Host',
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
          {initialTask ? 'Edit Task' : 'Add To-Do Item'}
        </h2>
        <p className="text-xs text-stone-500 mb-5">
          Organize celebration tasks by timeline phase, priority, and assignees.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Confirm final floral delivery timing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Planning Phase
            </label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
            >
              {PHASES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Assigned To
              </label>
              <input
                type="text"
                placeholder="e.g. Maya, Elena, Caterer"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  priority === 'high'
                    ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                🔥 High
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  priority === 'medium'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                ⚡ Medium
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  priority === 'low'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                🌱 Low
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Notes & Links
            </label>
            <input
              type="text"
              placeholder="e.g. Link to playlist, instructions, or contact details"
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
              <span>{initialTask ? 'Save Changes' : 'Add Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
