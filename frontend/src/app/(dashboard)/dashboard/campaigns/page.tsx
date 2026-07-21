'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { formatNumber, formatDate } from '@/lib/utils';
import { Plus, Megaphone, Loader2, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', tags: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', wsId],
    queryFn: () => api.campaigns.list(wsId),
    enabled: !!wsId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.campaigns.create(wsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#6366f1', tags: '' });
      toast.success('Campaign created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.campaigns.delete(wsId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
    },
  });

  const campaigns = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-zinc-500 mt-1">Organize links into campaigns</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name: form.name,
              description: form.description || undefined,
              color: form.color,
              tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
            });
          }}
          className="glass-card p-6 space-y-4 animate-slide-down"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Color</label>
              <input type="color" className="input h-10 p-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Tags (comma-separated)</label>
            <input className="input" placeholder="marketing, q4, launch" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Campaigns List */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign: any) => (
          <div key={campaign.id} className="glass-card p-5 hover:border-zinc-700/50 transition-all animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.color }} />
                <h3 className="font-medium text-white">{campaign.name}</h3>
              </div>
              <button onClick={() => deleteMutation.mutate(campaign.id)} className="text-zinc-500 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {campaign.description && (
              <p className="text-sm text-zinc-500 mt-2">{campaign.description}</p>
            )}
            <div className="flex items-center gap-3 mt-4 text-xs text-zinc-500">
              <span>{campaign._count?.links || 0} links</span>
              <span>·</span>
              <span>{formatDate(campaign.createdAt)}</span>
            </div>
            {campaign.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {campaign.tags.map((tag: string) => (
                  <span key={tag} className="badge-info text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isLoading && campaigns.length === 0 && !showCreate && (
        <div className="glass-card p-16 text-center">
          <Megaphone className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No campaigns yet</h3>
          <p className="text-zinc-500">Create a campaign to organize your links.</p>
        </div>
      )}
    </div>
  );
}
