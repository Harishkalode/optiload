import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Cpu, AlertTriangle, TrendingUp,
  Activity, Server, CheckCircle2, XCircle, Clock,
  Zap, Database, Globe, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { motion } from 'motion/react';

const SA = {
  bg: '#060A0F',
  card: '#0D1520',
  cardAlt: '#0A1018',
  border: '#162032',
  text: '#64748B',
  textPrimary: '#E2E8F0',
  textMuted: '#475569',
  cyan: '#06B6D4',
  blue: '#3B82F6',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

const makeTimeSeries = (base: number, variance: number, pts = 20) =>
  Array.from({ length: pts }, (_, i) => ({
    t: `${i}m`,
    v: Math.max(0, base + Math.sin(i * 0.6) * variance + (Math.random() - 0.5) * variance * 0.4),
  }));

const API_DATA = makeTimeSeries(840, 120);
const ERROR_DATA = makeTimeSeries(1.2, 0.6);
const LOAD_DATA = makeTimeSeries(62, 18);
const QUEUE_DATA = makeTimeSeries(14, 8);

const KPI_CARDS = [
  { label: 'Total Organizations', value: '48', sub: '+3 this month', icon: Building2, color: SA.cyan, trend: makeTimeSeries(44, 4) },
  { label: 'Active Users', value: '1,247', sub: '94.2% online rate', icon: Users, color: SA.blue, trend: makeTimeSeries(1200, 60) },
  { label: 'Active Opt. Jobs', value: '73', sub: '12 queued', icon: Cpu, color: SA.purple, trend: makeTimeSeries(65, 15) },
  { label: 'System Load', value: '62%', sub: 'Nominal range', icon: Activity, color: SA.green, trend: LOAD_DATA },
  { label: 'Error Rate', value: '1.2%', sub: '↓ from 2.1%', icon: AlertTriangle, color: SA.amber, trend: ERROR_DATA },
];

const LIVE_FEED = [
  { id: 1, user: 'S. Mitchell', org: 'RailCorp Inc.', action: 'ran optimization job OPT-2941', time: '8s ago', type: 'job' },
  { id: 2, user: 'J. Chen', org: 'LogiTrans', action: 'created vehicle V-091', time: '23s ago', type: 'create' },
  { id: 3, user: 'A. Patel', org: 'FreightCo', action: 'exported compliance report', time: '1m ago', type: 'export' },
  { id: 4, user: 'System', org: 'Platform', action: 'worker pool auto-scaled to 8 instances', time: '2m ago', type: 'system' },
  { id: 5, user: 'R. Kim', org: 'MidWest Rail', action: 'uploaded bulk loads (312 items)', time: '4m ago', type: 'create' },
  { id: 6, user: 'E. Watson', org: 'RailCorp Inc.', action: 'modified role permissions for Rail Planner', time: '6m ago', type: 'security' },
  { id: 7, user: 'System', org: 'Platform', action: 'failed login attempt blocked (IP: 185.45.72.3)', time: '9m ago', type: 'security' },
  { id: 8, user: 'M. Torres', org: 'National Rail', action: 'exported 47 optimization results', time: '12m ago', type: 'export' },
];

const HEALTH_METRICS = [
  { label: 'API Response (avg)', value: '142ms', status: 'ok', target: '<200ms' },
  { label: 'Worker Utilization', value: '62%', status: 'ok', target: '<80%' },
  { label: 'Job Failure Rate', value: '1.2%', status: 'warn', target: '<1%' },
  { label: 'Queue Length', value: '14', status: 'ok', target: '<50' },
  { label: 'DB Query Time', value: '38ms', status: 'ok', target: '<100ms' },
  { label: 'Cache Hit Rate', value: '94.7%', status: 'ok', target: '>90%' },
];

const OPT_JOBS = [
  { id: 'OPT-2941', org: 'RailCorp Inc.', status: 'running', progress: 67, vehicles: 6, loads: 214 },
  { id: 'OPT-2940', org: 'LogiTrans', status: 'running', progress: 91, vehicles: 3, loads: 98 },
  { id: 'OPT-2939', org: 'FreightCo', status: 'completed', progress: 100, vehicles: 8, loads: 312 },
  { id: 'OPT-2938', org: 'MidWest Rail', status: 'failed', progress: 34, vehicles: 4, loads: 127 },
  { id: 'OPT-2937', org: 'National Rail', status: 'queued', progress: 0, vehicles: 5, loads: 180 },
  { id: 'OPT-2936', org: 'RailCorp Inc.', status: 'completed', progress: 100, vehicles: 2, loads: 66 },
];

const STATUS_DOT: Record<string, string> = {
  running: SA.blue,
  completed: SA.green,
  failed: SA.red,
  queued: SA.amber,
};

const FEED_COLORS: Record<string, string> = {
  job: SA.blue,
  create: SA.green,
  export: SA.purple,
  system: SA.cyan,
  security: SA.amber,
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: SA.card, border: `1px solid ${SA.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: SA.textPrimary }}>
        {payload[0]?.value?.toFixed(1)}
      </div>
    );
  }
  return null;
};

export function GlobalDashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
            Global Control Dashboard
          </h1>
          <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>
            Platform-wide visibility — all organizations, all systems
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: SA.green }} />
            <span style={{ fontSize: 12, color: SA.green, fontWeight: 600 }}>All Systems Operational</span>
          </div>
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
            style={{ background: SA.card, border: `1px solid ${SA.border}`, color: SA.text, fontSize: 12, cursor: 'pointer' }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {KPI_CARDS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-4"
            style={{ background: SA.card, border: `1px solid ${SA.border}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg p-1.5" style={{ background: kpi.color + '18' }}>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
              <div className="h-8 w-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.trend}>
                    <Line name={`spark-${kpi.label}`} type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: SA.text, marginTop: 2 }}>{kpi.label}</div>
            <div style={{ fontSize: 10, color: kpi.color, marginTop: 4, fontWeight: 500 }}>{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Live Activity Feed */}
        <div className="xl:col-span-1 rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${SA.border}` }}>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: SA.green }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>Live Activity Feed</span>
            </div>
            <span style={{ fontSize: 11, color: SA.text }}>Real-time</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {LIVE_FEED.map((item, i) => (
              <div
                key={item.id}
                className="flex gap-3 px-4 py-3 transition-all"
                style={{ borderBottom: `1px solid ${SA.border}20`, opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.1) }}
              >
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ width: 28, height: 28, background: FEED_COLORS[item.type] + '20', color: FEED_COLORS[item.type], fontSize: 10, fontWeight: 700 }}
                >
                  {item.user === 'System' ? <Globe size={12} /> : item.user.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: SA.textPrimary }}>
                    <span style={{ fontWeight: 600 }}>{item.user}</span>
                    {' '}<span style={{ color: SA.text }}>{item.action}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ fontSize: 10, color: FEED_COLORS[item.type] }}>{item.org}</span>
                    <span style={{ fontSize: 10, color: SA.textMuted }}>· {item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Panel */}
        <div className="xl:col-span-1 rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${SA.border}` }}>
            <div className="flex items-center gap-2">
              <Server size={14} style={{ color: SA.cyan }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>System Health</span>
            </div>
            <span style={{ fontSize: 11, color: SA.green, fontWeight: 600 }}>HEALTHY</span>
          </div>
          <div className="p-4 space-y-3">
            {HEALTH_METRICS.map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 12, color: SA.textPrimary }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: SA.text }}>Target: {m.target}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.status === 'ok' ? SA.green : SA.amber }}>{m.value}</span>
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: m.status === 'ok' ? SA.green : SA.amber, boxShadow: `0 0 4px ${m.status === 'ok' ? SA.green : SA.amber}` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* API chart */}
          <div className="px-4 pb-4">
            <div style={{ fontSize: 11, color: SA.text, marginBottom: 6 }}>API requests/min (last 20 min)</div>
            <div style={{ height: 70 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={API_DATA}>
                  <defs>
                    <linearGradient id="gd-apiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop key="gd-apiGrad-stop-0" offset="5%" stopColor={SA.cyan} stopOpacity={0.25} />
                      <stop key="gd-apiGrad-stop-1" offset="95%" stopColor={SA.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area name="gd-api" type="monotone" dataKey="v" stroke={SA.cyan} strokeWidth={1.5} fill="url(#gd-apiGrad)" dot={false} isAnimationActive={false} />
                  <Tooltip content={<CustomTooltip />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Optimization Activity Map */}
        <div className="xl:col-span-1 rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${SA.border}` }}>
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: SA.purple }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>Optimization Jobs</span>
            </div>
            <span style={{ fontSize: 11, color: SA.text }}>{OPT_JOBS.filter(j => j.status === 'running').length} running</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
            {OPT_JOBS.map(job => (
              <div key={job.id} className="px-4 py-3" style={{ borderBottom: `1px solid ${SA.border}20` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: STATUS_DOT[job.status], boxShadow: `0 0 5px ${STATUS_DOT[job.status]}` }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: SA.textPrimary }}>{job.id}</span>
                  </div>
                  <span style={{ fontSize: 10, color: STATUS_DOT[job.status], fontWeight: 600, textTransform: 'uppercase' }}>{job.status}</span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: 11, color: SA.text }}>{job.org} · {job.vehicles}V / {job.loads}L</span>
                  <span style={{ fontSize: 11, color: SA.textPrimary }}>{job.progress}%</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 3, background: SA.border }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${job.progress}%`, background: STATUS_DOT[job.status] }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Status legend */}
          <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: `1px solid ${SA.border}` }}>
            {Object.entries(STATUS_DOT).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                <span style={{ fontSize: 10, color: SA.text, textTransform: 'capitalize' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Rate + Load charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { label: 'Error Rate % (last 20 min)', data: ERROR_DATA, color: SA.red, gradId: 'gd-errGrad' },
          { label: 'Worker Utilization % (last 20 min)', data: LOAD_DATA, color: SA.amber, gradId: 'gd-loadGrad' },
        ].map(chart => (
          <div key={chart.label} className="rounded-xl p-4" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <div style={{ fontSize: 12, color: SA.text, marginBottom: 8 }}>{chart.label}</div>
            <div style={{ height: 90 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data}>
                  <defs>
                    <linearGradient id={chart.gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop key={`${chart.gradId}-stop-0`} offset="5%" stopColor={chart.color} stopOpacity={0.2} />
                      <stop key={`${chart.gradId}-stop-1`} offset="95%" stopColor={chart.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={SA.border} />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: SA.text }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: SA.text }} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area name={`gd-${chart.gradId}`} type="monotone" dataKey="v" stroke={chart.color} strokeWidth={1.5} fill={`url(#${chart.gradId})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}