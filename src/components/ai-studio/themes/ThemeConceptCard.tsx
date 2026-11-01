import React from 'react';
import { Edit3, Plus } from 'lucide-react';
import type { AITheme } from '../../../types';
import { BulletList } from '../shared/BulletList';

interface ThemeConceptCardProps {
  theme: AITheme;
  /** Zero-based position, shown as a 1-based badge. */
  index: number;
  onTweak: (theme: AITheme) => void;
  onAddDecor: (decorIdeas: string[]) => void;
}

const SECTION_LABEL_CLASS = 'text-[10px] uppercase font-semibold text-stone-400 block mb-1.5';

/** A single AI theme concept: palette, décor, playlist, attire and actions. */
export const ThemeConceptCard: React.FC<ThemeConceptCardProps> = ({
  theme,
  index,
  onTweak,
  onAddDecor,
}) => (
  <article className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <h4 className="font-serif-title text-lg font-bold text-stone-900 group-hover:text-rose-600 transition">
          {theme.title}
        </h4>
      </div>

      <p className="text-xs text-stone-600 italic font-serif mb-4 leading-relaxed">
        "{theme.tagline}"
      </p>

      <div className="mb-4">
        <span className={SECTION_LABEL_CLASS}>Color Palette</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {theme.palette.map((col, cIdx) => (
            <div
              key={cIdx}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-50 border border-stone-200 text-[10px]"
              title={`${col.name} (${col.hex})`}
            >
              <span
                className="w-3 h-3 rounded-full border border-black/10"
                style={{ backgroundColor: col.hex }}
                aria-hidden="true"
              />
              <span className="text-stone-700 font-medium">{col.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <span className={SECTION_LABEL_CLASS}>Décor Elements</span>
        <BulletList
          items={theme.decorIdeas}
          className="space-y-1.5 text-xs text-stone-600"
          itemClassName="flex items-start gap-1.5"
          bulletClassName="text-rose-400 text-sm leading-none"
        />
      </div>

      <div className="space-y-2 text-xs text-stone-600 bg-[#FAF7F2] p-3 rounded-2xl mb-4 border border-[#EFE5D8]">
        <div>
          <strong className="text-stone-800">Playlist:</strong> {theme.musicVibe}
        </div>
        <div>
          <strong className="text-stone-800">Attire:</strong> {theme.attirePrompt}
        </div>
        <div>
          <strong className="text-rose-700">Signature Touch:</strong> {theme.signatureTouch}
        </div>
      </div>
    </div>

    <div className="space-y-2 pt-3 border-t border-stone-100">
      <button
        type="button"
        onClick={() => onTweak(theme)}
        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition flex items-center justify-center gap-1.5"
      >
        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Tweak & Apply to Celebration</span>
      </button>

      <button
        type="button"
        onClick={() => onAddDecor(theme.decorIdeas)}
        className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200 transition flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Add Décor to Checklist</span>
      </button>
    </div>
  </article>
);
