import React, { useMemo, useState } from 'react';
import { ChecklistTask, EventData, TaskPhase } from '../../types';
import { AlertCircle, Calendar, Check, Edit2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { TaskModal } from '../modals/TaskModal';
import { triggerMiniConfetti, triggerFestiveConfetti } from '../../utils/confetti';
import { IconButton } from '../ui/IconButton';
import { LiveRegion, useAnnouncer } from '../ui/LiveRegion';
import { isOverdue, sortByDueDate, toIsoDate } from './scheduleTime';

interface TasksTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onSwitchTab: (tab: string) => void;
}

type StatusFilter = 'all' | 'incomplete' | 'completed';

const PHASES: { id: TaskPhase; title: string; subtitle: string }[] = [
  { id: '2_months_before', title: '2+ Months Before', subtitle: 'Big vision, venue lock-in & invitations' },
  { id: '1_month_before', title: '1 Month Before', subtitle: 'Menu tastings, RSVPs & vendor contracts' },
  { id: '1_2_weeks', title: '1-2 Weeks Before', subtitle: 'Headcount confirmation & playlist curation' },
  { id: 'day_before', title: 'Day Before Event', subtitle: 'Pickup, packing, signage & station prep' },
  { id: 'day_of', title: 'Day of Celebration', subtitle: 'Setup, soundcheck & host presence' },
  { id: 'post_event', title: 'Post-Party Wrap Up', subtitle: 'Thank you cards & vendor reviews' },
];

const PRIORITY_BADGE: Record<ChecklistTask['priority'], { label: string; className: string }> = {
  high: { label: '🔥 High', className: 'bg-rose-100 text-rose-900' },
  medium: { label: '⚡ Med', className: 'bg-amber-100 text-amber-900' },
  low: { label: '🌱 Low', className: 'bg-emerald-100 text-emerald-900' },
};

const formatDue = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const TasksTab: React.FC<TasksTabProps> = ({ event, onUpdateEvent, onSwitchTab }) => {
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ChecklistTask | null>(null);
  const { message, announce } = useAnnouncer();

  const today = toIsoDate(new Date());
  const completedCount = event.tasks.filter((t) => t.completed).length;
  const totalCount = event.tasks.length;
  const overdueCount = event.tasks.filter((t) => isOverdue(t, today)).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  /** Tasks grouped by phase, filtered and sorted by due date (computed once per render input). */
  const tasksByPhase = useMemo(() => {
    const visible = sortByDueDate(
      event.tasks.filter(
        (t) =>
          (filterStatus === 'all' || (filterStatus === 'completed') === t.completed) &&
          (filterPriority === 'all' || t.priority === filterPriority),
      ),
    );
    const groups = new Map<TaskPhase, ChecklistTask[]>(PHASES.map((p) => [p.id, []]));
    visible.forEach((t) => groups.get(t.phase)?.push(t));
    return groups;
  }, [event.tasks, filterStatus, filterPriority]);

  const handleToggleTask = (task: ChecklistTask, e: React.MouseEvent<HTMLButtonElement>) => {
    const nextState = !task.completed;
    const updatedTasks = event.tasks.map((t) => (t.id === task.id ? { ...t, completed: nextState } : t));
    onUpdateEvent({ ...event, tasks: updatedTasks });
    announce(`${task.title} marked ${nextState ? 'complete' : 'not complete'}.`);

    if (nextState) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerMiniConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
      if (updatedTasks.every((t) => t.completed)) {
        setTimeout(() => triggerFestiveConfetti(), 300);
      }
    }
  };

  const handleSaveTask = (task: ChecklistTask) => {
    if (editingTask) {
      onUpdateEvent({ ...event, tasks: event.tasks.map((t) => (t.id === task.id ? task : t)) });
      announce(`Updated task ${task.title}.`);
    } else {
      onUpdateEvent({ ...event, tasks: [...event.tasks, task] });
      triggerMiniConfetti(0.5, 0.5);
      announce(`Added task ${task.title}.`);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (task: ChecklistTask) => {
    if (window.confirm(`Delete the task "${task.title}"?`)) {
      onUpdateEvent({ ...event, tasks: event.tasks.filter((t) => t.id !== task.id) });
      announce(`Deleted task ${task.title}.`);
    }
  };

  const statusFilters: { id: StatusFilter; label: string; count: number; active: string }[] = [
    { id: 'all', label: 'All Tasks', count: totalCount, active: 'bg-stone-900 text-white' },
    { id: 'incomplete', label: 'To-Do', count: totalCount - completedCount, active: 'bg-rose-700 text-white' },
    { id: 'completed', label: 'Completed', count: completedCount, active: 'bg-emerald-700 text-white' },
  ];

  return (
    <div className="space-y-6">
      <LiveRegion message={message} />

      {/* Progress Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div
            role="progressbar"
            aria-label="Checklist completion"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center"
          >
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <path
                className="text-stone-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-600 transition-all duration-700 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-bold text-sm text-stone-800" aria-hidden="true">
              {percentage}%
            </span>
          </div>

          <div>
            <h2 className="font-serif-title text-xl font-bold text-stone-900">Celebration Readiness</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {completedCount} of {totalCount} milestone checklist items completed.
            </p>
            {overdueCount > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onSwitchTab('ai-concierge')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold border border-rose-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI Decor & Ideas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EFE5D8] shadow-xs text-xs">
        <div role="group" aria-label="Filter tasks by status" className="flex items-center gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filterStatus === f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterStatus === f.id ? f.active : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="task-priority-filter" className="text-stone-700 font-medium">
            Priority:
          </label>
          <select
            id="task-priority-filter"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="py-1 px-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Tasks Grouped by Phase */}
      <div className="space-y-6">
        {PHASES.map((phase) => {
          const phaseTasks = tasksByPhase.get(phase.id) ?? [];
          if (phaseTasks.length === 0 && filterStatus !== 'all') return null;
          const phaseCompleted = phaseTasks.filter((t) => t.completed).length;
          const headingId = `phase-heading-${phase.id}`;

          return (
            <section
              key={phase.id}
              aria-labelledby={headingId}
              className="bg-white rounded-3xl border border-[#EFE5D8] overflow-hidden shadow-xs"
            >
              <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#EFE5D8] flex items-center justify-between">
                <div>
                  <h3 id={headingId} className="font-serif-title text-base font-bold text-stone-900">
                    {phase.title}
                  </h3>
                  <p className="text-[11px] text-stone-600">{phase.subtitle}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-200/70 text-stone-800">
                  {phaseCompleted}/{phaseTasks.length} done
                </span>
              </div>

              {phaseTasks.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-600 italic">No tasks currently in this phase.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {phaseTasks.map((task) => {
                    const overdue = isOverdue(task, today);
                    const priority = PRIORITY_BADGE[task.priority];
                    return (
                      <li
                        key={task.id}
                        className={`p-4 sm:px-6 flex items-start justify-between gap-3 transition ${
                          task.completed ? 'bg-stone-50/50' : 'hover:bg-stone-50/70'
                        } ${overdue ? 'border-l-4 border-red-600' : ''}`}
                      >
                        <div className="flex items-start gap-3.5 flex-1">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={task.completed}
                            aria-label={`Mark "${task.title}" complete`}
                            onClick={(e) => handleToggleTask(task, e)}
                            className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                              task.completed
                                ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                                : 'border-stone-500 hover:border-emerald-600 bg-white'
                            }`}
                          >
                            {task.completed && <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />}
                          </button>

                          <div className="space-y-1">
                            <span
                              className={`text-sm font-medium transition ${
                                task.completed ? 'line-through text-stone-600' : 'text-stone-900'
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.completed && <span className="sr-only"> (completed)</span>}

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                              {task.dueDate && (
                                <span
                                  className={`flex items-center gap-1 font-medium ${
                                    overdue ? 'text-red-700 font-semibold' : 'text-stone-700'
                                  }`}
                                >
                                  {overdue ? (
                                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                                  ) : (
                                    <Calendar className="w-3 h-3 text-stone-500" aria-hidden="true" />
                                  )}
                                  {overdue ? 'Overdue · was due' : 'Due'}{' '}
                                  <time dateTime={task.dueDate}>{formatDue(task.dueDate)}</time>
                                </span>
                              )}
                              <span aria-hidden="true">•</span>
                              <span>Assigned: {task.assignedTo}</span>
                              {task.notes && (
                                <>
                                  <span aria-hidden="true">•</span>
                                  <span className="italic text-stone-600 truncate max-w-xs">{task.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${priority.className}`}>
                            <span className="sr-only">Priority: </span>
                            {priority.label}
                          </span>
                          <div className="flex items-center">
                            <IconButton
                              label={`Edit task: ${task.title}`}
                              icon={Edit2}
                              onClick={() => {
                                setEditingTask(task);
                                setIsModalOpen(true);
                              }}
                            />
                            <IconButton
                              label={`Delete task: ${task.title}`}
                              icon={Trash2}
                              tone="danger"
                              onClick={() => handleDeleteTask(task)}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultDueDate={event.date}
      />
    </div>
  );
};
