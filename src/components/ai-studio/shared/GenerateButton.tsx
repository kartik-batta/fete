import React from 'react';
import { Sparkles } from 'lucide-react';

interface GenerateButtonProps {
  isLoading: boolean;
  onClick: () => void;
  label: string;
  loadingLabel: string;
  /** Stretch to the container width and centre the content. */
  fullWidth?: boolean;
}

const BASE_CLASS =
  'rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-semibold text-xs shadow-md transition flex items-center gap-2';

/** Primary "generate with AI" call to action with a spinning sparkle while loading. */
export const GenerateButton: React.FC<GenerateButtonProps> = ({
  isLoading,
  onClick,
  label,
  loadingLabel,
  fullWidth = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    aria-busy={isLoading}
    className={`${fullWidth ? 'w-full py-2.5 px-4 justify-center' : 'px-5 py-2.5'} ${BASE_CLASS}`}
  >
    <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
    <span>{isLoading ? loadingLabel : label}</span>
  </button>
);
