// ============================================================================
// Dashboard Layout — Sidebar + Header + Main content
// State sidebar collapsed di-manage di sini, diteruskan ke Sidebar & Header
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: string;
  userName: string;
  userNomorInduk: string;
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userNomorInduk,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userRole={userRole}
        userName={userName}
        userNomorInduk={userNomorInduk}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      {/* Main area — margin-left sinkron dengan sidebar */}
      <div
        className={cn(
          'flex-1 transition-all duration-300 overflow-hidden',
          sidebarCollapsed ? 'ml-[64px]' : 'ml-[240px]',
        )}
      >
        <Header userName={userName} />
        {children}
      </div>
    </div>
  );
}
