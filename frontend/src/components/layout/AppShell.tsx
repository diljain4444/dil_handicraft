import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FAB } from '../fab/FAB';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/transactions': 'Transactions',
    '/analytics': 'Analytics',
    '/more': 'More',
  };

  const title = pageTitles[location.pathname] || 'Dil Handicraft';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} />

        <main className="flex-1 overflow-y-auto scrollbar-thin pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>

      {/* Floating action button */}
      <FAB />
    </div>
  );
}
