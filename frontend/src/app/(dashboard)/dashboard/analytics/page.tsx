'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { formatNumber } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9', '#4f46e5', '#7c3aed', '#5b21b6'];
const PERIODS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: '365 Days', value: 365 },
];

export default function AnalyticsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [days, setDays] = useState(30);

  const { data: timeseries } = useQuery({
    queryKey: ['analytics-ts', wsId, days],
    queryFn: () => api.analytics.timeseries(wsId, days),
    enabled: !!wsId,
  });

  const { data: countries } = useQuery({
    queryKey: ['analytics-countries', wsId, days],
    queryFn: () => api.analytics.countries(wsId, days),
    enabled: !!wsId,
  });

  const { data: devices } = useQuery({
    queryKey: ['analytics-devices', wsId, days],
    queryFn: () => api.analytics.devices(wsId, days),
    enabled: !!wsId,
  });

  const { data: browsers } = useQuery({
    queryKey: ['analytics-browsers', wsId, days],
    queryFn: () => api.analytics.browsers(wsId, days),
    enabled: !!wsId,
  });

  const { data: os } = useQuery({
    queryKey: ['analytics-os', wsId, days],
    queryFn: () => api.analytics.os(wsId, days),
    enabled: !!wsId,
  });

  const { data: referrers } = useQuery({
    queryKey: ['analytics-referrers', wsId, days],
    queryFn: () => api.analytics.referrers(wsId, days),
    enabled: !!wsId,
  });

  const { data: utmSources } = useQuery({
    queryKey: ['analytics-utm-source', wsId, days],
    queryFn: () => api.analytics.utm(wsId, 'utm_source', days),
    enabled: !!wsId,
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-200 border border-zinc-700/50 rounded-xl px-4 py-2 shadow-xl">
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
            {p.name}: {formatNumber(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-zinc-500 mt-1">Deep forensic analysis of your traffic</p>
        </div>
        <div className="flex gap-1 bg-surface-200 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                days === p.value
                  ? 'bg-brand-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeseries */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Click Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries || []}>
              <defs>
                <linearGradient id="aClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#6366f1" fill="url(#aClicks)" strokeWidth={2} />
              <Area type="monotone" dataKey="unique_visitors" name="Unique" stroke="#8b5cf6" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Countries */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {(countries || []).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{c.country || 'Unknown'}</span>
                <span className="text-sm text-zinc-500">{formatNumber(c.clicks)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Devices</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={devices || []} dataKey="clicks" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={45} strokeWidth={0}>
                  {(devices || []).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OS */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Operating Systems</h3>
          <div className="space-y-3">
            {(os || []).map((o: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-sm text-zinc-300 flex-1">{o.name || 'Unknown'}</span>
                <span className="text-sm text-zinc-500">{formatNumber(o.clicks)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Browsers */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Browsers</h3>
          <div className="space-y-3">
            {(browsers || []).map((b: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300">{b.name}</span>
                  <span className="text-zinc-500">{formatNumber(b.clicks)}</span>
                </div>
                <div className="h-1 bg-surface-300 rounded-full">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (b.clicks / ((browsers || [])[0]?.clicks || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referrers */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Referrers</h3>
          <div className="space-y-2">
            {(referrers || []).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-200/50">
                <span className="text-sm text-zinc-300 truncate max-w-[150px]">{r.referrer || 'Direct'}</span>
                <span className="text-sm text-zinc-500">{formatNumber(r.clicks)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* UTM Sources */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">UTM Sources</h3>
          <div className="space-y-2">
            {(utmSources || []).map((u: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-200/50">
                <span className="text-sm text-zinc-300">{u.name}</span>
                <span className="text-sm text-zinc-500">{formatNumber(u.clicks)}</span>
              </div>
            ))}
            {(!utmSources || utmSources.length === 0) && (
              <p className="text-sm text-zinc-500 text-center py-4">No UTM data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
