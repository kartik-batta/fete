import React, { useId } from 'react';

/**
 * Accessible form primitives. Every control gets a programmatic <label>,
 * required state (`required` + `aria-required`), and inline errors/hints
 * linked through `aria-describedby` with `aria-invalid` when in error.
 */

const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1';

export function controlClass(invalid: boolean, extra = ''): string {
  return [
    'w-full px-3.5 py-2 rounded-xl border bg-white text-stone-900 text-sm',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400',
    invalid ? 'border-red-600 ring-1 ring-red-600' : 'border-stone-300',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ControlA11yProps {
  id: string;
  required?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface FieldProps {
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: (control: ControlA11yProps) => React.ReactNode;
}

/** Generic labelled field; renders any control through a render prop. */
export const Field: React.FC<FieldProps> = ({ label, error, hint, required, className, children }) => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-rose-700">
            {' '}
            *
          </span>
        )}
      </label>
      {children({
        id,
        required,
        'aria-required': required || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-[11px] text-stone-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
};

type BaseFieldProps = Omit<FieldProps, 'children'>;

type TextFieldProps = BaseFieldProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'required'> & {
    inputClassName?: string;
  };

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  hint,
  required,
  className,
  inputClassName,
  type = 'text',
  ...inputProps
}) => (
  <Field label={label} error={error} hint={hint} required={required} className={className}>
    {(a11y) => <input type={type} {...inputProps} {...a11y} className={controlClass(Boolean(error), inputClassName)} />}
  </Field>
);

type TextAreaFieldProps = BaseFieldProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className' | 'required'>;

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  error,
  hint,
  required,
  className,
  rows = 2,
  ...textareaProps
}) => (
  <Field label={label} error={error} hint={hint} required={required} className={className}>
    {(a11y) => <textarea rows={rows} {...textareaProps} {...a11y} className={controlClass(Boolean(error))} />}
  </Field>
);

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

type SelectFieldProps<T extends string> = BaseFieldProps &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'required' | 'value' | 'onChange'> & {
    value: T;
    onValueChange: (value: T) => void;
    options: readonly SelectOption<T>[];
  };

export function SelectField<T extends string>({
  label,
  error,
  hint,
  required,
  className,
  value,
  onValueChange,
  options,
  ...selectProps
}: SelectFieldProps<T>) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => (
        <select
          {...selectProps}
          {...a11y}
          value={value}
          onChange={(e) => onValueChange(e.target.value as T)}
          className={controlClass(Boolean(error))}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  /** Accessible name when `label` is purely visual (e.g. an emoji). */
  ariaLabel?: string;
  /** Classes applied when selected (lets each option keep its own accent). */
  selectedClassName?: string;
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  name?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly ChoiceOption<T>[];
  /** Grid/flex layout classes for the option container. */
  layoutClassName?: string;
  optionClassName?: string;
}

const DEFAULT_SELECTED = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400';

/**
 * Segmented single-choice control built on native radio inputs inside a
 * <fieldset>/<legend>, so arrow keys, form semantics and screen-reader
 * announcements ("radio, 2 of 3, checked") come for free. Selection is shown
 * with a ring + check weight, not colour alone.
 */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  layoutClassName = 'grid grid-cols-3 gap-2',
  optionClassName = 'py-2 px-3 text-xs',
}: ChoiceGroupProps<T>) {
  const autoName = useId();
  const groupName = name ?? autoName;

  return (
    <fieldset>
      <legend className={LABEL_CLASS}>{legend}</legend>
      <div className={layoutClassName}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-1.5 rounded-xl border font-semibold cursor-pointer transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-rose-600 ${optionClassName} ${
                selected
                  ? (opt.selectedClassName ?? DEFAULT_SELECTED)
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={groupName}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                aria-label={opt.ariaLabel}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Short note explaining the asterisk convention; place once per form. */
export const RequiredFieldsNote: React.FC = () => (
  <p className="text-[11px] text-stone-600">
    Fields marked <span aria-hidden="true">*</span>
    <span className="sr-only">with an asterisk</span> are required.
  </p>
);
