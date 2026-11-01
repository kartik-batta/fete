import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { EventData } from './types';
import {
  loadSavedEvents,
  saveEventsToStorage,
  getActiveEventId,
  saveActiveEventId,
  type SaveFailureReason,
} from './utils/storage';
import { useDebouncedPersist } from './hooks/useDebouncedPersist';
import { useHashTab } from './hooks/useHashTab';
import { Header } from './components/Header';
import { EventOverviewHero } from './components/EventOverviewHero';
import { OverviewTab } from './components/tabs/OverviewTab';
import { triggerFestiveConfetti } from './utils/confetti';
import { tabPanelProps } from './components/ui/tabs';

// The overview tab is the landing view, so it ships in the main bundle. Every
// other tab (notably the heavy AI Studio) and the event modal load on demand.
const tabLoaders = {
  guests: () => import('./components/tabs/GuestsTab').then((m) => ({ default: m.GuestsTab })),
  budget: () => import('./components/tabs/BudgetTab').then((m) => ({ default: m.BudgetTab })),
  tasks: () => import('./components/tabs/TasksTab').then((m) => ({ default: m.TasksTab })),
  vendors: () => import('./components/tabs/VendorsTab').then((m) => ({ default: m.VendorsTab })),
  timeline: () => import('./components/tabs/TimelineTab').then((m) => ({ default: m.TimelineTab })),
  'ai-concierge': () => import('./components/tabs/AiStudioTab').then((m) => ({ default: m.AiStudioTab })),
};

const GuestsTab = lazy(tabLoaders.guests);
const BudgetTab = lazy(tabLoaders.budget);
const TasksTab = lazy(tabLoaders.tasks);
const VendorsTab = lazy(tabLoaders.vendors);
const TimelineTab = lazy(tabLoaders.timeline);
const AiStudioTab = lazy(tabLoaders['ai-concierge']);
const CreateOrEditEventModal = lazy(() =>
  import('./components/modals/CreateOrEditEventModal').then((m) => ({ default: m.CreateOrEditEventModal }))
);

const TAB_IDS = ['overview', 'guests', 'budget', 'tasks', 'vendors', 'timeline', 'ai-concierge'] as const;
type TabId = (typeof TAB_IDS)[number];

/** Delay before writing edits to localStorage; pending writes flush on page hide. */
const PERSIST_DELAY_MS = 400;

const SAVE_ERROR_MESSAGES: Record<SaveFailureReason, string> = {
  quota: 'Browser storage is full — your latest changes are only kept until this tab closes.',
  unavailable: 'Browser storage is unavailable — your changes are only kept until this tab closes.',
};

/** Warm the lazy chunks once the browser is idle so tab switches feel instant. */
function prefetchTabsWhenIdle(): () => void {
  const prefetch = () => Object.values(tabLoaders).forEach((load) => void load().catch(() => undefined));
  if ('requestIdleCallback' in window) {
    const handle = window.requestIdleCallback(prefetch, { timeout: 5000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(prefetch, 2000);
  return () => clearTimeout(handle);
}

function TabFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center min-h-[240px] rounded-3xl border border-[#EFE5D8] bg-white/60 text-sm text-stone-500 animate-pulse"
    >
      Loading…
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState<EventData[]>(loadSavedEvents);
  const [activeEventId, setActiveEventId] = useState<string>(() => getActiveEventId(events));
  const [activeTab, setActiveTab] = useHashTab<TabId>(TAB_IDS, 'overview');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [saveError, setSaveError] = useState<SaveFailureReason | null>(null);

  const persistEvents = useCallback((next: EventData[]) => {
    const result = saveEventsToStorage(next);
    setSaveError(result.ok ? null : result.reason);
  }, []);
  useDebouncedPersist(events, persistEvents, PERSIST_DELAY_MS);

  useEffect(() => {
    saveActiveEventId(activeEventId);
  }, [activeEventId]);

  useEffect(prefetchTabsWhenIdle, []);

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) ?? events[0],
    [events, activeEventId]
  );

  const handleUpdateEvent = useCallback((updated: EventData) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  const handleCreateEvent = useCallback(
    (newEvent: EventData) => {
      setEvents((prev) => [newEvent, ...prev]);
      setActiveEventId(newEvent.id);
      setActiveTab('overview');
    },
    [setActiveTab]
  );

  /** Removes an event, always keeping at least one; activates its neighbour if it was active. */
  const handleDeleteEvent = useCallback(
    (id: string) => {
      const index = events.findIndex((e) => e.id === id);
      if (events.length <= 1 || index === -1) return;
      const remaining = events.filter((e) => e.id !== id);
      setEvents(remaining);
      if (activeEventId === id) setActiveEventId(remaining[Math.min(index, remaining.length - 1)].id);
    },
    [events, activeEventId]
  );

  const openCreateModal = useCallback(() => setModal('create'), []);
  const openEditModal = useCallback(() => setModal('edit'), []);
  const closeModal = useCallback(() => setModal(null), []);

  const tabProps = { event: activeEvent, onUpdateEvent: handleUpdateEvent };
  const eventKey = activeEvent.id;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 flex flex-col font-sans selection:bg-rose-200 selection:text-rose-900">
      <Header
        events={events}
        activeEvent={activeEvent}
        onSelectEvent={setActiveEventId}
        onOpenCreateModal={openCreateModal}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onDeleteEvent={events.length > 1 ? handleDeleteEvent : undefined}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {saveError && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
          >
            {SAVE_ERROR_MESSAGES[saveError]}
          </div>
        )}

        <EventOverviewHero event={activeEvent} onEditEvent={openEditModal} onSwitchTab={setActiveTab} />

        {/*
          Only the active tab is mounted; lazy tabs suspend while their chunk loads.
          Keying by event id resets per-event local state (drafts, filters, forms)
          when the user switches celebrations, so data never bleeds between events.
        */}
        <div {...tabPanelProps(activeTab)} className="outline-none">
          <Suspense fallback={<TabFallback />}>
            {activeTab === 'overview' && <OverviewTab key={eventKey} {...tabProps} onSwitchTab={setActiveTab} />}
            {activeTab === 'guests' && <GuestsTab key={eventKey} {...tabProps} />}
            {activeTab === 'budget' && <BudgetTab key={eventKey} {...tabProps} />}
            {activeTab === 'tasks' && <TasksTab key={eventKey} {...tabProps} onSwitchTab={setActiveTab} />}
            {activeTab === 'vendors' && <VendorsTab key={eventKey} {...tabProps} />}
            {activeTab === 'timeline' && <TimelineTab key={eventKey} {...tabProps} onSwitchTab={setActiveTab} />}
            {activeTab === 'ai-concierge' && <AiStudioTab key={eventKey} {...tabProps} onSwitchTab={setActiveTab} />}
          </Suspense>
        </div>
      </main>

      <footer data-print-hide className="border-t border-[#EFE8DD] bg-[#F7F3EC] py-8 text-center text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif-title font-bold text-stone-900 text-sm">Fête</span>
            <span aria-hidden="true">•</span>
            <span>Celebrations & Special Moments</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>Every gathering deserves wonder</span>
            <button
              type="button"
              onClick={triggerFestiveConfetti}
              className="hover:text-rose-600 transition flex items-center gap-1 font-semibold text-rose-700"
            >
              <span aria-hidden="true">🎉</span>
              <span>Confetti Burst</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mounted only while open, so each opening starts from fresh form state. */}
      {modal && (
        <Suspense fallback={null}>
          <CreateOrEditEventModal
            key={modal}
            isOpen
            onClose={closeModal}
            onSave={modal === 'create' ? handleCreateEvent : handleUpdateEvent}
            initialEvent={modal === 'edit' ? activeEvent : null}
          />
        </Suspense>
      )}
    </div>
  );
}
