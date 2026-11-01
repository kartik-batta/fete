import React, { useId } from 'react';
import { FIELD_LABEL_CLASS } from './styles';

interface FormFieldProps {
  label: string;
  /** Use the slightly looser label spacing (for button groups). */
  loose?: boolean;
  className?: string;
  /** Receives the generated control id so the label is properly associated. */
  children: (id: string) => React.ReactNode;
}

/** A labelled form control. The label is programmatically tied to the input. */
export const FormField: React.FC<FormFieldProps> = ({ label, loose, className, children }) => {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={`${FIELD_LABEL_CLASS} ${loose ? 'mb-1.5' : 'mb-1'}`}>
        {label}
      </label>
      {children(id)}
    </div>
  );
};

interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
}

/** A labelled group of related buttons (e.g. a segmented choice). */
export const FieldGroup: React.FC<FieldGroupProps> = ({ label, children }) => {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <span id={id} className={`${FIELD_LABEL_CLASS} mb-1.5`}>
        {label}
      </span>
      {children}
    </div>
  );
};
