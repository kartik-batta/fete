import React, { useState } from 'react';
import { ChecklistTask, EventData, TaskPhase } from '../../types';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  Sparkles,
  PartyPopper,
} from 'lucide-react';
import { TaskModal } from '../modals/TaskModal';
import { triggerMiniConfetti, triggerFestiveConfetti } from '../../utils/confetti';

interface TasksTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onSwitchTab: (tab: string) => void;
}

const PHASES: { id: TaskPhase; title: string; subtitle: string }[] = [
  { id: '2_months_before', title: '2+ Months Before', subtitle: 'Big vision, venue lock-in & invitations' },
  { id: '1_month_before', title: '1 Month Before', subtitle: 'Menu tastings, RSVPs & vendor contracts' },
  { id: '1_2_weeks', title: '1-2 Weeks Before', subtitle: 'Headcount confirmation & playlist curation' },
  { id: 'day_before', title: 'Day Before Event', subtitle: 'Pickup, packing, signage & station prep' },
  { id: 'day_of', title: 'Day of Celebration', subtitle: 'Setup, soundcheck & host presence' },
  { id: 'post_event', title: 'Post-Party Wrap Up', subtitle: 'Thank you cards & vendor reviews' },
];

export const TasksTab: React.FC<TasksTabProps> = ({ event, onUpdateEvent, onSwitchTab }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ChecklistTask | null>(null);

  const completedCount = event.tasks.filter((t) => t.completed).length;
  const totalCount = event.tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleTask = (taskId: string, e: React.MouseEvent) => {
    let firedAllDone = false;
    const updatedTasks = event.tasks.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        if (nextState) {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          triggerMiniConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);

          // Check if this was the last remaining task!
          const remainingIncomplete = event.tasks.filter((other) => other.id !== taskId && !other.completed);
          if (remainingIncomplete.length === 0) {
            firedAllDone = true;
          }
        }
        return { ...t, completed: nextState };
      }
      return t;
    });

    onUpdateEvent({ ...event, tasks: updatedTasks });
    if (firedAllDone) {
      setTimeout(() => triggerFestiveConfetti(), 300);
    }
  };

  const handleSaveTask = (task: ChecklistTask) => {
    let updated: ChecklistTask[];
    if (editingTask) {
      updated = event.tasks.map((t) => (t.id === task.id ? task : t));
    } else {
      updated = [...event.tasks, task];
      triggerMiniConfetti(0.5, 0.5);
    }
    onUpdateEvent({ ...event, tasks: updated });
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Delete this task?')) {
      const updated = event.tasks.filter((t) => t.id !== id);
      onUpdateEvent({ ...event, tasks: updated });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-stone-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-700 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-bold text-sm text-stone-800">{percentage}%</span>
          </div>

          <div>
            <h2 className="font-serif-title text-xl font-bold text-stone-900">
              Celebration Readiness
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {completedCount} of {totalCount} milestone checklist items completed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => onSwitchTab('ai-concierge')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Decor & Ideas</span>
          </button>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EFE5D8] shadow-xs text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filterStatus === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Tasks ({event.tasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('incomplete')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filterStatus === 'incomplete'
                ? 'bg-rose-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            To-Do ({event.tasks.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filterStatus === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-400 font-medium">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="py-1 px-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs"
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
          const phaseTasks = event.tasks.filter((t) => {
            const matchesPhase = t.phase === phase.id;
            const matchesStatus =
              filterStatus === 'all' ||
              (filterStatus === 'completed' && t.completed) ||
              (filterStatus === 'incomplete' && !t.completed);
            const matchesPriority =
              filterPriority === 'all' || t.priority === filterPriority;
            return matchesPhase && matchesStatus && matchesPriority;
          });

          if (phaseTasks.length === 0 && filterStatus !== 'all') {
            return null;
          }

          const phaseCompleted = phaseTasks.filter((t) => t.completed).length;

          return (
            <div
              key={phase.id}
              className="bg-white rounded-3xl border border-[#EFE5D8] overflow-hidden shadow-xs"
            >
              {/* Phase Header */}
              <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#EFE5D8] flex items-center justify-between">
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">
                    {phase.title}
                  </h3>
                  <p className="text-[11px] text-stone-500">{phase.subtitle}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-200/70 text-stone-700">
                  {phaseCompleted}/{phaseTasks.length} done
                </span>
              </div>

              {/* Tasks List */}
              <div className="divide-y divide-stone-100">
                {phaseTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-400 italic">
                    No tasks currently in this phase.
                  </div>
                ) : (
                  phaseTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 sm:px-6 flex items-start justify-between gap-3 transition ${
                        task.completed ? 'bg-stone-50/50 opacity-70' : 'hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        <button
                          onClick={(e) => handleToggleTask(task.id, e)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            task.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'border-stone-300 hover:border-emerald-500 bg-white'
                          }`}
                        >
                          {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>

                        <div className="space-y-1">
                          <span
                            className={`text-sm font-medium transition ${
                              task.completed
                                ? 'line-through text-stone-400'
                                : 'text-stone-900'
                            }`}
                          >
                            {task.title}
                          </span>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                            {task.dueDate && (
                              <span className="flex items-center gap-1 font-medium text-stone-600">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                Due {task.dueDate}
                              </span>
                            )}
                            <span>•</span>
                            <span>Assigned: {task.assignedTo}</span>

                            {task.notes && (
                              <>
                                <span>•</span>
                                <span className="italic text-stone-400 truncate max-w-xs">
                                  {task.notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {task.priority === 'high' ? '🔥 High' : task.priority === 'medium' ? '⚡ Med' : '🌱 Low'}
                        </span>

                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
