import React, { useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { AITheme, PaletteColor } from '../../types';
import { triggerFestiveConfetti } from '../../utils/confetti';
import { Modal, ModalActions } from '../ui/Modal';
import { RequiredFieldsNote, TextAreaField, TextField, controlClass } from '../ui/FormField';
import { IconButton } from '../ui/IconButton';
import { FieldErrors, LIMITS, isValidHex, sanitizeText } from '../ui/form';
import { useFormErrors } from '../ui/useFormErrors';

interface TweakThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AITheme;
  onSaveToEvent: (customizedTheme: AITheme) => void;
}

const MAX_DECOR_IDEAS = 20;

type ThemeField = 'title' | 'palette';

export const TweakThemeModal: React.FC<TweakThemeModalProps> = ({ isOpen, onClose, theme, onSaveToEvent }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="xl"
    icon={<Sparkles className="w-5 h-5 text-amber-600" />}
    title="Customize & Tweak AI Theme"
    description="Tailor colors, decor suggestions, music style, and surprise elements before applying to your celebration."
  >
    <TweakThemeForm theme={theme} onSaveToEvent={onSaveToEvent} onClose={onClose} />
  </Modal>
);

const TweakThemeForm: React.FC<Omit<TweakThemeModalProps, 'isOpen'>> = ({ theme, onSaveToEvent, onClose }) => {
  const [title, setTitle] = useState(theme.title ?? '');
  const [tagline, setTagline] = useState(theme.tagline ?? '');
  const [palette, setPalette] = useState<PaletteColor[]>(theme.palette ?? []);
  const [decorIdeas, setDecorIdeas] = useState<string[]>(theme.decorIdeas ?? []);
  const [newDecorItem, setNewDecorItem] = useState('');
  const [musicVibe, setMusicVibe] = useState(theme.musicVibe ?? '');
  const [attirePrompt, setAttirePrompt] = useState(theme.attirePrompt ?? '');
  const [signatureTouch, setSignatureTouch] = useState(theme.signatureTouch ?? '');
  const { errors, check, clearError, formRef } = useFormErrors<ThemeField>();

  const handleColorChange = (index: number, field: keyof PaletteColor, value: string) => {
    setPalette((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    clearError('palette');
  };

  const handleAddDecor = () => {
    const item = sanitizeText(newDecorItem, LIMITS.title);
    if (!item || decorIdeas.length >= MAX_DECOR_IDEAS) return;
    setDecorIdeas((prev) => [...prev, item]);
    setNewDecorItem('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, LIMITS.title);
    const next: FieldErrors<ThemeField> = {};
    if (!cleanTitle) next.title = 'Please give the theme a title.';
    if (palette.some((c) => !isValidHex(c.hex))) next.palette = 'Each color must be a hex value like #FFCAD4.';
    if (!check(next)) return;

    onSaveToEvent({
      ...theme,
      title: cleanTitle,
      tagline: sanitizeText(tagline, LIMITS.notes),
      palette: palette.map((c) => ({ hex: c.hex, name: sanitizeText(c.name, LIMITS.short) })),
      decorIdeas,
      musicVibe: sanitizeText(musicVibe, LIMITS.title),
      attirePrompt: sanitizeText(attirePrompt, LIMITS.title),
      signatureTouch: sanitizeText(signatureTouch, LIMITS.title),
    });
    triggerFestiveConfetti();
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      <RequiredFieldsNote />
      <TextField
        label="Theme Concept Title"
        required
        maxLength={LIMITS.title}
        value={title}
        error={errors.title}
        onChange={(e) => {
          setTitle(e.target.value);
          clearError('title');
        }}
      />

      <TextAreaField
        label="Atmosphere / Tagline"
        maxLength={LIMITS.notes}
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
      />

      <fieldset aria-describedby={errors.palette ? 'theme-palette-error' : undefined}>
        <legend className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
          Color Palette Swatches
        </legend>
        <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {palette.map((color, idx) => {
            const hexInvalid = !isValidHex(color.hex);
            const n = idx + 1;
            return (
              <li key={idx} className="p-2 rounded-xl border border-stone-300 bg-stone-50/50 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    aria-label={`Color ${n} picker`}
                    value={hexInvalid ? '#000000' : color.hex}
                    onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                    className="w-7 h-7 shrink-0 rounded-lg border-0 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    aria-label={`Color ${n} hex value`}
                    aria-invalid={hexInvalid || undefined}
                    maxLength={7}
                    spellCheck={false}
                    value={color.hex}
                    onChange={(e) => handleColorChange(idx, 'hex', e.target.value.trim())}
                    className={controlClass(hexInvalid, 'text-[11px] font-mono !px-1 !py-0.5 !rounded')}
                  />
                </div>
                <input
                  type="text"
                  aria-label={`Color ${n} name`}
                  maxLength={LIMITS.short}
                  value={color.name}
                  onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                  placeholder="Color Name"
                  className={controlClass(false, 'text-[11px] !px-1.5 !py-1 !rounded')}
                />
              </li>
            );
          })}
        </ul>
        {errors.palette && (
          <p id="theme-palette-error" className="mt-1 text-xs font-medium text-red-700">
            {errors.palette}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
          Curated Décor Ideas
        </legend>
        {decorIdeas.length > 0 && (
          <ul className="space-y-2 mb-2">
            {decorIdeas.map((item, idx) => (
              <li
                key={`${idx}-${item}`}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800"
              >
                <span className="flex-1 font-medium">{item}</span>
                <IconButton
                  label={`Remove décor idea: ${item}`}
                  icon={Trash2}
                  tone="danger"
                  className="p-1 rounded-lg"
                  onClick={() => setDecorIdeas((prev) => prev.filter((_, i) => i !== idx))}
                />
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            aria-label="New décor idea"
            placeholder="Add another decor idea..."
            maxLength={LIMITS.title}
            value={newDecorItem}
            onChange={(e) => setNewDecorItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDecor();
              }
            }}
            className={controlClass(false, 'flex-1 text-xs !py-1.5')}
          />
          <button
            type="button"
            onClick={handleAddDecor}
            disabled={decorIdeas.length >= MAX_DECOR_IDEAS}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 font-semibold text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add
          </button>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Music & Ambiance"
          maxLength={LIMITS.title}
          value={musicVibe}
          onChange={(e) => setMusicVibe(e.target.value)}
        />
        <TextField
          label="Guest Attire Cue"
          maxLength={LIMITS.title}
          value={attirePrompt}
          onChange={(e) => setAttirePrompt(e.target.value)}
        />
      </div>

      <TextField
        label="Signature Surprise Element"
        maxLength={LIMITS.title}
        value={signatureTouch}
        onChange={(e) => setSignatureTouch(e.target.value)}
      />

      <ModalActions onCancel={onClose} submitLabel="Apply Theme to Celebration" tone="rose" />
    </form>
  );
};
