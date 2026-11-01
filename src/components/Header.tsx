import React, { useState } from 'react';
import { EventData } from '../types';
import { Sparkles, Calendar, Plus, PartyPopper, ChevronDown, Check, Download, Heart } from 'lucide-react';
import { triggerFestiveConfetti } from '../utils/confetti';

interface HeaderProps {
  events: EventData[];
  activeEvent: EventData;
  onSelectEvent: (id: string) => void;
  onOpenCreateModal: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onOpenCreateModal,
  activeTab,
  onSelectTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const occasionBadgeColors: Record<string, string> = {
    birthday: 'bg-rose-100 text-rose-800 border-rose-200',
    wedding: 'bg-amber-100 text-amber-900 border-amber-200',
    baby_shower: 'bg-sky-100 text-sky-800 border-sky-200',
    anniversary: 'bg-purple-100 text-purple-800 border-purple-200',
    office_party: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dinner_party: 'bg-orange-100 text-orange-800 border-orange-200',
    holiday: 'bg-red-100 text-red-800 border-red-200',
    other: 'bg-stone-100 text-stone-800 border-stone-200',
  };

  const navItems = [
    { id: 'overview', label: 'Overview & Mood', icon: Sparkles },
    { id: 'guests', label: 'Guests & RSVPs', count: activeEvent.guests.length },
    { id: 'budget', label: 'Budget Planner', count: `$${activeEvent.totalBudget}` },
    { id: 'tasks', label: 'Checklist', count: `${activeEvent.tasks.filter((t) => t.completed).length}/${activeEvent.tasks.length}` },
    { id: 'vendors', label: 'Vendors', count: activeEvent.vendors.length },
    { id: 'timeline', label: 'Day-of Schedule', count: `${activeEvent.timeline.length} items` },
    { id: 'ai-concierge', label: '✨ AI Studio', badge: 'Gemini' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EFE8DD] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-200 via-peach-200 to-amber-200 flex items-center justify-center shadow-sm border border-rose-200/50">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif-title text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                  Fête
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100/80 text-amber-800 border border-amber-200/60 hidden sm:inline-block">
                  Celebrations
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
                Curated Celebration & Event Planner
              </p>
            </div>
          </div>

          {/* Event Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-white border border-[#E7DECD] shadow-sm hover:border-rose-200 hover:shadow transition text-left group"
            >
              <span className="text-xl sm:text-2xl">{activeEvent.coverEmoji || '🎉'}</span>
              <div className="max-w-[130px] sm:max-w-[200px] truncate">
                <div className="text-xs font-semibold text-stone-900 truncate group-hover:text-rose-600 transition">
                  {activeEvent.title}
                </div>
                <div className="text-[10px] text-stone-500 flex items-center gap-1">
                  <span>{activeEvent.date ? new Date(activeEvent.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
                  <span>•</span>
                  <span className="capitalize">{activeEvent.occasion.replace('_', ' ')}</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200/80 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    Your Celebrations ({events.length})
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {events.map((ev) => {
                      const isSelected = ev.id === activeEvent.id;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => {
                            onSelectEvent(ev.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                            isSelected
                              ? 'bg-rose-50 text-rose-900 font-semibold'
                              : 'hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-xl">{ev.coverEmoji || '🎈'}</span>
                            <div className="truncate">
                              <p className="text-xs truncate">{ev.title}</p>
                              <p className="text-[10px] text-stone-500">
                                {ev.date ? new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-stone-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenCreateModal();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Plan Another Celebration
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Confetti Celebration Button */}
            <button
              onClick={() => triggerFestiveConfetti()}
              title="Pop Confetti!"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100 to-pink-100 hover:from-amber-200 hover:to-pink-200 text-rose-900 border border-rose-200/80 font-medium text-xs shadow-sm hover:scale-105 active:scale-95 transition"
            >
              <PartyPopper className="w-4 h-4 text-rose-500 animate-bounce" />
              <span className="hidden md:inline">Celebrate!</span>
            </button>

            {/* New Event Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Event</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar border-t border-[#F0E9DE]">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-rose-600 text-rose-100' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase font-bold tracking-wider ${
                      isActive ? 'bg-white text-rose-600' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
