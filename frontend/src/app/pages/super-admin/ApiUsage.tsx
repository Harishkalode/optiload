import React, { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Download, Building2, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const SA = {
  bg: '#060A0F', card: '#0D1520', cardAlt: '#0A1018', border: '#162032',
  text: '#64748B', textPrimary: '#E2E8F0', textMuted: '#475569',
  cyan: '#06B6D4', blue: '#3B82F6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  total: Math.round(1200 + Math.sin(h * 0.5) * 600 + Math.random() * 200),
  errors: Math.round(Math.random() * 15),
  optimize: Math.round(400 + Math.sin(h * 0.5) * 200 + Math.random() * 80),
  loads: Math.round(300 + Math.random() * 100),
  vehicles: Math.round(200 + Math.random() * 80),
}));

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
  day: d,
  calls: Math.round(18000 + Math.sin(i * 1.2) * 5000 + Math.random() * 2000),
  errors: Math.round(100 + Math.random() * 80),
}));

const ORG_USAGE = [
  { org: 'National Rail Authority', calls: 91000, limit: 120000, pct: 75.8, plan: 'Enterprise' },
  { org: 'FreightCo Global', calls: 72400, limit: 120000, pct: 60.3, plan: 'Enterprise' },
  { org: 'RailCorp Inc.', calls: 48200, limit: 120000, pct: 40.2, plan: 'Enterprise' },
  { org: 'Pacific Rail Systems', calls: 31500, limit: 40000, pct: 78.8, plan: 'Professional' },
  { org: 'LogiTrans Partners', calls: 18600, limit: 40000, pct: 46.5, plan: 'Professional' },
  { org: 'MidWest Rail', calls: 2100, limit: 5000, pct: 42.0, plan: 'Starter' },
  { org: 'Alpine Freight', calls: 900, limit: 5000, pct: 18.0, plan: 'Starter' },
  { org: 'Coastal Logistics', calls: 0, limit: 40000, pct: 0, plan: 'Professional' },
];

const PLAN_COLORS: Record<string, string> = {
  Enterprise: SA.purple,
  Professional: SA.blue,
  Starter: SA.amber,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: SA.card, border: `1px solid ${SA.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, color: SA.textPrimary }}>
        <div style={{ marginBottom: 4, color: SA.text }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</div>
        ))}
      </div>
    );
  }
  return null;
};

export function ApiUsage() {
  const [period, setPeriod] = useState<'24h' | '7d'>('24h');

  const totalCalls = ORG_USAGE.reduce((s, o) => s + o.calls, 0);
  const totalErrors = Math.round(totalCalls * 0.012);

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
            API Usage
          </h1>
          <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>Platform-wide API consumption and quota tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${SA.border}` }}>
            {(['24h', '7d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-1.5 transition-all"
                style={{ fontSize: 12, fontWeight: 500, background: period === p ? SA.cyan + '20' : 'transparent', color: period === p ? SA.cyan : SA.text, border: 'none', cursor: 'pointer' }}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: SA.cyan + '15', border: `1px solid ${SA.cyan}30`, color: SA.cyan, fontSize: 12, cursor: 'pointer' }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total API Calls', value: totalCalls.toLocaleString(), sub: 'Today', icon: Zap, color: SA.cyan },
          { label: 'Error Rate', value: '1.2%', sub: `${totalErrors.toLocaleString()} errors`, icon: AlertTriangle, color: SA.red },
          { label: 'Peak RPM', value: '1,842', sub: 'at 14:00 UTC', icon: TrendingUp, color: SA.amber },
          { label: 'Avg Response', value: '142ms', sub: 'P50 across all orgs', icon: TrendingDown, color: SA.green },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon size={14} style={{ color: kpi.color }} />
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: SA.text, marginTop: 2 }}>{kpi.label}</div>
            <div style={{ fontSize: 10, color: kpi.color, marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl p-4" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary, marginBottom: 12 }}>
            API Calls by Hour (Today)
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURS}>
                <defs>
                  <linearGradient id="au-areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop key="au-areaGrad-5" offset="5%" stopColor={SA.cyan} stopOpacity={0.25} />
                    <stop key="au-areaGrad-95" offset="95%" stopColor={SA.cyan} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="au-errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop key="au-errGrad-5" offset="5%" stopColor={SA.red} stopOpacity={0.3} />
                    <stop key="au-errGrad-95" offset="95%" stopColor={SA.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke={SA.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: SA.text }} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: SA.text }} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total" stroke={SA.cyan} strokeWidth={1.5} fill="url(#au-areaGrad)" dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="errors" name="Errors" stroke={SA.red} strokeWidth={1} fill="url(#au-errGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary, marginBottom: 12 }}>
            Calls by Endpoint Type
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURS.filter((_, i) => i % 4 === 0)}>
                <CartesianGrid strokeDasharray="2 4" stroke={SA.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: SA.text }} />
                <YAxis tick={{ fontSize: 9, fill: SA.text }} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: SA.text }} />
                <Bar dataKey="optimize" name="/optimize" fill={SA.purple} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="loads" name="/loads" fill={SA.blue} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="vehicles" name="/vehicles" fill={SA.cyan} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-org quota table */}
      <div className="rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${SA.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>Organization Quota Usage</span>
          <span style={{ fontSize: 11, color: SA.text }}>This billing period</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${SA.border}` }}>
              {['Organization', 'Plan', 'API Calls', 'Quota', 'Usage', ''].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SA.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORG_USAGE.map((o, i) => {
              const color = o.pct > 85 ? SA.red : o.pct > 65 ? SA.amber : SA.green;
              return (
                <tr key={o.org} style={{ borderBottom: i < ORG_USAGE.length - 1 ? `1px solid ${SA.border}25` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = SA.cardAlt)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2">
                      <Building2 size={13} style={{ color: SA.text }} />
                      <span style={{ fontSize: 13, color: SA.textPrimary }}>{o.org}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="rounded px-2 py-0.5" style={{ fontSize: 10, fontWeight: 600, background: PLAN_COLORS[o.plan] + '18', color: PLAN_COLORS[o.plan] }}>{o.plan}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{o.calls.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: SA.text }}>{o.limit.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', width: 180 }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: SA.border }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${o.pct}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color, width: 36, textAlign: 'right' }}>{o.pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {o.pct > 75 && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={11} style={{ color: o.pct > 85 ? SA.red : SA.amber }} />
                        <span style={{ fontSize: 10, color: o.pct > 85 ? SA.red : SA.amber }}>
                          {o.pct > 85 ? 'Near limit' : 'High usage'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}