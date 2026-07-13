import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <div
        className={cn(
          "peer relative h-4 w-4 shrink-0 rounded-sm border border-text-secondary/30 bg-surface shadow-sm focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 hover:border-accent/50 transition-colors",
          checked && "bg-accent border-accent text-white",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        {checked && (
          <Check 
            className="absolute inset-0 pointer-events-none p-[1.5px] text-white" 
            size={14} 
            strokeWidth={3} 
          />
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
