'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Link2, BarChart3, Megaphone, QrCode, Globe,
  Settings, Key, Webhook, Users, Menu, X, LogOut, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useAuthStore, useWorkspaceStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/links', icon: Link2, label: 'Links' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/dashboard/qr', icon: QrCode, label: 'QR Codes' },
];

const settingsItems = [
  { href: '/dashboard/settings/domains', icon: Globe, label: 'Domains' },
  { href: '/dashboard/settings/api-keys', icon: Key, label: 'API Keys' },
  { href: '/dashboard/settings/webhooks', icon: Webhook, label: 'Webhooks' },
  { href: '/dashboard/settings/team', icon: Users, label: 'Team' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-surface-50 border-r border-zinc-800/50 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">LinkLens</span>
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace selector */}
        {workspace && (
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <button className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-200 hover:bg-surface-300 transition-colors">
              <div className="text-left">
                <div className="text-sm font-medium text-white truncate">{workspace.name}</div>
                <div className="text-xs text-zinc-500">{workspace.role || 'Owner'}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="mb-2 px-3 text-xs font-medium text-zinc-600 uppercase tracking-wider">Main</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                pathname === item.href && 'active',
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          <div className="mt-6 mb-2 px-3 text-xs font-medium text-zinc-600 uppercase tracking-wider">Settings</div>
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                pathname === item.href && 'active',
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-medium text-brand-400">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'lg:ml-64' : '')}>
        {/* Top bar */}
        <header className="h-16 bg-surface-0/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center px-6 sticky top-0 z-30">
          <button onClick={toggleSidebar} className="lg:hidden mr-4 text-zinc-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
