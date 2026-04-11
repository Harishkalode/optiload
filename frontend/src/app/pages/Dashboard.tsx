import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, TrendingDown, Briefcase, Truck, Package,
  DollarSign, Activity, Eye, Copy, Download, Plus, RefreshCw, CheckCircle2,
  AlertTriangle, XCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard, OLCardHeader } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import {
  fetchDashboardSummary,
  fetchRecentActivities,
  fetchRecentOptimizations,
  type DashboardSummary,
  type DashboardActivity,
  type RecentOptimization,
} from '../services/domainApi';
import { formatRelativeTime } from '../lib/time';

const sparkFromTrend = (trend: { efficiency: number }[]) =>
  trend.map((x, i) => ({ v: Math.min(100, Math.max(0, (x.efficiency ?? 0) * 100)) }));

const STATUS_MAP: Record<string, { badge: 'success' | 'info' | 'warning' | 'error'; label: string }> = {
  completed: { badge: 'success', label: 'Completed' },
  pending: { badge: 'info', label: 'Pending' },
  running: { badge: 'info', label: 'Running' },
  failed: { badge: 'error', label: 'Failed' },
};

function activityType(action: string): 'success' | 'info' | 'warning' | 'error' {
  const a = action.toLowerCase();
  if (a.includes('fail') || a.includes('error')) return 'error';
  if (a.includes('warn') || a.includes('delete')) return 'warning';
  if (a.includes('create') || a.includes('complete')) return 'success';
  return 'info';
}

export function Dashboard() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [jobs, setJobs] = useState<RecentOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, a, j] = await Promise.all([
        fetchDashboardSummary(),
        fetchRecentActivities(),
        fetchRecentOptimizations(),
      ]);
      setSummary(s);
      setActivities(a);
      setJobs(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const rowHover = isDark ? '#0D1117' : '#F8FAFC';

  const trend = summary?.efficiency_trend ?? [];
  const effSpark = sparkFromTrend(trend.length ? trend : [{ efficiency: summary?.avg_efficiency ?? 0 }]);
  // Generate pseudo-sparklines for non-efficiency metrics from their values
  const makeSpark = (base: number, variance: number, n = 12) =>
    Array.from({ length: n }, (_, i) => ({
      efficiency: Math.max(0, base / 100 + Math.sin(i * 0.8) * variance + (Math.random() - 0.5) * variance),
    }));
  const effPct = ((summary?.avg_efficiency ?? 0) * 100).toFixed(1);

  const KPI_CARDS = summary
    ? [
        {
          label: 'Optimization runs',
          value: String(summary.optimizations),
          change: '+',
          up: true,
          icon: Briefcase,
          color: '#3B82F6',
          data: makeSpark(summary.optimizations, 0.1),
        },
        {
          label: 'Fleet (vehicles)',
          value: String(summary.total_vehicles),
          change: '',
          up: true,
          icon: Truck,
          color: '#10B981',
          data: makeSpark(summary.total_vehicles, 0.05),
        },
        {
          label: 'Loads in catalog',
          value: String(summary.total_loads),
          change: '',
          up: true,
          icon: Package,
          color: '#8B5CF6',
          data: makeSpark(summary.total_loads, 0.08),
        },
        {
          label: 'Avg efficiency',
          value: `${effPct}%`,
          change: '',
          up: true,
          icon: DollarSign,
          color: '#F59E0B',
          data: effSpark,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-xl" style={{ background: border }} />
          ))}
        </div>
        <div className="h-64 rounded-xl animate-pulse" style={{ background: border }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <OLCard padding="24px">
          <OLCardHeader title="Dashboard unavailable" subtitle={error} />
          <OLButton variant="primary" className="mt-4" onClick={() => { setLoading(true); load(); }}>
            Retry
          </OLButton>
        </OLCard>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {KPI_CARDS.map(({ label, value, change, up, icon: Icon, color, data }) => (
          <OLCard key={label} hover padding="16px">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: color + '18' }}>
                <Icon size={16} style={{ color }} />
              </div>
              {change ? (
                <div className="flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 600, color: up ? '#16A34A' : '#DC2626' }}>
                  {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {change}
                </div>
              ) : null}
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: textPrimary, letterSpacing: '-0.02em' }}>
              {value}
            </div>
            <div style={{ fontSize: '11px', color: text, marginBottom: 8 }}>{label}</div>
            <div style={{ height: 32, minHeight: 32 }}>
              <ResponsiveContainer width="100%" height={32}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area name={`dash-${label}`} type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#g-${label})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </OLCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2">
          <OLCard padding="0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-3 sm:gap-0" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Recent optimization runs</div>
                <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>From GET /dashboard/recent-optimizations</div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <OLButton
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
                  className="flex-1 sm:flex-none"
                  onClick={() => { setRefreshing(true); load(); }}
                >
                  Refresh
                </OLButton>
                <OLButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/jobs/new')} className="flex-1 sm:flex-none">
                  New Job
                </OLButton>
              </div>
            </div>
            <div className="overflow-x-auto">
              {jobs.length === 0 ? (
                <div className="py-16 text-center" style={{ color: text }}>
                  No optimization runs yet. Start one from <strong style={{ color: textPrimary }}>New Job</strong>.
                </div>
              ) : (
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {['Job ID', 'Vehicle', 'Loads', 'Efficiency', 'Status', 'When', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => {
                      const st = STATUS_MAP[job.status] ?? { badge: 'info' as const, label: job.status };
                      const uPct = ((job.efficiency_score ?? 0) * 100);
                      return (
                        <tr
                          key={job.id}
                          style={{ borderBottom: `1px solid ${border}` }}
                          onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          className="transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent, fontWeight: 500 }}>#{job.id}</span>
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary }}>{job.vehicle_id}</td>
                          <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary }}>{job.load_count}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="rounded-full overflow-hidden" style={{ width: 48, height: 4, background: isDark ? '#1E2A38' : '#E2E8F0' }}>
                                <div style={{ width: `${Math.min(100, uPct)}%`, height: '100%', background: uPct > 85 ? '#10B981' : uPct > 60 ? '#F59E0B' : '#EF4444', borderRadius: 9999 }} />
                              </div>
                              <span style={{ fontSize: '12px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{uPct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <OLBadge status={st.badge as any} label={st.label} />
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '12px', color: text, whiteSpace: 'nowrap' }}>{formatRelativeTime(job.created_at)}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/jobs/results?id=${job.id}`)}
                              className="p-1.5 rounded-md transition-colors"
                              title="View"
                              style={{ color: text }}
                              onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </OLCard>
        </div>

        <div>
          <OLCard padding="0" style={{ height: 'fit-content' }}>
            <div className="p-5" style={{ borderBottom: `1px solid ${border}` }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Recent activity</div>
              <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>From GET /dashboard/recent-activities</div>
            </div>
            <div className="p-4 space-y-0">
              {activities.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: text }}>No audit activity in the last 7 days.</div>
              ) : (
                activities.map((item, i) => {
                  const t = activityType(item.action);
                  const iconMap = { success: CheckCircle2, info: Activity, warning: AlertTriangle, error: XCircle };
                  const colorMap = { success: '#10B981', info: '#3B82F6', warning: '#F59E0B', error: '#EF4444' };
                  const Icon = iconMap[t];
                  const color = colorMap[t];
                  const initials = (item.user_name || item.user_email || '?').slice(0, 2).toUpperCase();
                  return (
                    <div key={item.id} className="flex gap-3 relative">
                      {i < activities.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-px" style={{ background: border }} />}
                      <div className="flex items-center justify-center rounded-full flex-shrink-0 z-10" style={{ width: 28, height: 28, background: color + '18', border: `1px solid ${color}30`, marginTop: 10 }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <div className="flex-1 pb-4" style={{ paddingTop: 10 }}>
                        <div style={{ fontSize: '12px', color: textPrimary, lineHeight: 1.4 }}>{item.action} · {item.resource}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center justify-center rounded-full text-white" style={{ width: 16, height: 16, background: palette.secondary, fontSize: '8px', fontWeight: 700 }}>{initials}</div>
                          <span style={{ fontSize: '11px', color: text }}>{item.user_name || item.user_email || `User ${item.user_id}`}</span>
                          <span style={{ fontSize: '11px', color: text }}>·</span>
                          <span style={{ fontSize: '11px', color: text }}>{formatRelativeTime(item.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </OLCard>
        </div>
      </div>
    </div>
  );
}
