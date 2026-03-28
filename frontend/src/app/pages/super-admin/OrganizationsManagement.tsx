import React, { useState } from 'react';
import {
  Building2, Search, Filter, MoreVertical, Users, Cpu,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Globe, TrendingUp, Package, X, Eye, Ban, Activity,
  Calendar, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SA = {
  bg: '#060A0F', card: '#0D1520', cardAlt: '#0A1018', border: '#162032',
  text: '#64748B', textPrimary: '#E2E8F0', textMuted: '#475569',
  cyan: '#06B6D4', blue: '#3B82F6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

interface Org {
  id: string;
  name: string;
  plan: 'Enterprise' | 'Professional' | 'Starter';
  users: number;
  activeJobs: number;
  status: 'active' | 'suspended' | 'trial';
  admin: string;
  created: string;
  storage: string;
  apiCalls: number;
  errorRate: number;
}

const ORGS: Org[] = [
  { id: 'ORG-001', name: 'RailCorp Inc.', plan: 'Enterprise', users: 247, activeJobs: 18, status: 'active', admin: 'Sarah Mitchell', created: 'Jan 2024', storage: '142 GB', apiCalls: 48200, errorRate: 0.8 },
  { id: 'ORG-002', name: 'LogiTrans Partners', plan: 'Professional', users: 89, activeJobs: 7, status: 'active', admin: 'James Chen', created: 'Mar 2024', storage: '56 GB', apiCalls: 18600, errorRate: 1.1 },
  { id: 'ORG-003', name: 'FreightCo Global', plan: 'Enterprise', users: 312, activeJobs: 24, status: 'active', admin: 'Ana Patel', created: 'Nov 2023', storage: '289 GB', apiCalls: 72400, errorRate: 0.6 },
  { id: 'ORG-004', name: 'MidWest Rail', plan: 'Starter', users: 24, activeJobs: 3, status: 'trial', admin: 'Robert Kim', created: 'Feb 2025', storage: '8 GB', apiCalls: 2100, errorRate: 2.4 },
  { id: 'ORG-005', name: 'National Rail Authority', plan: 'Enterprise', users: 418, activeJobs: 31, status: 'active', admin: 'Emily Watson', created: 'Sep 2023', storage: '421 GB', apiCalls: 91000, errorRate: 0.4 },
  { id: 'ORG-006', name: 'Coastal Logistics', plan: 'Professional', users: 67, activeJobs: 0, status: 'suspended', admin: 'Mark Torres', created: 'Jun 2024', storage: '31 GB', apiCalls: 0, errorRate: 0 },
  { id: 'ORG-007', name: 'Alpine Freight', plan: 'Starter', users: 18, activeJobs: 2, status: 'trial', admin: 'Lisa Anderson', created: 'Mar 2025', storage: '4 GB', apiCalls: 900, errorRate: 3.1 },
  { id: 'ORG-008', name: 'Pacific Rail Systems', plan: 'Professional', users: 134, activeJobs: 11, status: 'active', admin: 'David Park', created: 'Apr 2024', storage: '98 GB', apiCalls: 31500, errorRate: 1.3 },
];

const PLAN_COLORS: Record<string, string> = {
  Enterprise: SA.purple,
  Professional: SA.blue,
  Starter: SA.amber,
};

const STATUS_COLORS: Record<string, string> = {
  active: SA.green,
  suspended: SA.red,
  trial: SA.amber,
};

const ORG_USERS = [
  { name: 'Sarah Mitchell', email: 'sarah@railcorp.com', role: 'Organization Owner', lastLogin: '2h ago', status: 'active' },
  { name: 'James Chen', email: 'james@railcorp.com', role: 'Admin', lastLogin: '5h ago', status: 'active' },
  { name: 'Maria Rodriguez', email: 'maria@railcorp.com', role: 'Operations Manager', lastLogin: '1d ago', status: 'active' },
  { name: 'David Park', email: 'dpark@railcorp.com', role: 'Rail Planner', lastLogin: '3h ago', status: 'active' },
  { name: 'Jennifer Lee', email: 'jlee@railcorp.com', role: 'Rail Planner', lastLogin: '2w ago', status: 'suspended' },
];

export function OrganizationsManagement() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selected, setSelected] = useState<Org | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'users' | 'logs'>('overview');

  const filtered = ORGS.filter(o => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) || o.admin.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchPlan = filterPlan === 'all' || o.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  return (
    <div className="flex h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Main */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
              Organizations
            </h1>
            <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>{ORGS.length} registered organizations</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick stats */}
            <div className="flex items-center gap-1 rounded-lg px-3 py-1.5" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
              <span style={{ fontSize: 12, color: SA.text }}>Active:</span>
              <span style={{ fontSize: 12, color: SA.green, fontWeight: 600 }}>{ORGS.filter(o => o.status === 'active').length}</span>
              <span style={{ fontSize: 12, color: SA.textMuted, margin: '0 4px' }}>·</span>
              <span style={{ fontSize: 12, color: SA.text }}>Trial:</span>
              <span style={{ fontSize: 12, color: SA.amber, fontWeight: 600 }}>{ORGS.filter(o => o.status === 'trial').length}</span>
              <span style={{ fontSize: 12, color: SA.textMuted, margin: '0 4px' }}>·</span>
              <span style={{ fontSize: 12, color: SA.text }}>Suspended:</span>
              <span style={{ fontSize: 12, color: SA.red, fontWeight: 600 }}>{ORGS.filter(o => o.status === 'suspended').length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <Search size={14} style={{ color: SA.text }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search organizations or admin..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: SA.textPrimary, flex: 1 }}
            />
          </div>
          {['all', 'active', 'trial', 'suspended'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="rounded-lg px-3 py-1.5 transition-all"
              style={{
                fontSize: 12, fontWeight: 500,
                background: filterStatus === s ? SA.blue + '20' : SA.card,
                border: `1px solid ${filterStatus === s ? SA.blue : SA.border}`,
                color: filterStatus === s ? SA.blue : SA.text,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            style={{ background: SA.card, border: `1px solid ${SA.border}`, color: SA.text, borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Plans</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Professional">Professional</option>
            <option value="Starter">Starter</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${SA.border}` }}>
                {['Organization', 'Plan', 'Users', 'Active Jobs', 'Status', 'Admin', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SA.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((org, i) => (
                <tr
                  key={org.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${SA.border}30` : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = SA.cardAlt)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { setSelected(org); setDetailTab('overview'); }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: SA.blue + '15' }}>
                        <Building2 size={14} style={{ color: SA.blue }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{org.name}</div>
                        <div style={{ fontSize: 11, color: SA.text }}>{org.id} · since {org.created}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="rounded px-2 py-0.5" style={{ fontSize: 11, fontWeight: 600, background: PLAN_COLORS[org.plan] + '18', color: PLAN_COLORS[org.plan] }}>
                      {org.plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: SA.textPrimary, fontWeight: 600 }}>{org.users}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: org.activeJobs > 0 ? SA.blue : SA.textMuted, boxShadow: org.activeJobs > 0 ? `0 0 4px ${SA.blue}` : 'none' }} />
                      <span style={{ fontSize: 13, color: org.activeJobs > 0 ? SA.textPrimary : SA.text }}>{org.activeJobs}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 600, background: STATUS_COLORS[org.status] + '18', color: STATUS_COLORS[org.status], textTransform: 'capitalize' }}>
                      {org.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: SA.text }}>{org.admin}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); setSelected(org); }} className="rounded px-2 py-1 transition-all" style={{ fontSize: 11, background: SA.blue + '15', color: SA.blue, border: `1px solid ${SA.blue}30`, cursor: 'pointer' }}>
                        View
                      </button>
                      {org.status !== 'suspended' ? (
                        <button onClick={e => e.stopPropagation()} className="rounded px-2 py-1 transition-all" style={{ fontSize: 11, background: SA.red + '15', color: SA.red, border: `1px solid ${SA.red}30`, cursor: 'pointer' }}>
                          Suspend
                        </button>
                      ) : (
                        <button onClick={e => e.stopPropagation()} className="rounded px-2 py-1 transition-all" style={{ fontSize: 11, background: SA.green + '15', color: SA.green, border: `1px solid ${SA.green}30`, cursor: 'pointer' }}>
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-auto"
            style={{ width: 400, background: SA.card, borderLeft: `1px solid ${SA.border}` }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${SA.border}` }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: SA.textPrimary }}>{selected.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded px-2 py-0.5" style={{ fontSize: 10, fontWeight: 600, background: PLAN_COLORS[selected.plan] + '18', color: PLAN_COLORS[selected.plan] }}>{selected.plan}</span>
                  <span className="rounded-full px-2 py-0.5" style={{ fontSize: 10, fontWeight: 600, background: STATUS_COLORS[selected.status] + '18', color: STATUS_COLORS[selected.status], textTransform: 'capitalize' }}>{selected.status}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: SA.text, background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: `1px solid ${SA.border}` }}>
              {(['overview', 'users', 'logs'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className="flex-1 py-2.5 transition-all"
                  style={{ fontSize: 12, fontWeight: 500, color: detailTab === tab ? SA.cyan : SA.text, background: 'none', border: 'none', borderBottom: `2px solid ${detailTab === tab ? SA.cyan : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {detailTab === 'overview' && (
              <div className="p-5 space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Users', value: selected.users, icon: Users, color: SA.blue },
                    { label: 'Active Jobs', value: selected.activeJobs, icon: Cpu, color: SA.purple },
                    { label: 'Storage Used', value: selected.storage, icon: Package, color: SA.cyan },
                    { label: 'API Calls/mo', value: selected.apiCalls.toLocaleString(), icon: Zap, color: SA.amber },
                    { label: 'Error Rate', value: `${selected.errorRate}%`, icon: AlertTriangle, color: selected.errorRate > 2 ? SA.red : SA.green },
                    { label: 'Created', value: selected.created, icon: Calendar, color: SA.text },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg p-3" style={{ background: SA.cardAlt, border: `1px solid ${SA.border}` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <m.icon size={12} style={{ color: m.color }} />
                        <span style={{ fontSize: 10, color: SA.text }}>{m.label}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: SA.textPrimary }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: SA.text, marginTop: 4 }}>Admin: <span style={{ color: SA.textPrimary, fontWeight: 600 }}>{selected.admin}</span></div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all" style={{ background: SA.blue + '15', color: SA.blue, border: `1px solid ${SA.blue}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    <Activity size={13} /> View Activity
                  </button>
                  {selected.status !== 'suspended' ? (
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all" style={{ background: SA.red + '15', color: SA.red, border: `1px solid ${SA.red}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                      <Ban size={13} /> Suspend
                    </button>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all" style={{ background: SA.green + '15', color: SA.green, border: `1px solid ${SA.green}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                      <CheckCircle2 size={13} /> Restore
                    </button>
                  )}
                </div>
              </div>
            )}

            {detailTab === 'users' && (
              <div className="p-5 space-y-2">
                <div style={{ fontSize: 12, color: SA.text, marginBottom: 8 }}>Showing top users for {selected.name}</div>
                {ORG_USERS.map(u => (
                  <div key={u.email} className="flex items-center justify-between rounded-lg p-3" style={{ background: SA.cardAlt, border: `1px solid ${SA.border}` }}>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: SA.blue + '25', color: SA.blue, fontSize: 11, fontWeight: 700 }}>
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: SA.textPrimary }}>{u.name}</div>
                        <div style={{ fontSize: 10, color: SA.text }}>{u.role} · {u.lastLogin}</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: u.status === 'active' ? SA.green : SA.red }} />
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'logs' && (
              <div className="p-5 space-y-2">
                <div style={{ fontSize: 12, color: SA.text, marginBottom: 8 }}>Recent activity for {selected.name}</div>
                {[
                  { action: 'optimization.run', user: 'S. Mitchell', time: '2h ago', severity: 'info' },
                  { action: 'user.created', user: 'J. Chen', time: '5h ago', severity: 'info' },
                  { action: 'auth.failed', user: 'Unknown', time: '8h ago', severity: 'critical' },
                  { action: 'vehicle.deleted', user: 'J. Chen', time: '1d ago', severity: 'warning' },
                  { action: 'role.modified', user: 'S. Mitchell', time: '2d ago', severity: 'warning' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: SA.cardAlt, border: `1px solid ${SA.border}` }}>
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: log.severity === 'critical' ? SA.red : log.severity === 'warning' ? SA.amber : SA.green }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: SA.textPrimary }}>{log.action}</div>
                      <div style={{ fontSize: 10, color: SA.text }}>{log.user} · {log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
