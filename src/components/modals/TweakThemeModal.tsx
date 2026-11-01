import React, { useState } from 'react';
import { AITheme, PaletteColor } from '../../types';
import { X, Check, Plus, Trash2, Sparkles } from 'lucide-react';
import { triggerFestiveConfetti } from '../../utils/confetti';

interface TweakThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AITheme;
  onSaveToEvent: (customizedTheme: AITheme) => void;
}

export const TweakThemeModal: React.FC<TweakThemeModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSaveToEvent,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(theme.title || '');
  const [tagline, setTagline] = useState(theme.tagline || '');
  const [palette, setPalette] = useState<PaletteColor[]>(theme.palette || []);
  const [decorIdeas, setDecorIdeas] = useState<string[]>(theme.decorIdeas || []);
  const [newDecorItem, setNewDecorItem] = useState('');
  const [musicVibe, setMusicVibe] = useState(theme.musicVibe || '');
  const [attirePrompt, setAttirePrompt] = useState(theme.attirePrompt || '');
  const [signatureTouch, setSignatureTouch] = useState(theme.signatureTouch || '');

  const handleColorChange = (index: number, field: 'name' | 'hex', val: string) => {
    const updated = [...palette];
    updated[index] = { ...updated[index], [field]: val };
    setPalette(updated);
  };

  const handleAddDecor = () => {
    if (newDecorItem.trim()) {
      setDecorIdeas([...decorIdeas, newDecorItem.trim()]);
      setNewDecorItem('');
    }
  };

  const handleRemoveDecor = (idx: number) => {
    setDecorIdeas(decorIdeas.filter((_, i) => i !== idx));
  };

  const handleApply = () => {
    onSaveToEvent({
      ...theme,
      title: title.trim(),
      tagline: tagline.trim(),
      palette,
      decorIdeas,
      musicVibe: musicVibe.trim(),
      attirePrompt: attirePrompt.trim(),
      signatureTouch: signatureTouch.trim(),
    });
    triggerFestiveConfetti();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="font-serif-title text-2xl font-bold text-stone-900">
            Customize & Tweak AI Theme
          </h2>
        </div>
        <p className="text-xs text-stone-500 mb-6">
          Tailor colors, decor suggestions, music style, and surprise elements before applying to your celebration.
        </p>

        <div className="space-y-5">
          {/* Theme Title & Tagline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Theme Concept Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Atmosphere / Tagline
            </label>
            <textarea
              rows={2}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-sm"
            />
          </div>

          {/* Color Palette Swatches */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Color Palette Swatches
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {palette.map((color, idx) => (
                <div key={idx} className="p-2 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={color.hex}
                      onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                      className="w-full text-[10px] font-mono px-1 py-0.5 rounded bg-white border border-stone-200"
                    />
                  </div>
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                    placeholder="Color Name"
                    className="w-full text-[11px] px-1.5 py-1 rounded bg-white border border-stone-200"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Decor Ideas List */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Curated Décor Ideas
            </label>
            <div className="space-y-2 mb-2">
              {decorIdeas.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-800"
                >
                  <span className="flex-1 font-medium">{item}</span>
                  <button
                    onClick={() => handleRemoveDecor(idx)}
                    className="text-stone-400 hover:text-red-500 p-1 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add another decor idea..."
                value={newDecorItem}
                onChange={(e) => setNewDecorItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDecor())}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddDecor}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Music Vibe & Attire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Music & Ambiance
              </label>
              <input
                type="text"
                value={musicVibe}
                onChange={(e) => setMusicVibe(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Guest Attire Cue
              </label>
              <input
                type="text"
                value={attirePrompt}
                onChange={(e) => setAttirePrompt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
              />
            </div>
          </div>

          {/* Signature Touch */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Signature Surprise Element
            </label>
            <input
              type="text"
              value={signatureTouch}
              onChange={(e) => setSignatureTouch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Theme to Celebration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
