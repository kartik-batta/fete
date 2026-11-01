import React from 'react';
import type { MenuIdeas } from '../../../types';
import { BulletList } from '../shared/BulletList';
import { IdeaColumnCard } from '../shared/IdeaColumnCard';

const MENU_SECTIONS: readonly { key: keyof MenuIdeas; label: string }[] = [
  { key: 'starters', label: "Hors d'Oeuvres & Starters" },
  { key: 'mains', label: 'Main Courses' },
  { key: 'desserts', label: 'Celebration Desserts' },
  { key: 'signatureDrinks', label: 'Signature Sips & Mocktails' },
];

interface MenuIdeasCardProps {
  menu: MenuIdeas;
  onSave: () => void;
}

/** Suggested menu grouped by course, with a save-to-event action. */
export const MenuIdeasCard: React.FC<MenuIdeasCardProps> = ({ menu, onSave }) => (
  <IdeaColumnCard
    emoji="🍽️"
    title="Celebration Menu"
    action={
      <button
        type="button"
        onClick={onSave}
        className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-200 transition"
      >
        Save Menu to Event
      </button>
    }
  >
    <div className="space-y-4 text-xs">
      {MENU_SECTIONS.map(({ key, label }) => (
        <div key={key}>
          <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
            {label}
          </span>
          <BulletList items={menu[key]} />
        </div>
      ))}
    </div>
  </IdeaColumnCard>
);
