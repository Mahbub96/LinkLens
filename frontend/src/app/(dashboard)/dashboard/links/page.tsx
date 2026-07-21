'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { formatNumber, timeAgo, copyToClipboard, truncate } from '@/lib/utils';
import {
  Plus, Search, Copy, ExternalLink, MoreVertical, Trash2,
  Edit3, Archive, QrCode, Link2, ToggleLeft, ToggleRight,
  Loader2, Shield, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LinksPage() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['links', wsId, page, search],
    queryFn: () => api.links.list(wsId, { page, limit: 20, search }),
    enabled: !!wsId,
  });

  const deleteMutation = useMutation({
    mutationFn: (linkId: string) => api.links.delete(wsId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success('Link deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ linkId, isEnabled }: { linkId: string; isEnabled: boolean }) =>
      api.links.update(wsId, linkId, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (linkId: string) => api.links.duplicate(wsId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success('Link duplicated');
    },
  });

  const links = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleCopy = async (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    const ok = await copyToClipboard(url);
    if (ok) toast.success('Link copied!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Links</h1>
          <p className="text-zinc-500 mt-1">{total} total links</p>
        </div>
        <Link href="/dashboard/links/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Create Link
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          className="input pl-10"
          placeholder="Search links..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        )}

        {!isLoading && links.length === 0 && (
          <div className="glass-card p-16 text-center">
            <Link2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No links yet</h3>
            <p className="text-zinc-500 mb-6">Create your first tracking link to get started.</p>
            <Link href="/dashboard/links/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Create Link
            </Link>
          </div>
        )}

        {links.map((link: any) => (
          <div
            key={link.id}
            className="glass-card p-5 flex items-center gap-4 hover:border-zinc-700/50 transition-all animate-fade-in"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              link.isEnabled ? 'bg-brand-500/10' : 'bg-zinc-700/20'
            }`}>
              <Link2 className={`w-5 h-5 ${link.isEnabled ? 'text-brand-400' : 'text-zinc-600'}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/links/${link.id}`} className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
                  {link.title || link.slug}
                </Link>
                {link.isProtected && <Shield className="w-3 h-3 text-amber-400" />}
                {link.expiresAt && <Clock className="w-3 h-3 text-zinc-500" />}
                {!link.isEnabled && <span className="badge-warning">Disabled</span>}
                {link.isArchived && <span className="badge-danger">Archived</span>}
              </div>
              <div className="text-xs text-zinc-500 mt-1 truncate">
                {truncate(link.destinationUrl, 60)}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-zinc-400">
                  /{link.slug}
                </span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-500">
                  {formatNumber(link.totalClicks)} clicks
                </span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-500">
                  {timeAgo(link.createdAt)}
                </span>
                {link.campaign && (
                  <>
                    <span className="text-xs text-zinc-600">·</span>
                    <span className="badge-info">{link.campaign.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleCopy(link.slug)}
                className="btn-ghost p-2"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={link.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost p-2"
                title="Open destination"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => toggleMutation.mutate({ linkId: link.id, isEnabled: !link.isEnabled })}
                className="btn-ghost p-2"
                title={link.isEnabled ? 'Disable' : 'Enable'}
              >
                {link.isEnabled ? (
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-zinc-500" />
                )}
              </button>
              <button
                onClick={() => duplicateMutation.mutate(link.id)}
                className="btn-ghost p-2"
                title="Duplicate"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteMutation.mutate(link.id)}
                className="btn-ghost p-2 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
