import React from 'react';
import Link from 'next/link';
import { navigation } from '@/config/navigation';

export function Sidebar() {
  return (
    <aside className="w-sidebar flex-shrink-0 border-r border-text-secondary/10 bg-surface h-full" aria-label="Sidebar Navigation">
      <nav className="flex flex-col p-lg gap-sm">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-md py-sm rounded-button hover:bg-background text-text-primary text-body font-medium"
            aria-label={item.label}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
