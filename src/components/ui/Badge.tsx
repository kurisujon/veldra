import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'error';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'neutral', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-button border px-md py-xs text-small font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent",
          {
            "border-transparent bg-background text-text-secondary": variant === 'neutral',
            "border-transparent bg-accent text-surface": variant === 'primary',
            "border-transparent bg-success text-surface": variant === 'success',
            "border-transparent bg-warning text-surface": variant === 'warning',
            "border-transparent bg-error text-surface": variant === 'error',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
