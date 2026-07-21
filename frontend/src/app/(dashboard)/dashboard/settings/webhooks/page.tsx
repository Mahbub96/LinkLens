'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { Webhook, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENTS = ['link.click', 'link.created', 'link.disabled', 'campaign.finished'];

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ url: '', events: ['link.click'] });
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks', wsId],
    queryFn: () => api.webhooks.list(wsId),
    enabled: !!wsId,
  });

  const { data: logs } = useQuery({
    queryKey: ['webhook-logs', wsId, expandedLogs],
    queryFn: () => expandedLogs ? api.webhooks.logs(wsId, expandedLogs) : null,
    enabled: !!expandedLogs,
  });

  const createMutation = useMutation({
    mutationFn: () => api.webhooks.create(wsId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setShowCreate(false);
      setForm({ url: '', events: ['link.click'] });
      toast.success('Webhook created');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => api.webhooks.update(wsId, id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.webhooks.delete(wsId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
  });

  const toggleEvent = (event: string) => {
    setForm({
      ...form,
      events: form.events.includes(event) ? form.events.filter((e) => e !== event) : [...form.events, event],
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-zinc-500 mt-1">Receive real-time event notifications</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Webhook
        </button>
      </div>

      {showCreate && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="glass-card p-6 space-y-4 animate-slide-down">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Endpoint URL</label>
            <input className="input" placeholder="https://api.example.com/webhooks" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Events</label>
            <div className="flex flex-wrap gap-2">
              {EVENTS.map((event) => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.events.includes(event)
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-300 text-zinc-400'
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {(webhooks || []).map((wh: any) => (
          <div key={wh.id} className="glass-card animate-fade-in">
            <div className="p-5 flex items-center gap-4">
              <Webhook className="w-5 h-5 text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{wh.url}</div>
                <div className="flex items-center gap-2 mt-1">
                  {wh.events.map((e: string) => (
                    <span key={e} className="badge-info text-xs">{e}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ id: wh.id, isActive: !wh.isActive })}
                className="btn-ghost p-2"
              >
                {wh.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-zinc-500" />}
              </button>
              <button
                onClick={() => setExpandedLogs(expandedLogs === wh.id ? null : wh.id)}
                className="btn-ghost p-2"
              >
                {expandedLogs === wh.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteMutation.mutate(wh.id)} className="btn-ghost p-2 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {expandedLogs === wh.id && logs && (
              <div className="border-t border-zinc-800/50 p-4 space-y-2">
                <h4 className="text-xs font-medium text-zinc-500 uppercase">Recent Deliveries</h4>
                {(logs || []).map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 text-xs">
                    <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>
                      {log.statusCode || '—'}
                    </span>
                    <span className="text-zinc-400">{log.event}</span>
                    <span className="text-zinc-600 flex-1 text-right">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {(!logs || logs.length === 0) && <p className="text-xs text-zinc-500">No deliveries yet</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
