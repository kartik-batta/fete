import React from 'react';

interface IdeaColumnCardProps {
  emoji: string;
  title: string;
  /** Primary action rendered in the card footer. */
  action: React.ReactNode;
  children: React.ReactNode;
}

/** A results column with a header, body and footer action (used by the ideas tool). */
export const IdeaColumnCard: React.FC<IdeaColumnCardProps> = ({ emoji, title, action, children }) => (
  <section className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden="true">
          {emoji}
        </span>
        <h4 className="font-serif-title text-lg font-bold text-stone-900">{title}</h4>
      </div>
      {children}
    </div>
    <div className="pt-4 mt-4 border-t border-stone-100">{action}</div>
  </section>
);
