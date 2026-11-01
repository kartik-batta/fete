import React from 'react';

interface EditableTextProps {
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the edit control. */
  label: string;
  inputClassName: string;
  /** Render a textarea with this many rows instead of a single-line input. */
  rows?: number;
  /** Read-only presentation shown when not editing. */
  children: React.ReactNode;
}

/** Shows `children` normally, or an in-place input/textarea while editing. */
export const EditableText: React.FC<EditableTextProps> = ({
  isEditing,
  value,
  onChange,
  label,
  inputClassName,
  rows,
  children,
}) => {
  if (!isEditing) return <>{children}</>;
  return rows ? (
    <textarea
      rows={rows}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClassName}
    />
  ) : (
    <input
      type="text"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClassName}
    />
  );
};
