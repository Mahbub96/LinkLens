'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CONDITION_TYPES = ['GEO', 'DEVICE', 'OS', 'BROWSER', 'LANGUAGE', 'AB_TEST'];

export default function CreateLinkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';

  const [form, setForm] = useState({
    destinationUrl: '',
    slug: '',
    title: '',
    password: '',
    expiresAt: '',
    activatesAt: '',
    maxClicks: '',
    campaignId: '',
  });

  const [rules, setRules] = useState<{ conditionType: string; conditionValue: string; targetUrl: string }[]>([]);

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', wsId],
    queryFn: () => api.campaigns.list(wsId),
    enabled: !!wsId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.links.create(wsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success('Link created!');
      router.push('/dashboard/links');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create link'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      destinationUrl: form.destinationUrl,
      slug: form.slug || undefined,
      title: form.title || undefined,
      password: form.password || undefined,
      expiresAt: form.expiresAt || undefined,
      activatesAt: form.activatesAt || undefined,
      maxClicks: form.maxClicks ? Number(form.maxClicks) : undefined,
      campaignId: form.campaignId || undefined,
      rules: rules.length > 0 ? rules : undefined,
    });
  };

  const addRule = () => {
    setRules([...rules, { conditionType: 'DEVICE', conditionValue: '{}', targetUrl: '' }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: string) => {
    const updated = [...rules];
    (updated[index] as any)[field] = value;
    setRules(updated);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/links" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Link</h1>
          <p className="text-zinc-500 mt-1">Configure your tracking link and routing rules</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination URL */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Destination</h2>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Destination URL *</label>
            <input
              className="input"
              placeholder="https://example.com/your-page"
              value={form.destinationUrl}
              onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Custom Slug</label>
              <input
                className="input"
                placeholder="my-link (auto-generated if empty)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Title</label>
              <input
                className="input"
                placeholder="Link title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Protection & Scheduling */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Protection & Scheduling</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Password (optional)</label>
              <input
                type="password"
                className="input"
                placeholder="Protect with password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Max Clicks</label>
              <input
                type="number"
                className="input"
                placeholder="No limit"
                min="1"
                value={form.maxClicks}
                onChange={(e) => setForm({ ...form, maxClicks: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Activates At</label>
              <input
                type="datetime-local"
                className="input"
                value={form.activatesAt}
                onChange={(e) => setForm({ ...form, activatesAt: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Expires At</label>
              <input
                type="datetime-local"
                className="input"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Campaign</label>
            <select
              className="input"
              value={form.campaignId}
              onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
            >
              <option value="">No campaign</option>
              {(campaigns?.data || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Match Rules */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Routing Rules</h2>
            <button type="button" onClick={addRule} className="btn-ghost text-sm">
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>

          {rules.map((rule, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-200/50 border border-zinc-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Rule {i + 1}</span>
                <button type="button" onClick={() => removeRule(i)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  className="input text-sm"
                  value={rule.conditionType}
                  onChange={(e) => updateRule(i, 'conditionType', e.target.value)}
                >
                  {CONDITION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  className="input text-sm"
                  placeholder='{"types":["mobile"]}'
                  value={rule.conditionValue}
                  onChange={(e) => updateRule(i, 'conditionValue', e.target.value)}
                />
                <input
                  className="input text-sm"
                  placeholder="https://mobile.example.com"
                  value={rule.targetUrl}
                  onChange={(e) => updateRule(i, 'targetUrl', e.target.value)}
                />
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No routing rules. All traffic goes to the destination URL.
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/links" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Create Link</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
