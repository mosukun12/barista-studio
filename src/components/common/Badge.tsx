import React from 'react';
import { RecipeStatus } from '../../types';
import { STATUS_CONFIG, cn } from '../../lib/utils';

interface BadgeProps {
  status: RecipeStatus;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({
  status,
  showDot = true,
  className,
  size = 'md',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bgClass,
        config.colorClass,
        config.borderClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 animate-pulse', config.dotClass)}
        />
      )}
      {config.label}
    </span>
  );
};
