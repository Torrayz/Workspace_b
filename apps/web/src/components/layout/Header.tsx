// ============================================================================
// Header — Page title + Theme toggle + Avatar
// Breadcrumb disederhanakan: hanya tampilkan label halaman aktif
// ============================================================================

'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  userName: string;
  sidebarCollapsed?: boolean;
}

/** Map pathname ke label halaman */
function getPageLabel(pathname: string): string {
  const labelMap: Record<string, string> = {
    '/dashboard/admin': 'Dashboard',
    '/dashboard/admin/reports': 'Detail Laporan',
    '/dashboard/admin/map': 'Peta Realtime',
    '/dashboard/admin/performance': 'Performa User',
    '/dashboard/super': 'Dashboard',
    '/dashboard/super/users': 'Kelola User',
    '/dashboard/super/users/upload': 'Import Excel',
    '/dashboard/user': 'Dashboard Saya',
  };

  return labelMap[pathname] || 'Dashboard';
}

export function Header({ userName }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const pageLabel = getPageLabel(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-header items-center justify-between border-b border-border',
        'bg-surface/80 backdrop-blur-md px-8',
        'dark:bg-dark-surface/80 dark:border-dark-border',
      )}
    >
      {/* Page title — hanya nama halaman aktif */}
      <h2 className="text-sm font-semibold text-text-primary dark:text-gray-100">
        {pageLabel}
      </h2>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
            'transition-colors duration-200',
            'dark:text-gray-400 dark:hover:bg-dark-surface-alt dark:hover:text-gray-100',
          )}
          title={theme === 'light' ? 'Switch ke Dark Mode' : 'Switch ke Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              'bg-accent text-white text-sm font-bold',
            )}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:block text-sm font-medium text-text-primary dark:text-gray-100">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
