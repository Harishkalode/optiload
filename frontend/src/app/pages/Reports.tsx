import React, { useState } from 'react';
import { Download, Filter, Calendar, BarChart3, TrendingUp, Package, Truck } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard, OLCardHeader } from '../components/ui/OLCard';
import { OLButton } from '../components/ui/OLButton';

const MONTHLY = [
  { month: 'Sep', jobs: 42, efficiency: 82.4, cost: 98 },
  { month: 'Oct', jobs: 56, efficiency: 85.1, cost: 112 },
  { month: 'Nov', jobs: 61, efficiency: 86.8, cost: 108 },
  { month: 'Dec', jobs: 48, efficiency: 84.3, cost: 95 },
  { month: 'Jan', jobs: 73, efficiency: 88.9, cost: 134 },
  { month: 'Feb', jobs: 89, efficiency: 91.2, cost: 142 },
];

const VEHICLE_UTIL = [
  { name: 'Flatcar', value: 94, color: '#3B82F6' },
  { name: 'Boxcar', value: 87, color: '#10B981' },
  { name: 'Container', value: 79, color: '#F59E0B' },
  { name: 'Hopper', value: 91, color: '#8B5CF6' },
  { name: 'Gondola', value: 83, color: '#EC4899' },
];

const TOP_ROUTES = [
  { route: 'Chicago → Denver', jobs: 28, efficiency: 93.4 },
  { route: 'LA → Dallas', jobs: 22, efficiency: 91.1 },
  { route: 'NYC → Miami', jobs: 19, efficiency: 88.7 },
  { route: 'Seattle → Phoenix', jobs: 15, efficiency: 86.2 },
  { route: 'Atlanta → Boston', jobs: 11, efficiency: 84.9 },
];

export function Reports() {
  const { isDark, palette } = useTheme();
  const [period, setPeriod] = useState('6M');

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const gridColor = isDark ? '#1E2A38' : '#F1F5F9';

  const tooltipStyle = {
    contentStyle: { background: isDark ? '#1E2A38' : '#fff', border: `1px solid ${border}`, borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' },
    labelStyle: { color: textPrimary },
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: isDark ? '#0D1117' : '#E2E8F0' }}>
          {['1M', '3M', '6M', '1Y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 rounded-md transition-colors"
              style={{ fontSize: '12px', fontWeight: 500, background: period === p ? (isDark ? '#1E2A38' : '#fff') : 'transparent', color: period === p ? textPrimary : text }}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <OLButton variant="ghost" size="sm" icon={<Filter size={14} />}>Filter</OLButton>
          <OLButton variant="primary" size="sm" icon={<Download size={14} />}>Export Report</OLButton>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Efficiency', value: '88.1%', trend: '+5.4%', icon: BarChart3, color: '#3B82F6' },
          { label: 'Total Jobs', value: '369', trend: '+12%', icon: Package, color: '#10B981' },
          { label: 'Fleet Uptime', value: '96.3%', trend: '+1.2%', icon: Truck, color: '#F59E0B' },
          { label: 'Cost Savings', value: '$689K', trend: '+18%', icon: TrendingUp, color: '#8B5CF6' },
        ].map(({ label, value, trend, icon: Icon, color }) => (
          <OLCard key={label} padding="16px">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: color + '18' }}>
                <Icon size={15} style={{ color }} />
              </div>
              <span style={{ fontSize: '11px', color: text }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: textPrimary }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: 2 }}>↑ {trend} vs prev period</div>
          </OLCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Efficiency Trend */}
        <OLCard padding="20px">
          <OLCardHeader title="Load Efficiency Trend" subtitle="Monthly average %" />
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY}>
                <defs>
                  <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop key="effGrad-stop-0" offset="0%" stopColor={palette.primary} stopOpacity={0.3} />
                    <stop key="effGrad-stop-1" offset="100%" stopColor={palette.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} domain={[75, 95]} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, 'Efficiency']} />
                <Area type="monotone" dataKey="efficiency" stroke={palette.primary} strokeWidth={2} fill="url(#effGrad)" dot={{ r: 3, fill: palette.primary }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </OLCard>

        {/* Jobs Volume */}
        <OLCard padding="20px">
          <OLCardHeader title="Optimization Jobs Volume" subtitle="Jobs completed per month" />
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY} barSize={28}>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: text }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Jobs']} />
                <Bar dataKey="jobs" fill={palette.primary} radius={[4, 4, 0, 0]}>
                  {MONTHLY.map((_, i) => (
                    <Cell key={`jobs-cell-${i}`} fill={i === MONTHLY.length - 1 ? palette.accent : palette.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OLCard>

        {/* Vehicle Utilization */}
        <OLCard padding="20px">
          <OLCardHeader title="Vehicle Type Utilization" subtitle="Average utilization by vehicle type" />
          <div className="space-y-3 mt-2">
            {VEHICLE_UTIL.map(({ name, value, color }) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: '12px', color: textPrimary }}>{name}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color }}>{value}%</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 6, background: isDark ? '#1E2A38' : '#E2E8F0' }}>
                  <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </OLCard>

        {/* Top Routes */}
        <OLCard padding="20px">
          <OLCardHeader title="Top Performing Routes" subtitle="By job volume" />
          <div className="space-y-1">
            {TOP_ROUTES.map((r, i) => (
              <div key={r.route} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < TOP_ROUTES.length - 1 ? `1px solid ${border}` : 'none' }}>
                <div className="flex items-center justify-center rounded-md" style={{ width: 24, height: 24, background: isDark ? '#1E2A38' : '#F1F5F9', fontSize: '11px', fontWeight: 700, color: text }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: '12px', fontWeight: 500, color: textPrimary }}>{r.route}</div>
                  <div style={{ fontSize: '11px', color: text }}>{r.jobs} jobs</div>
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#10B981', fontWeight: 600 }}>{r.efficiency}%</div>
              </div>
            ))}
          </div>
        </OLCard>
      </div>
    </div>
  );
}