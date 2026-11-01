import React from 'react';
import type { LucideIcon } from 'lucide-react';

type Tone = 'neutral' | 'danger';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Required accessible name; also shown as a native tooltip. */
  label: string;
  icon: LucideIcon;
  tone?: Tone;
  iconClassName?: string;
}

const TONES: Record<Tone, string> = {
  neutral: 'text-stone-600 hover:text-stone-900 hover:bg-stone-100',
  danger: 'text-stone-600 hover:text-red-700 hover:bg-red-50',
};

/** Icon-only button that cannot be rendered without an accessible label. */
export const IconButton: React.FC<IconButtonProps> = ({
  label,
  icon: Icon,
  tone = 'neutral',
  className = 'p-1.5 rounded-lg',
  iconClassName = 'w-3.5 h-3.5',
  type = 'button',
  ...rest
}) => (
  <button type={type} aria-label={label} title={label} className={`transition ${TONES[tone]} ${className}`} {...rest}>
    <Icon className={iconClassName} aria-hidden="true" focusable="false" />
  </button>
);
