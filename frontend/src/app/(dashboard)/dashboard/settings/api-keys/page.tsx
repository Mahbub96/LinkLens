'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { formatDate, copyToClipboard } from '@/lib/utils';
import { Key, Plus, Trash2, RotateCcw, Copy, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys', wsId],
    queryFn: () => api.apiKeys.list(wsId),
    enabled: !!wsId,
  });

  const createMutation = useMutation({
    mutationFn: () => api.apiKeys.create(wsId, { name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKey(res.key);
      setName('');
      toast.success('API key created – copy it now!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.apiKeys.delete(wsId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key deleted');
    },
  });

  const rotateMutation = useMutation({
    mutationFn: (id: string) => api.apiKeys.rotate(wsId, id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKey(res.key);
      toast.success('API key rotated – copy the new key!');
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-zinc-500 mt-1">Manage API keys for programmatic access</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Key
        </button>
      </div>

      {/* New key display */}
      {newKey && (
        <div className="glass-card p-5 border-emerald-500/30 animate-slide-down">
          <p className="text-sm text-emerald-400 mb-2 font-medium">Your new API key (copy now – it won't be shown again):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface-200 p-3 rounded-lg text-sm text-zinc-300 font-mono">
              {showKey ? newKey : '•'.repeat(newKey.length)}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="btn-ghost p-2">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={() => { copyToClipboard(newKey); toast.success('Copied!'); }} className="btn-secondary">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="glass-card p-6 flex gap-3 animate-slide-down">
          <input className="input flex-1" placeholder="Key name (e.g., Production API)" value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(keys || []).map((key: any) => (
          <div key={key.id} className="glass-card p-5 flex items-center gap-4 animate-fade-in">
            <Key className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{key.name}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                <code className="bg-surface-200 px-2 py-0.5 rounded">{key.keyPrefix}••••••</code>
                <span>Scopes: {key.scopes?.join(', ')}</span>
                {key.lastUsedAt && <span>Last used: {formatDate(key.lastUsedAt)}</span>}
              </div>
            </div>
            <button onClick={() => rotateMutation.mutate(key.id)} className="btn-ghost p-2" title="Rotate key">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => deleteMutation.mutate(key.id)} className="btn-ghost p-2 hover:text-red-400" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!isLoading && (!keys || keys.length === 0) && (
          <p className="text-zinc-500 text-center py-8">No API keys yet</p>
        )}
      </div>
    </div>
  );
}
