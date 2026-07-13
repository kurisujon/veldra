'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { navigation } from '@/config/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, FileEdit, Download, Settings, LogOut, Trash2, Shield, PieChart } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard size={20} />,
  "/analytics": <PieChart size={20} />,
  "/cases": <FileText size={20} />,
  "/drafts": <FileEdit size={20} />,
  "/exports": <Download size={20} />,
  "/trash": <Trash2 size={20} />,
  "/settings": <Settings size={20} />,
  "/admin": <Shield size={20} />,
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        if (data) setRole(data.role);
      }
      setRoleLoaded(true);
    }
    loadRole();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const visibleNav = roleLoaded
    ? navigation.filter(item => !item.adminOnly || role === 'Admin')
    : navigation.filter(item => !item.adminOnly);

  return (
    <>
      {/* Mobile overlay — only visible on mobile when drawer is open */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-text-primary/50 z-40 md:hidden" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 
        Mobile: fixed drawer from left, translated off-screen when closed.
        Desktop: relative, collapsible icon-rail that expands on hover.
      */}
      <div
        className={[
          // Mobile: fixed drawer that slides in/out
          'fixed inset-y-0 left-0 z-50 md:relative md:z-auto',
          // Desktop: collapsed icon-rail with expand-on-hover
          'md:flex-shrink-0 md:h-full',
          // Group used for hover-expand on desktop
          'group',
          // Mobile slide transition
          'transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <aside 
          className={[
            'h-full flex flex-col bg-surface border-r border-text-secondary/10',
            'transition-all duration-300 ease-in-out overflow-hidden',
            // Mobile: always full sidebar width (no icon-only mode needed)
            'w-sidebar',
            // Desktop: collapsed to icon-only, expand to full width on hover
            'md:w-20 group-hover:md:w-sidebar',
            // Shadow only when expanded on desktop
            'shadow-none group-hover:md:shadow-card',
          ].join(' ')}
          aria-label="Sidebar Navigation"
        >
          {/* Logo area */}
          <div className="flex items-center pl-[24px] pr-md border-b border-text-secondary/10 h-topbar gap-sm flex-shrink-0">
            <Image src="/veldra.png" alt="Veldra Logo" width={32} height={32} className="flex-shrink-0 object-contain" />
            <span className="font-bold text-heading text-text-primary whitespace-nowrap md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300">Veldra</span>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col py-md gap-xs flex-1 mt-md overflow-y-auto">
            {visibleNav.map((item) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-sm mx-md px-md py-sm rounded-button hover:bg-background text-text-primary text-body font-medium transition-colors overflow-hidden whitespace-nowrap ${isActive ? 'bg-background font-semibold' : ''}`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <div className="flex-shrink-0 w-[24px] h-[24px] flex items-center justify-center">
                    {iconMap[item.href]}
                  </div>
                  <span className="md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300 delay-75">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className="py-md border-t border-text-secondary/10 flex flex-col gap-xs flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="w-[calc(100%-24px)] flex items-center gap-sm mx-md px-md py-sm rounded-button hover:bg-background text-error text-body font-medium text-left transition-colors overflow-hidden whitespace-nowrap"
              title="Sign out"
            >
              <div className="flex-shrink-0 w-[24px] h-[24px] flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span className="md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300 delay-75">Sign out</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
