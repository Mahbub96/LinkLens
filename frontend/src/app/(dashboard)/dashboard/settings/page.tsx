'use client';

import { useAuthStore, useWorkspaceStore } from '@/lib/stores';
import { Settings, User, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 mt-1">Workspace and account settings</p>
      </div>

      {/* Account */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-medium text-white">Account</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name</label>
            <div className="text-sm text-white">{user?.name || '—'}</div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <div className="text-sm text-white">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-medium text-white">Workspace</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name</label>
            <div className="text-sm text-white">{workspace?.name || '—'}</div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Slug</label>
            <div className="text-sm text-white font-mono">{workspace?.slug || '—'}</div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Role</label>
            <div className="text-sm text-white">{workspace?.role || '—'}</div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">ID</label>
            <div className="text-xs text-zinc-500 font-mono">{workspace?.id || '—'}</div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-medium text-white">Security</h2>
        </div>
        <p className="text-sm text-zinc-400">
          GDPR IP anonymization, Two-Factor Authentication, and session management settings will appear here.
        </p>
      </div>
    </div>
  );
}
