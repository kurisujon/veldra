'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { navigation } from '@/config/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, FileEdit, Download, Settings, LogOut, Trash2, Shield } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  "/": <LayoutDashboard size={20} />,
  "/cases": <FileText size={20} />,
  "/drafts": <FileEdit size={20} />,
  "/exports": <Download size={20} />,
  "/trash": <Trash2 size={20} />,
  "/settings": <Settings size={20} />,
  "/admin": <Shield size={20} />,
};

export function Sidebar() {
  const router = useRouter();
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

  // Only show admin items if role is confirmed as Admin (not while loading)
  const visibleNav = roleLoaded
    ? navigation.filter(item => !item.adminOnly || role === 'Admin')
    : navigation.filter(item => !item.adminOnly);

  return (
    <div className="relative h-full z-30 w-20 flex-shrink-0 group">
      <aside 
        className="absolute top-0 left-0 h-full flex flex-col bg-surface border-r border-text-secondary/10 transition-all duration-300 ease-in-out overflow-hidden w-20 group-hover:w-sidebar shadow-none group-hover:shadow-card"
        aria-label="Sidebar Navigation"
      >
        <div className="flex items-center pl-[24px] pr-md border-b border-text-secondary/10 h-topbar gap-sm">
          <Image src="/veldra.png" alt="Veldra Logo" width={32} height={32} className="flex-shrink-0 object-contain" />
          <span className="font-bold text-heading text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Veldra</span>
        </div>

        <nav className="flex flex-col py-md gap-xs flex-1 mt-md">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-sm mx-md px-md py-sm rounded-button hover:bg-background text-text-primary text-body font-medium transition-colors overflow-hidden whitespace-nowrap"
              title={item.label}
              aria-label={item.label}
            >
              <div className="flex-shrink-0 w-[24px] h-[24px] flex items-center justify-center">
                {iconMap[item.href]}
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="py-md border-t border-text-secondary/10 flex flex-col gap-xs">
          <button
            onClick={handleSignOut}
            className="w-[calc(100%-24px)] flex items-center gap-sm mx-md px-md py-sm rounded-button hover:bg-background text-error text-body font-medium text-left transition-colors overflow-hidden whitespace-nowrap"
            title="Sign out"
          >
            <div className="flex-shrink-0 w-[24px] h-[24px] flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Sign out</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
