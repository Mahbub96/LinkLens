'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { formatNumber, timeAgo } from '@/lib/utils';
import {
  MousePointerClick, Users, TrendingUp, Link2, Globe, Monitor,
  Chrome, Smartphone, Shield, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9'];

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }: any) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        {sub && <span className="text-xs text-zinc-500">{sub}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{formatNumber(Number(value) || 0)}</div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
      {children}
    </div>
  );
}

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

export default function DashboardPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', wsId],
    queryFn: () => api.analytics.dashboard(wsId),
    enabled: !!wsId,
  });

  const { data: timeseries } = useQuery({
    queryKey: ['dashboard-timeseries', wsId],
    queryFn: () => api.analytics.timeseries(wsId),
    enabled: !!wsId,
  });

  const { data: countries } = useQuery({
    queryKey: ['dashboard-countries', wsId],
    queryFn: () => api.analytics.countries(wsId),
    enabled: !!wsId,
  });

  const { data: devices } = useQuery({
    queryKey: ['dashboard-devices', wsId],
    queryFn: () => api.analytics.devices(wsId),
    enabled: !!wsId,
  });

  const { data: browsers } = useQuery({
    queryKey: ['dashboard-browsers', wsId],
    queryFn: () => api.analytics.browsers(wsId),
    enabled: !!wsId,
  });

  const { data: referrers } = useQuery({
    queryKey: ['dashboard-referrers', wsId],
    queryFn: () => api.analytics.referrers(wsId),
    enabled: !!wsId,
  });

  const { data: quality } = useQuery({
    queryKey: ['dashboard-quality', wsId],
    queryFn: () => api.analytics.trafficQuality(wsId),
    enabled: !!wsId,
  });

  const { data: liveEvents } = useQuery({
    queryKey: ['dashboard-live', wsId],
    queryFn: () => api.analytics.live(wsId),
    enabled: !!wsId,
    refetchInterval: 5000,
  });

  // Placeholder data for empty states
  const timeseriesData = timeseries || [];
  const countriesData = countries || [];
  const devicesData = devices || [];
  const browsersData = browsers || [];
  const referrersData = referrers || [];
  const liveData = liveEvents || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Overview of your link performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MousePointerClick} label="Total Clicks" value={stats?.total_clicks} sub="Last 30 days" />
        <StatCard icon={Users} label="Unique Visitors" value={stats?.unique_visitors} color="purple" />
        <StatCard icon={TrendingUp} label="Today's Clicks" value={stats?.today_clicks} color="emerald" />
        <StatCard icon={Shield} label="Bot Clicks" value={stats?.bot_clicks} color="amber" sub={`VPN: ${formatNumber(Number(stats?.vpn_clicks) || 0)}`} />
      </div>

      {/* Timeseries Chart */}
      <ChartCard title="Click Trends">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseriesData}>
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#6366f1" fill="url(#clickGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="unique_visitors" name="Unique" stroke="#8b5cf6" fill="url(#visitorGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Countries */}
        <ChartCard title="Top Countries">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countriesData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="country" tick={{ fill: '#d4d4d8', fontSize: 12 }} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="clicks" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Devices */}
        <ChartCard title="Device Distribution">
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devicesData}
                  dataKey="clicks"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  strokeWidth={0}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {devicesData.map((entry: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Browsers */}
        <ChartCard title="Browser Distribution">
          <div className="space-y-3">
            {browsersData.slice(0, 5).map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{b.name || 'Unknown'}</span>
                    <span className="text-zinc-500">{formatNumber(b.clicks)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{
                        width: `${Math.min(100, (b.clicks / (browsersData[0]?.clicks || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {browsersData.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-8">No data yet</p>
            )}
          </div>
        </ChartCard>

        {/* Referrers */}
        <ChartCard title="Top Referrers">
          <div className="space-y-3">
            {referrersData.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-200/50 transition-colors">
                <span className="text-sm text-zinc-300 truncate max-w-[200px]">
                  {r.referrer || 'Direct'}
                </span>
                <span className="text-sm font-medium text-zinc-400">{formatNumber(r.clicks)}</span>
              </div>
            ))}
            {referrersData.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-8">No data yet</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Traffic Quality + Live Feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Traffic Quality */}
        <ChartCard title="Traffic Quality">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-200/50">
              <div className="text-2xl font-bold text-emerald-400">
                {quality?.avg_score ? Number(quality.avg_score).toFixed(0) : '—'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Avg Quality Score</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-200/50">
              <div className="text-2xl font-bold text-amber-400">
                {formatNumber(Number(quality?.bot_count) || 0)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Bot Clicks</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-200/50">
              <div className="text-2xl font-bold text-brand-400">
                {formatNumber(Number(quality?.vpn_count) || 0)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">VPN Traffic</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-200/50">
              <div className="text-2xl font-bold text-red-400">
                {formatNumber(Number(quality?.tor_count) || 0)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Tor Traffic</div>
            </div>
          </div>
        </ChartCard>

        {/* Live Activity Feed */}
        <ChartCard title="Live Activity">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {liveData.slice(0, 10).map((event: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-200/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-300 truncate">
                    {event.country || '??'} · {event.device || 'Unknown'} · {event.browser || 'Unknown'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {event.referrer ? `from ${event.referrer}` : 'Direct'} · {timeAgo(event.timestamp)}
                  </div>
                </div>
                {event.is_bot ? (
                  <span className="badge-warning">Bot</span>
                ) : (
                  <span className="badge-success">Human</span>
                )}
              </div>
            ))}
            {liveData.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
