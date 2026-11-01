import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check, PartyPopper, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EventData } from '../types';
import { triggerFestiveConfetti } from '../utils/confetti';
import { focusSibling } from './ui/focus';
import { tabId, tabPanelId } from './ui/tabs';

interface HeaderProps {
  events: EventData[];
  activeEvent: EventData;
  onSelectEvent: (id: string) => void;
  onOpenCreateModal: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  /** When provided, a "Delete this celebration" action is offered (with confirmation). */
  onDeleteEvent?: (id: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: string | number;
  /** Spoken form of `count` for screen readers. */
  countLabel?: string;
  badge?: string;
}

const formatShortDate = (date: string, withYear = false): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });

function buildNavItems(event: EventData): NavItem[] {
  const done = event.tasks.filter((t) => t.completed).length;
  return [
    { id: 'overview', label: 'Overview & Mood', icon: Sparkles },
    { id: 'guests', label: 'Guests & RSVPs', count: event.guests.length, countLabel: `${event.guests.length} guests` },
    {
      id: 'budget',
      label: 'Budget Planner',
      count: `$${event.totalBudget.toLocaleString()}`,
      countLabel: `budget $${event.totalBudget.toLocaleString()}`,
    },
    {
      id: 'tasks',
      label: 'Checklist',
      count: `${done}/${event.tasks.length}`,
      countLabel: `${done} of ${event.tasks.length} done`,
    },
    { id: 'vendors', label: 'Vendors', count: event.vendors.length, countLabel: `${event.vendors.length} vendors` },
    {
      id: 'timeline',
      label: 'Day-of Schedule',
      count: `${event.timeline.length} items`,
      countLabel: `${event.timeline.length} items`,
    },
    { id: 'ai-concierge', label: 'AI Studio', icon: Sparkles, badge: 'Gemini' },
  ];
}

export const Header: React.FC<HeaderProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onOpenCreateModal,
  activeTab,
  onSelectTab,
  onDeleteEvent,
}) => {
  const navItems = buildNavItems(activeEvent);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /** WAI-ARIA tabs with automatic activation: arrows/Home/End move + select. */
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number;
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % navItems.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + navItems.length) % navItems.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = navItems.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const next = navItems[nextIndex];
    onSelectTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EFE8DD] transition-all" data-print-hide>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-200 via-orange-100 to-amber-200 flex items-center justify-center shadow-sm border border-rose-200/50"
            >
              <span className="text-xl">✨</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif-title text-xl sm:text-2xl font-bold tracking-tight text-stone-900">Fête</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100/80 text-amber-900 border border-amber-200/60 hidden sm:inline-block">
                  Celebrations
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium hidden sm:block">Curated Celebration & Event Planner</p>
            </div>
          </div>

          <EventSwitcher
            events={events}
            activeEvent={activeEvent}
            onSelectEvent={onSelectEvent}
            onOpenCreateModal={onOpenCreateModal}
            onDeleteEvent={onDeleteEvent}
          />

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => triggerFestiveConfetti()}
              aria-label="Celebrate! Pop confetti"
              title="Pop Confetti!"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100 to-pink-100 hover:from-amber-200 hover:to-pink-200 text-rose-900 border border-rose-200/80 font-medium text-xs shadow-sm hover:scale-105 active:scale-95 transition"
            >
              <PartyPopper className="w-4 h-4 text-rose-600 animate-bounce" aria-hidden="true" />
              <span className="hidden md:inline" aria-hidden="true">
                Celebrate!
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              aria-label="New event"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline" aria-hidden="true">
                New Event
              </span>
            </button>
          </div>
        </div>

        {/* Section tabs; App renders the matching role="tabpanel" (see ui/tabs.ts). */}
        <div
          role="tablist"
          aria-label="Event planning sections"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar border-t border-[#F0E9DE]"
        >
          {navItems.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={tabId(tab.id)}
                aria-selected={isActive}
                aria-controls={tabPanelId(tab.id)}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-700 text-white shadow-sm shadow-rose-200 underline decoration-2 underline-offset-4'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <>
                    <span
                      aria-hidden="true"
                      className={`text-[10px] px-1.5 rounded-full font-mono ${
                        isActive ? 'bg-rose-800 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                    <span className="sr-only">({tab.countLabel})</span>
                  </>
                )}
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 rounded-md uppercase font-bold tracking-wider ${
                      isActive ? 'bg-white text-rose-800' : 'bg-amber-100 text-amber-900 border border-amber-200'
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

type EventSwitcherProps = Pick<
  HeaderProps,
  'events' | 'activeEvent' | 'onSelectEvent' | 'onOpenCreateModal' | 'onDeleteEvent'
>;

/**
 * Disclosure-style menu for switching celebrations. Keyboard: Enter/Space or
 * ArrowDown opens and focuses the current event, arrows/Home/End move,
 * Escape or Tab closes, and focus returns to the trigger.
 */
const EventSwitcher: React.FC<EventSwitcherProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onOpenCreateModal,
  onDeleteEvent,
}) => {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  // Focus the selected event when the menu opens.
  useEffect(() => {
    if (!open) return;
    const items = menuItems();
    (items.find((el) => el.getAttribute('aria-checked') === 'true') ?? items[0])?.focus();
  }, [open]);

  // Close on outside pointer interaction.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems();
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusSibling(items, document.activeElement, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusSibling(items, document.activeElement, -1);
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  };

  const handleDelete = () => {
    if (!onDeleteEvent) return;
    if (window.confirm(`Delete "${activeEvent.title}"? This removes its guests, budget, tasks and schedule.`)) {
      onDeleteEvent(activeEvent.id);
      close();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-white border border-[#E7DECD] shadow-sm hover:border-rose-200 hover:shadow transition text-left group"
      >
        <span className="text-xl sm:text-2xl" aria-hidden="true">
          {activeEvent.coverEmoji || '🎉'}
        </span>
        <span className="block max-w-[130px] sm:max-w-[200px] truncate">
          <span className="sr-only">Current celebration: </span>
          <span className="block text-xs font-semibold text-stone-900 truncate group-hover:text-rose-700 transition">
            {activeEvent.title}
          </span>
          <span className="text-[10px] text-stone-600 flex items-center gap-1">
            <span>{activeEvent.date ? formatShortDate(activeEvent.date) : 'No date'}</span>
            <span aria-hidden="true">•</span>
            <span className="capitalize">{activeEvent.occasion.replace('_', ' ')}</span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-stone-600 group-hover:text-stone-900 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Your celebrations"
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200/80 p-2 z-30"
        >
          <div aria-hidden="true" className="px-3 py-2 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
            Your Celebrations ({events.length})
          </div>
          <div role="group" aria-label={`Your celebrations (${events.length})`} className="space-y-1 max-h-60 overflow-y-auto">
            {events.map((ev) => {
              const isSelected = ev.id === activeEvent.id;
              return (
                <button
                  key={ev.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  tabIndex={-1}
                  onClick={() => {
                    onSelectEvent(ev.id);
                    close();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                    isSelected ? 'bg-rose-50 text-rose-900 font-semibold' : 'hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="text-xl" aria-hidden="true">
                      {ev.coverEmoji || '🎈'}
                    </span>
                    <span className="truncate">
                      <span className="block text-xs truncate">{ev.title}</span>
                      <span className="block text-[10px] text-stone-600">
                        {ev.date ? formatShortDate(ev.date, true) : 'Date TBD'}
                      </span>
                    </span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-rose-700 flex-shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div role="separator" className="border-t border-stone-100 my-2" />
          <div className="space-y-1">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close(false);
                onOpenCreateModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-800 hover:text-rose-800 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Plan Another Celebration
            </button>
            {onDeleteEvent && (
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-red-50 text-red-700 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Delete This Celebration
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
