import React from 'react';
import { Activity, Users, Zap, AlertTriangle, TrendingUp, Server, Database, Cpu, HardDrive, Network } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ACTIVITY_DATA = [
  { time: '00:00', users: 45, jobs: 12, api: 234 },
  { time: '04:00', users: 32, jobs: 8, api: 189 },
  { time: '08:00', users: 124, jobs: 45, api: 567 },
  { time: '12:00', users: 189, jobs: 67, api: 892 },
  { time: '16:00', users: 156, jobs: 52, api: 734 },
  { time: '20:00', users: 98, jobs: 28, api: 445 },
];

const ERROR_DATA = [
  { category: '4xx Errors', count: 124 },
  { category: '5xx Errors', count: 8 },
  { category: 'Timeouts', count: 3 },
  { category: 'Rate Limits', count: 47 },
];

const PERFORMANCE_DATA = [
  { endpoint: '/api/optimize', avg: 234, p95: 456, p99: 678 },
  { endpoint: '/api/loads', avg: 45, p95: 89, p99: 145 },
  { endpoint: '/api/vehicles', avg: 32, p95: 67, p99: 98 },
];

export function MonitoringDashboard() {
  const { isDark, palette } = useTheme();

  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#161D2A' : '#F8FAFC';

  const StatCard = ({ icon: Icon, label, value, change, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border"
      style={{ background: cardBg, borderColor: border }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, background: color + '15' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {change && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: change > 0 ? '#10B98115' : '#EF444415', fontSize: 11, fontWeight: 600, color: change > 0 ? '#10B981' : '#EF4444' }}>
            <TrendingUp size={10} style={{ transform: change < 0 ? 'rotate(180deg)' : 'none' }} />
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: textPrimary }}>{value}</div>
    </motion.div>
  );

  const MetricCard = ({ label, value, status }: any) => {
    const statusColor = status === 'healthy' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444';
    return (
      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: bg }}>
        <div>
          <div style={{ fontSize: 12, color: text }}>{label}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginTop: 2 }}>{value}</div>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: bg }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <div>
          <div className="flex items-center gap-2">
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, fontFamily: 'Space Grotesk, sans-serif' }}>
              System Monitoring
            </h2>
            <div className="px-2 py-0.5 rounded text-xs" style={{ background: '#DC262615', color: '#DC2626', fontWeight: 600 }}>
              SUPER ADMIN ONLY
            </div>
          </div>
          <p style={{ fontSize: 12, color: text, marginTop: 2 }}>
            Real-time system health and performance metrics
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 py-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active Users"
            value="1,247"
            change={12.5}
            color={palette.primary}
          />
          <StatCard
            icon={Zap}
            label="Active Jobs"
            value="84"
            change={-3.2}
            color="#F59E0B"
          />
          <StatCard
            icon={Activity}
            label="API Requests/min"
            value="892"
            change={8.7}
            color="#10B981"
          />
          <StatCard
            icon={AlertTriangle}
            label="Error Rate"
            value="0.12%"
            change={-15.4}
            color="#EF4444"
          />
        </div>

        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-lg border"
          style={{ background: cardBg, borderColor: border }}
        >
          <div className="mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>System Activity (24h)</h3>
            <p style={{ fontSize: 12, color: text, marginTop: 2 }}>Users, jobs, and API requests over time</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ACTIVITY_DATA}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={palette.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={palette.primary} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis dataKey="time" stroke={text} style={{ fontSize: 11 }} />
              <YAxis stroke={text} style={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  fontSize: 12
                }}
              />
              <Area type="monotone" dataKey="users" stroke={palette.primary} fillOpacity={1} fill="url(#colorUsers)" />
              <Area type="monotone" dataKey="jobs" stroke="#F59E0B" fillOpacity={1} fill="url(#colorJobs)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-lg border"
            style={{ background: cardBg, borderColor: border }}
          >
            <div className="mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>Error Distribution</h3>
              <p style={{ fontSize: 12, color: text, marginTop: 2 }}>Breakdown of errors by type</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ERROR_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="category" stroke={text} style={{ fontSize: 11 }} />
                <YAxis stroke={text} style={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
                <Bar dataKey="count" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* System Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-lg border"
            style={{ background: cardBg, borderColor: border }}
          >
            <div className="mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>System Resources</h3>
              <p style={{ fontSize: 12, color: text, marginTop: 2 }}>Server health metrics</p>
            </div>
            <div className="space-y-3">
              <MetricCard label="CPU Usage" value="34.2%" status="healthy" />
              <MetricCard label="Memory Usage" value="58.7%" status="healthy" />
              <MetricCard label="Disk Usage" value="72.4%" status="warning" />
              <MetricCard label="Network I/O" value="245 MB/s" status="healthy" />
            </div>
          </motion.div>
        </div>

        {/* API Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-lg border"
          style={{ background: cardBg, borderColor: border }}
        >
          <div className="mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>API Endpoint Performance</h3>
            <p style={{ fontSize: 12, color: text, marginTop: 2 }}>Response time in milliseconds</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  <th className="text-left px-3 py-2" style={{ fontSize: 11, fontWeight: 600, color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endpoint</th>
                  <th className="text-right px-3 py-2" style={{ fontSize: 11, fontWeight: 600, color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg</th>
                  <th className="text-right px-3 py-2" style={{ fontSize: 11, fontWeight: 600, color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>P95</th>
                  <th className="text-right px-3 py-2" style={{ fontSize: 11, fontWeight: 600, color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>P99</th>
                </tr>
              </thead>
              <tbody>
                {PERFORMANCE_DATA.map((perf, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${border}` }}>
                    <td className="px-3 py-3">
                      <code style={{ fontSize: 12, color: palette.primary, fontFamily: 'monospace' }}>{perf.endpoint}</code>
                    </td>
                    <td className="text-right px-3 py-3" style={{ fontSize: 13, color: textPrimary }}>{perf.avg}ms</td>
                    <td className="text-right px-3 py-3" style={{ fontSize: 13, color: textPrimary }}>{perf.p95}ms</td>
                    <td className="text-right px-3 py-3" style={{ fontSize: 13, color: textPrimary }}>{perf.p99}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Worker Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-lg border"
          style={{ background: cardBg, borderColor: border }}
        >
          <div className="mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>Optimization Workers</h3>
            <p style={{ fontSize: 12, color: text, marginTop: 2 }}>Background job processing status</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg" style={{ background: bg }}>
              <div className="flex items-center gap-3 mb-2">
                <Server size={16} style={{ color: palette.primary }} />
                <span style={{ fontSize: 12, color: text }}>Worker 1</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary }}>Active</div>
              <div style={{ fontSize: 11, color: text, marginTop: 2 }}>Processing: OPT-92</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: bg }}>
              <div className="flex items-center gap-3 mb-2">
                <Server size={16} style={{ color: palette.primary }} />
                <span style={{ fontSize: 12, color: text }}>Worker 2</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary }}>Active</div>
              <div style={{ fontSize: 11, color: text, marginTop: 2 }}>Processing: OPT-93</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: bg }}>
              <div className="flex items-center gap-3 mb-2">
                <Server size={16} style={{ color: '#64748B' }} />
                <span style={{ fontSize: 12, color: text }}>Worker 3</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: text }}>Idle</div>
              <div style={{ fontSize: 11, color: text, marginTop: 2 }}>Last: 2m ago</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: bg }}>
              <div className="flex items-center gap-3 mb-2">
                <Server size={16} style={{ color: '#64748B' }} />
                <span style={{ fontSize: 12, color: text }}>Worker 4</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: text }}>Idle</div>
              <div style={{ fontSize: 11, color: text, marginTop: 2 }}>Last: 5m ago</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
