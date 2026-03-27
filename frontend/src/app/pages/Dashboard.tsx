import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, TrendingDown, Briefcase, Truck, Package,
  DollarSign, AlertTriangle, Warehouse, Eye, Copy,
  Download, Trash2, MoreHorizontal, Plus, RefreshCw, CheckCircle2,
  Clock, XCircle, Activity
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard, OLCardHeader } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import { OLModal } from '../components/ui/OLModal';
import { toast } from 'sonner';

const sparkData = (base: number, variance: number, count = 12) =>
  Array.from({ length: count }, (_, i) => ({ v: base + Math.sin(i * 0.8) * variance + Math.random() * variance * 0.5 }));

const KPI_CARDS = [
  { label: 'Active Jobs', value: '24', change: '+3', up: true, icon: Briefcase, color: '#3B82F6', data: sparkData(20, 4) },
  { label: 'Fleet Utilization', value: '87.4%', change: '+2.1%', up: true, icon: Truck, color: '#10B981', data: sparkData(85, 5) },
  { label: 'Load Efficiency', value: '91.2%', change: '+5.4%', up: true, icon: Package, color: '#8B5CF6', data: sparkData(88, 4) },
  { label: 'Cost Reduction', value: '$142K', change: '-8.3%', up: true, icon: DollarSign, color: '#F59E0B', data: sparkData(130, 15) },
  { label: 'Constraint Alerts', value: '7', change: '-3', up: false, icon: AlertTriangle, color: '#EF4444', data: sparkData(10, 3) },
  { label: 'Active Warehouses', value: '12', change: '+1', up: true, icon: Warehouse, color: '#06B6D4', data: sparkData(11, 1) },
];

const TIMELINE = [
  { id: 1, event: 'Job OPT-2891 completed successfully', user: 'Sarah K.', initials: 'SK', time: '2 min ago', type: 'success' },
  { id: 2, event: 'New vehicle V-047 added to fleet', user: 'John D.', initials: 'JD', time: '14 min ago', type: 'info' },
  { id: 3, event: 'Constraint violation on Job OPT-2889', user: 'System', initials: 'SY', time: '32 min ago', type: 'warning' },
  { id: 4, event: 'Job OPT-2890 started processing', user: 'Mark T.', initials: 'MT', time: '1h ago', type: 'info' },
  { id: 5, event: 'Export report generated for Q1', user: 'Lisa R.', initials: 'LR', time: '2h ago', type: 'success' },
  { id: 6, event: 'Job OPT-2888 failed: weight exceeded', user: 'System', initials: 'SY', time: '3h ago', type: 'error' },
];

const JOBS = [
  { id: 'OPT-2891', vehicles: 4, loads: 127, utilization: 91.2, status: 'completed', by: 'S. Kumar', date: 'Feb 19, 2026' },
  { id: 'OPT-2890', vehicles: 6, loads: 214, utilization: 87.5, status: 'processing', by: 'J. Doe', date: 'Feb 19, 2026' },
  { id: 'OPT-2889', vehicles: 3, loads: 98, utilization: 74.3, status: 'warning', by: 'M. Torres', date: 'Feb 18, 2026' },
  { id: 'OPT-2888', vehicles: 5, loads: 180, utilization: 0, status: 'failed', by: 'L. Roberts', date: 'Feb 18, 2026' },
  { id: 'OPT-2887', vehicles: 2, loads: 66, utilization: 95.1, status: 'completed', by: 'S. Kumar', date: 'Feb 17, 2026' },
  { id: 'OPT-2886', vehicles: 8, loads: 312, utilization: 88.9, status: 'completed', by: 'J. Doe', date: 'Feb 17, 2026' },
];

const STATUS_MAP: Record<string, { badge: any; label: string }> = {
  completed: { badge: 'success', label: 'Completed' },
  processing: { badge: 'info', label: 'Processing' },
  warning: { badge: 'warning', label: 'Warning' },
  failed: { badge: 'error', label: 'Failed' },
};

export function Dashboard() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [deleteJob, setDeleteJob] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const rowHover = isDark ? '#0D1117' : '#F8FAFC';

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(r => setTimeout(r, 1200));
    setDeleting(false);
    setDeleteJob(null);
    toast.success(`Job ${deleteJob} deleted successfully`);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {KPI_CARDS.map(({ label, value, change, up, icon: Icon, color, data }) => (
          <OLCard key={label} hover padding="16px">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: color + '18' }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 600, color: up ? '#16A34A' : '#DC2626' }}>
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {change}
              </div>
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
                      <stop key={`g-${label}-0`} offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop key={`g-${label}-100`} offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area name={`dash-${label}`} type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#g-${label})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </OLCard>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Jobs Table */}
        <div className="xl:col-span-2">
          <OLCard padding="0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-3 sm:gap-0" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Recent Optimization Jobs</div>
                <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>Last 30 jobs across all depots</div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <OLButton variant="ghost" size="sm" icon={<RefreshCw size={14} />} className="flex-1 sm:flex-none">Refresh</OLButton>
                <OLButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/jobs/new')} className="flex-1 sm:flex-none">New Job</OLButton>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {['Job ID', 'Vehicles', 'Loads', 'Utilization', 'Status', 'Created By', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JOBS.map(job => (
                    <tr
                      key={job.id}
                      style={{ borderBottom: `1px solid ${border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      className="transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent, fontWeight: 500 }}>{job.id}</span>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary }}>{job.vehicles}</td>
                      <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary }}>{job.loads}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full overflow-hidden" style={{ width: 48, height: 4, background: isDark ? '#1E2A38' : '#E2E8F0' }}>
                            <div style={{ width: `${job.utilization}%`, height: '100%', background: job.utilization > 85 ? '#10B981' : job.utilization > 60 ? '#F59E0B' : '#EF4444', borderRadius: 9999 }} />
                          </div>
                          <span style={{ fontSize: '12px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{job.utilization.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <OLBadge status={STATUS_MAP[job.status].badge as any} label={STATUS_MAP[job.status].label} />
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '12px', color: text }}>{job.by}</td>
                      <td className="px-4 py-3" style={{ fontSize: '12px', color: text, whiteSpace: 'nowrap' }}>{job.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate('/jobs/results')} className="p-1.5 rounded-md transition-colors" title="View" style={{ color: text }} onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><Eye size={14} /></button>
                          <button className="p-1.5 rounded-md transition-colors" title="Duplicate" style={{ color: text }} onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><Copy size={14} /></button>
                          <button className="p-1.5 rounded-md transition-colors" title="Download" style={{ color: text }} onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><Download size={14} /></button>
                          <button onClick={() => setDeleteJob(job.id)} className="p-1.5 rounded-md transition-colors" title="Delete" style={{ color: '#EF4444' }} onMouseEnter={e => (e.currentTarget.style.background = '#EF444415')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </OLCard>
        </div>

        {/* Activity Timeline */}
        <div>
          <OLCard padding="0" style={{ height: 'fit-content' }}>
            <div className="p-5" style={{ borderBottom: `1px solid ${border}` }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Activity Timeline</div>
              <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>Live system events</div>
            </div>
            <div className="p-4 space-y-0">
              {TIMELINE.map((item, i) => {
                const iconMap = { success: CheckCircle2, info: Activity, warning: AlertTriangle, error: XCircle };
                const colorMap = { success: '#10B981', info: '#3B82F6', warning: '#F59E0B', error: '#EF4444' };
                const Icon = iconMap[item.type as keyof typeof iconMap];
                const color = colorMap[item.type as keyof typeof colorMap];
                return (
                  <div key={item.id} className="flex gap-3 relative">
                    {i < TIMELINE.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px" style={{ background: border }} />
                    )}
                    <div className="flex items-center justify-center rounded-full flex-shrink-0 z-10" style={{ width: 28, height: 28, background: color + '18', border: `1px solid ${color}30`, marginTop: 10 }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div className="flex-1 pb-4" style={{ paddingTop: 10 }}>
                      <div style={{ fontSize: '12px', color: textPrimary, lineHeight: 1.4 }}>{item.event}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center justify-center rounded-full text-white" style={{ width: 16, height: 16, background: palette.secondary, fontSize: '8px', fontWeight: 700 }}>{item.initials}</div>
                        <span style={{ fontSize: '11px', color: text }}>{item.user}</span>
                        <span style={{ fontSize: '11px', color: text }}>·</span>
                        <span style={{ fontSize: '11px', color: text }}>{item.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </OLCard>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <OLModal
        open={!!deleteJob}
        onClose={() => setDeleteJob(null)}
        title="Delete Optimization Job"
        subtitle={`Job ${deleteJob} will be permanently deleted.`}
        danger
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setDeleteJob(null)}>Cancel</OLButton>,
          <OLButton key="delete" variant="danger" loading={deleting} onClick={handleDelete}>Delete Job</OLButton>
        ]}
      >
        <div style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.6 }}>
          <div className="flex items-start gap-3 p-4 rounded-lg mb-3" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
            <div>
              This action cannot be undone. All associated data including load placements, reports, and exported files will be permanently removed.
            </div>
          </div>
          <p>Are you sure you want to delete job <strong style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>{deleteJob}</strong>?</p>
        </div>
      </OLModal>
    </div>
  );
}