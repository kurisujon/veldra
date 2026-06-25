import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-card border border-text-secondary/10 bg-surface shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";
