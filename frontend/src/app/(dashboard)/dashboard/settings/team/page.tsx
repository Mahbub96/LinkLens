'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { getInitials, formatDate } from '@/lib/utils';
import { Users, UserPlus, Trash2, Loader2, Crown, Shield, BarChart3, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_ICONS: Record<string, any> = {
  OWNER: Crown,
  ADMIN: Shield,
  MANAGER: Edit3,
  ANALYST: BarChart3,
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'text-amber-400',
  ADMIN: 'text-brand-400',
  MANAGER: 'text-emerald-400',
  ANALYST: 'text-zinc-400',
};

export default function TeamPage() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'MANAGER' });

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', wsId],
    queryFn: () => api.workspaces.members(wsId),
    enabled: !!wsId,
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.workspaces.invite(wsId, inviteForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setShowInvite(false);
      setInviteForm({ email: '', role: 'MANAGER' });
      toast.success('Invitation sent');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-zinc-500 mt-1">Manage workspace members and roles</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="btn-primary">
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {showInvite && (
        <form onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate(); }} className="glass-card p-6 space-y-4 animate-slide-down">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Email</label>
              <input className="input" type="email" placeholder="team@example.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Role</label>
              <select className="input" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="ANALYST">Analyst</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={inviteMutation.isPending} className="btn-primary">
              {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {(members || []).map((member: any) => {
          const RoleIcon = ROLE_ICONS[member.role] || Users;
          const roleColor = ROLE_COLORS[member.role] || 'text-zinc-400';
          return (
            <div key={member.id} className="glass-card p-5 flex items-center gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-medium text-brand-400">
                {getInitials(member.user?.name || member.user?.email || 'U')}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{member.user?.name || member.user?.email}</div>
                <div className="text-xs text-zinc-500">{member.user?.email}</div>
              </div>
              <div className={`flex items-center gap-1.5 ${roleColor}`}>
                <RoleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{member.role}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
