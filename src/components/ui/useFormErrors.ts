import { useCallback, useEffect, useRef, useState } from 'react';
import { FieldErrors, hasErrors } from './form';

/**
 * Tracks per-field validation errors for a form. When a submit attempt fails,
 * focus moves to the first invalid control so keyboard and screen-reader users
 * land directly on the problem (its error is read via aria-describedby).
 */
export function useFormErrors<K extends string>() {
  const [errors, setErrors] = useState<FieldErrors<K>>({});
  const [attempt, setAttempt] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (attempt === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  /** Stores the errors; returns `true` when the form is valid. */
  const check = useCallback((next: FieldErrors<K>): boolean => {
    setErrors(next);
    if (hasErrors(next)) {
      setAttempt((a) => a + 1);
      return false;
    }
    return true;
  }, []);

  const clearError = useCallback((field: K) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  return { errors, check, clearError, formRef };
}
