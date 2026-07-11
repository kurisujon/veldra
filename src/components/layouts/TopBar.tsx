import React from 'react';
import { Menu } from 'lucide-react';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
}

export function TopBar({ onToggleMobileMenu }: TopBarProps) {
  return (
    <header className="flex h-topbar items-center border-b border-text-secondary/10 bg-surface px-md md:px-xl">
      <button 
        onClick={onToggleMobileMenu}
        className="mr-sm p-sm md:hidden rounded-button hover:bg-background text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Toggle Navigation Menu"
      >
        <Menu size={24} />
      </button>
      <h1 className="text-heading font-semibold text-text-primary hidden sm:block">Veldra Document Verification</h1>
      <h1 className="text-heading font-semibold text-text-primary sm:hidden">Veldra</h1>
    </header>
  );
}
