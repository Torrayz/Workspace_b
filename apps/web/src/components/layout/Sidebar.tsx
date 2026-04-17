// ============================================================================
// Sidebar — Navigasi utama dashboard (collapsible)
// State collapsed dikontrol oleh parent (DashboardLayout)
// ============================================================================

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Upload,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/admin',
    icon: LayoutDashboard,
    roles: ['admin', 'superadmin'],
  },
  {
    label: 'Persetujuan Hapus',
    href: '/dashboard/admin/persetujuan-hapus',
    icon: Trash2,
    roles: ['admin', 'superadmin'],
  },
  {
    label: 'Kelola User',
    href: '/dashboard/super/users',
    icon: Users,
    roles: ['superadmin'],
  },
  {
    label: 'Import Excel',
    href: '/dashboard/super/users/upload',
    icon: Upload,
    roles: ['superadmin'],
  },
];

interface SidebarProps {
  userRole: string;
  userName: string;
  userNomorInduk: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, userName, userNomorInduk, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border',
        'bg-primary text-white transition-all duration-300',
        'dark:bg-dark-surface dark:border-dark-border',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className="flex h-header items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-sm">
              FM
            </div>
            <span className="text-sm font-semibold truncate">Field Marketing</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'text-white/60 hover:text-white hover:bg-white/10 transition-colors',
            collapsed && 'mx-auto',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-white/10 p-3">
        {!collapsed ? (
          <div className="mb-3 rounded-lg bg-white/5 px-3 py-2.5">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-white/50 truncate">{userNomorInduk}</p>
            <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-200">
              {userRole}
            </span>
          </div>
        ) : (
          <div className="mb-3 flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm',
            'text-white/60 hover:bg-danger/20 hover:text-red-300 transition-colors',
            collapsed && 'justify-center px-2',
          )}
          title="Keluar"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
