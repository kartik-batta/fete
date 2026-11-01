import React, { useState, useEffect } from 'react';
import { EventData } from './types';
import { loadSavedEvents, saveEventsToStorage, getActiveEventId, saveActiveEventId } from './utils/storage';
import { Header } from './components/Header';
import { EventOverviewHero } from './components/EventOverviewHero';
import { OverviewTab } from './components/tabs/OverviewTab';
import { GuestsTab } from './components/tabs/GuestsTab';
import { BudgetTab } from './components/tabs/BudgetTab';
import { TasksTab } from './components/tabs/TasksTab';
import { VendorsTab } from './components/tabs/VendorsTab';
import { TimelineTab } from './components/tabs/TimelineTab';
import { AiStudioTab } from './components/tabs/AiStudioTab';
import { CreateOrEditEventModal } from './components/modals/CreateOrEditEventModal';
import { triggerFestiveConfetti } from './utils/confetti';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [events, setEvents] = useState<EventData[]>(() => loadSavedEvents());
  const [activeEventId, setActiveEventId] = useState<string>(() => getActiveEventId(events));
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    saveEventsToStorage(events);
  }, [events]);

  useEffect(() => {
    saveActiveEventId(activeEventId);
  }, [activeEventId]);

  // Find active event
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  const handleUpdateActiveEvent = (updated: EventData) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleCreateEvent = (newEvent: EventData) => {
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    setActiveTab('overview');
  };

  const handleSelectEvent = (id: string) => {
    setActiveEventId(id);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 flex flex-col font-sans selection:bg-rose-200 selection:text-rose-900">
      {/* Top Header */}
      <Header
        events={events}
        activeEvent={activeEvent}
        onSelectEvent={handleSelectEvent}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Celebration Overview Hero */}
        <EventOverviewHero
          event={activeEvent}
          onEditEvent={() => setIsEditModalOpen(true)}
          onSwitchTab={setActiveTab}
        />

        {/* Tab Content Display */}
        <div className="transition-all duration-200">
          {activeTab === 'overview' && (
            <OverviewTab
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'guests' && (
            <GuestsTab
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetTab
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'vendors' && (
            <VendorsTab
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'ai-concierge' && (
            <AiStudioTab
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
              onSwitchTab={setActiveTab}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EFE8DD] bg-[#F7F3EC] py-8 text-center text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif-title font-bold text-stone-900 text-sm">Fête</span>
            <span>•</span>
            <span>Celebrations & Special Moments</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>Every gathering deserves wonder</span>
            <button
              onClick={() => triggerFestiveConfetti()}
              className="hover:text-rose-600 transition flex items-center gap-1 font-semibold text-rose-700"
            >
              <span>🎉 Confetti Burst</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modal: Create Celebration */}
      <CreateOrEditEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateEvent}
      />

      {/* Modal: Edit Active Celebration */}
      <CreateOrEditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateActiveEvent}
        initialEvent={activeEvent}
      />
    </div>
  );
}
