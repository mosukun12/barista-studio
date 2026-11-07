import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveBadgeProps {
  status: AutosaveStatus;
  lastSavedAt?: Date | null;
  errorMessage?: string | null;
  className?: string;
}

export const AutosaveBadge: React.FC<AutosaveBadgeProps> = ({
  status,
  lastSavedAt,
  errorMessage,
  className,
}) => {
  if (status === 'idle') {
    return null;
  }

  if (status === 'saving') {
    return (
      <span
        className={cn(
          'inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400 gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full',
          className
        )}
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        กำลังบันทึกอัตโนมัติ...
      </span>
    );
  }

  if (status === 'saved') {
    const timeStr = lastSavedAt
      ? lastSavedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';
    return (
      <span
        className={cn(
          'inline-flex items-center text-xs font-medium text-emerald-700 dark:text-emerald-400 gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full transition-all duration-300',
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        บันทึกแล้ว {timeStr && `(${timeStr})`}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium text-rose-700 dark:text-rose-400 gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-full',
        className
      )}
      title={errorMessage || 'บันทึกล้มเหลว'}
    >
      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
      บันทึกล้มเหลว {errorMessage ? `: ${errorMessage}` : ''}
    </span>
  );
};
