'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { Globe, Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DomainsPage() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [hostname, setHostname] = useState('');

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains', wsId],
    queryFn: () => api.domains.list(wsId),
    enabled: !!wsId,
  });

  const createMutation = useMutation({
    mutationFn: () => api.domains.create(wsId, { hostname }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setHostname('');
      toast.success('Domain added');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.domains.verify(wsId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domain verified');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.domains.delete(wsId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domain deleted');
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Custom Domains</h1>
        <p className="text-zinc-500 mt-1">Add your own domain for branded short links with auto-SSL</p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="flex gap-3">
          <input className="input flex-1" placeholder="links.yourdomain.com" value={hostname} onChange={(e) => setHostname(e.target.value)} required />
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add</>}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {(domains || []).map((domain: any) => (
          <div key={domain.id} className="glass-card p-5 flex items-center gap-4 animate-fade-in">
            <Globe className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{domain.hostname}</div>
              <div className="flex items-center gap-2 mt-1">
                {domain.isVerified ? (
                  <span className="badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>
                ) : (
                  <span className="badge-warning"><AlertCircle className="w-3 h-3 mr-1" /> Pending</span>
                )}
              </div>
            </div>
            {!domain.isVerified && (
              <button onClick={() => verifyMutation.mutate(domain.id)} className="btn-secondary text-sm">Verify</button>
            )}
            <button onClick={() => deleteMutation.mutate(domain.id)} className="btn-ghost p-2 hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!isLoading && (!domains || domains.length === 0) && (
          <p className="text-zinc-500 text-center py-8">No custom domains configured</p>
        )}
      </div>
    </div>
  );
}
