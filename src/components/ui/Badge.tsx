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
          "inline-flex items-center rounded-button border px-sm py-xs text-small font-bold tracking-wide transition-all",
          {
            "border-text-secondary/20 bg-surface text-text-secondary": variant === 'neutral',
            "border-transparent bg-accent/15 text-accent": variant === 'primary',
            "border-transparent bg-success/15 text-success": variant === 'success',
            "border-transparent bg-warning/15 text-warning": variant === 'warning',
            "border-transparent bg-error/15 text-error": variant === 'error',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
