import React, { useState, useEffect } from 'react';
import {
  Server, Cpu, Database, Network, AlertTriangle,
  CheckCircle2, Activity, TrendingUp, TrendingDown, RefreshCw, Zap
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { motion } from 'motion/react';

const SA = {
  bg: '#060A0F', card: '#0D1520', cardAlt: '#0A1018', border: '#162032',
  text: '#64748B', textPrimary: '#E2E8F0', textMuted: '#475569',
  cyan: '#06B6D4', blue: '#3B82F6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

const pts = 30;
const t = (base: number, v: number) =>
  Array.from({ length: pts }, (_, i) => ({
    t: `${i}m`,
    v: Math.max(0, base + Math.sin(i * 0.5) * v + (Math.random() - 0.5) * v * 0.5),
  }));

const API_RPM = t(840, 140);
const ERROR_RATE = t(1.2, 0.5);
const WORKER_UTIL = t(62, 18);
const JOB_QUEUE = t(14, 8);
const DB_LATENCY = t(38, 12);
const CACHE_HIT = t(94.7, 3);

const HEATMAP_DATA = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d],
    hour: h,
    value: Math.round(Math.random() * 100),
  }))
).flat();

const STATUS_ITEMS = [
  { label: 'API Gateway', status: 'ok', latency: '12ms', uptime: '99.98%', icon: Network },
  { label: 'Optimization Engine', status: 'ok', latency: '142ms', uptime: '99.91%', icon: Cpu },
  { label: 'Database (Primary)', status: 'ok', latency: '38ms', uptime: '100%', icon: Database },
  { label: 'Worker Pool', status: 'warn', latency: '—', uptime: '99.7%', icon: Server },
  { label: 'Cache Layer', status: 'ok', latency: '2ms', uptime: '100%', icon: Zap },
  { label: 'Message Queue', status: 'ok', latency: '8ms', uptime: '99.99%', icon: Activity },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: SA.card, border: `1px solid ${SA.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: SA.textPrimary }}>
        {payload[0]?.value?.toFixed(2)}
      </div>
    );
  }
  return null;
};

const CHARTS = [
  { label: 'API Requests / min', data: API_RPM, color: SA.cyan, gradId: 'g1', unit: 'rpm' },
  { label: 'Error Rate %', data: ERROR_RATE, color: SA.red, gradId: 'g2', unit: '%' },
  { label: 'Worker Utilization %', data: WORKER_UTIL, color: SA.amber, gradId: 'g3', unit: '%' },
  { label: 'Job Queue Length', data: JOB_QUEUE, color: SA.purple, gradId: 'g4', unit: '' },
  { label: 'DB Query Latency (ms)', data: DB_LATENCY, color: SA.blue, gradId: 'g5', unit: 'ms' },
  { label: 'Cache Hit Rate %', data: CACHE_HIT, color: SA.green, gradId: 'g6', unit: '%' },
];

export function SystemMonitoring() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(v => v + 1), 5000);
    return () => clearInterval(i);
  }, []);

  const heatIntensity = (v: number) => {
    if (v < 20) return SA.cardAlt;
    if (v < 40) return '#0C2A1C';
    if (v < 60) return '#10B98130';
    if (v < 80) return '#10B98175';
    return SA.green;
  };

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
            System Monitoring
          </h1>
          <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>Infrastructure & performance metrics — last 30 minutes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: SA.green }} />
            <span style={{ fontSize: 12, color: SA.green, fontWeight: 600 }}>All Systems Operational</span>
          </div>
          <button className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: SA.card, border: `1px solid ${SA.border}`, color: SA.text, fontSize: 12, cursor: 'pointer' }}>
            <RefreshCw size={12} /> Auto-refresh: 5s
          </button>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_ITEMS.map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3"
            style={{ background: SA.card, border: `1px solid ${item.status === 'warn' ? SA.amber + '40' : SA.border}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <item.icon size={13} style={{ color: item.status === 'ok' ? SA.cyan : SA.amber }} />
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: item.status === 'ok' ? SA.green : SA.amber, boxShadow: `0 0 5px ${item.status === 'ok' ? SA.green : SA.amber}` }}
              />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: SA.textPrimary, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 10, color: SA.text }}>Latency: {item.latency}</div>
            <div style={{ fontSize: 10, color: item.status === 'ok' ? SA.green : SA.amber, fontWeight: 500 }}>{item.uptime} uptime</div>
          </motion.div>
        ))}
      </div>

      {/* Metric Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CHARTS.map(chart => (
          <div key={chart.label} className="rounded-xl p-4" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 12, fontWeight: 600, color: SA.textPrimary }}>{chart.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: chart.color }}>
                {chart.data[chart.data.length - 1].v.toFixed(1)}{chart.unit}
              </div>
            </div>
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data}>
                  <defs>
                    <linearGradient id={`sm-${chart.gradId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop key={`sm-${chart.gradId}-5`} offset="5%" stopColor={chart.color} stopOpacity={0.25} />
                      <stop key={`sm-${chart.gradId}-95`} offset="95%" stopColor={chart.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={SA.border} />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: SA.text }} interval={9} />
                  <YAxis tick={{ fontSize: 9, fill: SA.text }} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area name={`sm-${chart.gradId}`} type="monotone" dataKey="v" stroke={chart.color} strokeWidth={1.5} fill={`url(#sm-${chart.gradId})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Heatmap */}
      <div className="rounded-xl p-5" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: SA.textPrimary }}>Job Activity Heatmap</div>
            <div style={{ fontSize: 12, color: SA.text, marginTop: 2 }}>Optimization jobs by hour / day of week</div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 11, color: SA.text }}>Low</span>
            {[0, 25, 50, 75, 100].map(v => (
              <div key={v} className="h-3 w-5 rounded-sm" style={{ background: heatIntensity(v) }} />
            ))}
            <span style={{ fontSize: 11, color: SA.text }}>High</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: 2, minWidth: 600 }}>
            {/* Hour headers */}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ fontSize: 8, color: SA.text, textAlign: 'center', paddingBottom: 2 }}>{h}</div>
            ))}
            {/* Rows */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <React.Fragment key={day}>
                <div style={{ fontSize: 9, color: SA.text, display: 'flex', alignItems: 'center', paddingRight: 6 }}>{day}</div>
                {HEATMAP_DATA.filter(d => d.day === day).map(cell => (
                  <div
                    key={`${cell.day}-${cell.hour}`}
                    className="rounded-sm"
                    style={{ height: 16, background: heatIntensity(cell.value), border: `1px solid ${SA.border}30` }}
                    title={`${cell.day} ${cell.hour}:00 — ${cell.value}%`}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${SA.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>Recent Incidents</span>
        </div>
        {[
          { id: 'INC-014', title: 'Worker pool capacity warning', severity: 'warn', time: '14 min ago', resolved: false, detail: 'Worker utilization exceeded 85% threshold for 3 consecutive minutes' },
          { id: 'INC-013', title: 'API latency spike on /optimize', severity: 'warn', time: '2h ago', resolved: true, detail: 'P99 latency spiked to 1.2s, auto-scaled resolved within 4 minutes' },
          { id: 'INC-012', title: 'Database replication lag', severity: 'critical', time: '6h ago', resolved: true, detail: 'Replica was 45s behind primary, resolved via connection pool restart' },
        ].map(inc => (
          <div key={inc.id} className="flex items-start gap-4 px-4 py-3" style={{ borderBottom: `1px solid ${SA.border}20` }}>
            <div className="rounded flex items-center justify-center mt-0.5" style={{ width: 28, height: 28, background: (inc.severity === 'critical' ? SA.red : SA.amber) + '20', flexShrink: 0 }}>
              <AlertTriangle size={13} style={{ color: inc.severity === 'critical' ? SA.red : SA.amber }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{inc.title}</span>
                {inc.resolved
                  ? <span className="rounded-full px-2 py-0.5" style={{ fontSize: 10, background: SA.green + '18', color: SA.green }}>Resolved</span>
                  : <span className="rounded-full px-2 py-0.5" style={{ fontSize: 10, background: SA.amber + '18', color: SA.amber }}>Active</span>}
              </div>
              <div style={{ fontSize: 12, color: SA.text, marginTop: 2 }}>{inc.detail}</div>
              <div style={{ fontSize: 11, color: SA.textMuted, marginTop: 2 }}>{inc.id} · {inc.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}