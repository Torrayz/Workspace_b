// ============================================================================
// Dashboard Layout — Sidebar + Header + Main content
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
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

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userRole={userRole}
        userName={userName}
        userNomorInduk={userNomorInduk}
      />

      {/* Main area — margin-left sesuai lebar sidebar */}
      <div
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarCollapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar',
        )}
      >
        <Header userName={userName} sidebarCollapsed={sidebarCollapsed} />
        {children}
      </div>
    </div>
  );
}
