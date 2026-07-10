import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-button whitespace-nowrap font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-95 shadow-sm hover:shadow-md hover:-translate-y-0.5",
          {
            "bg-accent !text-white hover:bg-accent/90": variant === 'primary',
            "bg-surface text-text-primary border border-text-secondary/20 hover:bg-background": variant === 'secondary',
            "border-2 border-accent text-accent hover:bg-accent/10": variant === 'outline',
            "text-text-primary hover:bg-background shadow-none hover:shadow-none hover:-translate-y-0": variant === 'ghost',
            "bg-error !text-white hover:bg-error/90": variant === 'destructive',
          },
          {
            "px-md py-sm text-small": size === 'default',
            "h-8 px-3 text-xs": size === 'sm',
            "h-12 px-8 text-body": size === 'lg',
            "h-10 w-10 p-0 flex items-center justify-center": size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
