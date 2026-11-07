import React from 'react';
import { Button } from './Button';
import { Coffee, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder rounded-2xl bg-cafe-surface/40 dark:bg-cafe-darkCard/30 my-6">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-cafe-copper-light/60 dark:bg-cafe-copper/20 flex items-center justify-center text-cafe-copper">
        {icon || <Coffee className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-cafe-text dark:text-cafe-cream mb-1">
        {title}
      </h3>
      <p className="max-w-md text-sm text-cafe-muted dark:text-cafe-muted mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
