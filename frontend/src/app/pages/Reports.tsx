import React, { useState, useEffect } from 'react';
import { Download, Filter, BarChart3, TrendingUp, Package, Truck } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard, OLCardHeader } from '../components/ui/OLCard';
import { OLButton } from '../components/ui/OLButton';
import { fetchReportSummary, fetchReportUtilization, fetchReportPerformance, type Period } from '../services/domainApi';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export function Reports() {
  const { isDark, palette } = useTheme();
  const [period, setPeriod] = useState<Period>('6M');
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchReportSummary>> | null>(null);
  const [util, setUtil] = useState<Awaited<ReturnType<typeof fetchReportUtilization>> | null>(null);
  const [perf, setPerf] = useState<Awaited<ReturnType<typeof fetchReportPerformance>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const gridColor = isDark ? '#1E2A38' : '#F1F5F9';

  const tooltipStyle = {
    contentStyle: { background: isDark ? '#1E2A38' : '#fff', border: `1px solid ${border}`, borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' },
    labelStyle: { color: textPrimary },
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, u, p] = await Promise.all([
          fetchReportSummary(period),
          fetchReportUtilization(period),
          fetchReportPerformance(period),
        ]);
        if (!cancelled) {
          setSummary(s);
          setUtil(u);
          setPerf(p);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reports');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const monthly = (perf?.series ?? []).map(x => ({
    month: x.month,
    jobs: x.jobs,
    efficiency: (x.avg_efficiency ?? 0) * 100,
  }));

  const vehicleBars = (util?.items ?? []).map((x, i) => ({
    name: `V-${x.vehicle_id}`,
    value: Math.round((x.avg_efficiency ?? 0) * 100),
    color: COLORS[i % COLORS.length],
  }));

  const topMonths = [...(perf?.series ?? [])]
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 5)
    .map(x => ({
      route: `Month ${x.month}`,
      jobs: x.jobs,
      efficiency: ((x.avg_efficiency ?? 0) * 100).toFixed(1),
    }));

  const effPct = ((summary?.avg_efficiency ?? 0) * 100).toFixed(1);

  if (loading && !summary) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: border }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <OLCard padding="24px">
          <OLCardHeader title="Reports" subtitle={error} />
        </OLCard>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: isDark ? '#0D1117' : '#E2E8F0' }}>
          {(['1M', '3M', '6M', '1Y'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-md transition-colors"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                background: period === p ? (isDark ? '#1E2A38' : '#fff') : 'transparent',
                color: period === p ? textPrimary : text,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Avg. efficiency', value: `${effPct}%`, trend: period, icon: BarChart3, color: '#3B82F6' },
          { label: 'Optimization runs', value: String(summary?.total_optimizations ?? 0), trend: 'period', icon: Package, color: '#10B981' },
          { label: 'Fleet size', value: String(summary?.fleet_size ?? 0), trend: 'vehicles', icon: Truck, color: '#F59E0B' },
          { label: 'Cost estimate (USD)', value: `$${(summary?.cost_savings_estimate_usd ?? 0).toLocaleString()}`, trend: 'heuristic', icon: TrendingUp, color: '#8B5CF6' },
        ].map(({ label, value, trend, icon: Icon, color }) => (
          <OLCard key={label} padding="16px">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: color + '18' }}>
                <Icon size={15} style={{ color }} />
              </div>
              <span style={{ fontSize: '11px', color: text }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: textPrimary }}>{value}</div>
            <div style={{ fontSize: '11px', color: text, marginTop: 2 }}>GET /reports/summary · {trend}</div>
          </OLCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <OLCard padding="20px">
          <OLCardHeader title="Efficiency trend" subtitle="GET /reports/performance" />
          <div style={{ height: 200 }}>
            {monthly.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: text }}>
                No data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Efficiency']} />
                  <Area type="monotone" dataKey="efficiency" stroke={palette.primary} strokeWidth={2} fill="url(#effGrad)" dot={{ r: 3, fill: palette.primary }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </OLCard>

        <OLCard padding="20px">
          <OLCardHeader title="Jobs volume" subtitle="GET /reports/performance" />
          <div style={{ height: 200 }}>
            {monthly.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: text }}>
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barSize={28}>
                  <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Jobs']} />
                  <Bar dataKey="jobs" fill={palette.primary} radius={[4, 4, 0, 0]}>
                    {monthly.map((_, i) => (
                      <Cell key={`jobs-cell-${i}`} fill={i === monthly.length - 1 ? palette.accent : palette.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </OLCard>

        <OLCard padding="20px">
          <OLCardHeader title="Per-vehicle utilization" subtitle="GET /reports/utilization" />
          <div className="space-y-3 mt-2">
            {vehicleBars.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: text }}>
                No runs in period
              </div>
            ) : (
              vehicleBars.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: '12px', color: textPrimary }}>{name}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color }}>{value}%</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 6, background: isDark ? '#1E2A38' : '#E2E8F0' }}>
                    <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </OLCard>

        <OLCard padding="20px">
          <OLCardHeader title="Top months by volume" subtitle="Derived from performance series" />
          <div className="space-y-1">
            {topMonths.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: text }}>
                No data
              </div>
            ) : (
              topMonths.map((r, i) => (
                <div key={r.route} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < topMonths.length - 1 ? `1px solid ${border}` : 'none' }}>
                  <div className="flex items-center justify-center rounded-md" style={{ width: 24, height: 24, background: isDark ? '#1E2A38' : '#F1F5F9', fontSize: '11px', fontWeight: 700, color: text }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: '12px', fontWeight: 500, color: textPrimary }}>{r.route}</div>
                    <div style={{ fontSize: '11px', color: text }}>{r.jobs} jobs</div>
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#10B981', fontWeight: 600 }}>{r.efficiency}%</div>
                </div>
              ))
            )}
          </div>
        </OLCard>
      </div>
    </div>
  );
}
