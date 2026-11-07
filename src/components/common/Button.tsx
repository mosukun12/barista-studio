import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'cafe';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-cafe-copper hover:bg-cafe-copper-hover text-white shadow-sm focus:ring-cafe-copper dark:bg-cafe-copper-dark',
    cafe:
      'bg-cafe-espresso text-cafe-cream hover:bg-black focus:ring-cafe-espresso dark:bg-cafe-cream dark:text-cafe-espresso dark:hover:bg-white',
    secondary:
      'bg-cafe-cream hover:bg-cafe-sand text-cafe-text border border-cafe-border dark:bg-cafe-darkCard dark:hover:bg-cafe-darkBorder dark:text-cafe-cream dark:border-cafe-darkBorder focus:ring-cafe-copper',
    outline:
      'border border-cafe-border hover:bg-cafe-cream/60 text-cafe-text dark:border-cafe-darkBorder dark:hover:bg-cafe-darkCard dark:text-cafe-cream focus:ring-cafe-copper',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm',
    ghost:
      'text-cafe-muted hover:text-cafe-text hover:bg-cafe-sand/40 dark:hover:bg-cafe-darkCard dark:text-cafe-muted dark:hover:text-cafe-cream focus:ring-cafe-copper',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
