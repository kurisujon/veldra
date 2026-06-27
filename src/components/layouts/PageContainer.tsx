import React from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto max-w-[1600px] w-full px-xl py-2xl", className)}>
      {children}
    </div>
  );
}
