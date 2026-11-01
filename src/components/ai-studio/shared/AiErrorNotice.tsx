import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ApiError } from '../../../lib/api';

interface AiErrorNoticeProps {
  error: ApiError | null;
  onRetry?: () => void;
}

/** Inline, screen-reader-announced error banner for a failed AI request. */
export const AiErrorNotice: React.FC<AiErrorNoticeProps> = ({ error, onRetry }) => {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mt-4 flex items-start justify-between gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" aria-hidden="true" />
        <span>{error.message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Try again</span>
        </button>
      )}
    </div>
  );
};
