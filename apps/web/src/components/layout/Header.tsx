// ============================================================================
// Header — Breadcrumb + Theme toggle + Avatar
// ============================================================================

'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { Sun, Moon, ChevronRight } from 'lucide-react';

interface HeaderProps {
  userName: string;
  sidebarCollapsed?: boolean;
}

/** Map pathname ke breadcrumb label */
function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; href: string }> = [];

  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    admin: 'Admin',
    super: 'Superadmin',
    user: 'Personal',
    users: 'User Management',
    upload: 'Import Excel',
    reports: 'Laporan',
    map: 'Peta Realtime',
    performance: 'Performa',
  };

  let path = '';
  for (const segment of segments) {
    path += `/${segment}`;
    crumbs.push({
      label: labelMap[segment] || segment,
      href: path,
    });
  }

  return crumbs;
}

export function Header({ userName }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-header items-center justify-between border-b border-border',
        'bg-surface/80 backdrop-blur-md px-8',
        'dark:bg-dark-surface/80 dark:border-dark-border',
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={14} className="text-text-muted" />}
            <span
              className={cn(
                index === breadcrumbs.length - 1
                  ? 'font-semibold text-text-primary dark:text-gray-100'
                  : 'text-text-secondary dark:text-gray-400',
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

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

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              'bg-accent text-white text-sm font-bold',
            )}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
