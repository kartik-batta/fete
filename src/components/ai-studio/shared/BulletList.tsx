import React from 'react';

interface BulletListProps {
  items: readonly string[];
  className?: string;
  itemClassName?: string;
  bulletClassName?: string;
}

/** A simple list with decorative rose bullets. */
export const BulletList: React.FC<BulletListProps> = ({
  items,
  className = 'space-y-1 text-stone-700',
  itemClassName = 'flex items-start gap-1',
  bulletClassName = 'text-rose-400',
}) => (
  <ul className={className}>
    {items.map((item, i) => (
      <li key={i} className={itemClassName}>
        <span className={bulletClassName} aria-hidden="true">
          •
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
