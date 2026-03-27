import React, { useState } from 'react';
import {
  Users, Search, Filter, Ban, RefreshCw, Eye, X,
  Building2, Shield, Clock, Activity, AlertTriangle,
  CheckCircle2, UserX, Key, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SA = {
  bg: '#060A0F', card: '#0D1520', cardAlt: '#0A1018', border: '#162032',
  text: '#64748B', textPrimary: '#E2E8F0', textMuted: '#475569',
  cyan: '#06B6D4', blue: '#3B82F6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string;
  orgId: string;
  status: 'active' | 'suspended' | 'invited';
  lastLogin: string;
  mfa: boolean;
  jobs: number;
}

const ALL_USERS: GlobalUser[] = [
  { id: 'U-001', name: 'Sarah Mitchell', email: 'sarah@railcorp.com', role: 'Organization Owner', org: 'RailCorp Inc.', orgId: 'ORG-001', status: 'active', lastLogin: '2h ago', mfa: true, jobs: 142 },
  { id: 'U-002', name: 'James Chen', email: 'james@logiTrans.com', role: 'Admin', org: 'LogiTrans Partners', orgId: 'ORG-002', status: 'active', lastLogin: '5h ago', mfa: true, jobs: 67 },
  { id: 'U-003', name: 'Ana Patel', email: 'ana@freightco.com', role: 'Organization Owner', org: 'FreightCo Global', orgId: 'ORG-003', status: 'active', lastLogin: '1d ago', mfa: true, jobs: 289 },
  { id: 'U-004', name: 'Robert Kim', email: 'rkim@midwestrail.com', role: 'Admin', org: 'MidWest Rail', orgId: 'ORG-004', status: 'active', lastLogin: '3h ago', mfa: false, jobs: 24 },
  { id: 'U-005', name: 'Emily Watson', email: 'ewatson@nationalrail.gov', role: 'Organization Owner', org: 'National Rail Authority', orgId: 'ORG-005', status: 'active', lastLogin: '6h ago', mfa: true, jobs: 418 },
  { id: 'U-006', name: 'Mark Torres', email: 'mark@coastal.com', role: 'Organization Owner', org: 'Coastal Logistics', orgId: 'ORG-006', status: 'suspended', lastLogin: '3w ago', mfa: false, jobs: 31 },
  { id: 'U-007', name: 'David Park', email: 'dpark@railcorp.com', role: 'Rail Planner', org: 'RailCorp Inc.', orgId: 'ORG-001', status: 'active', lastLogin: '30m ago', mfa: true, jobs: 88 },
  { id: 'U-008', name: 'Jennifer Lee', email: 'jlee@railcorp.com', role: 'Rail Planner', org: 'RailCorp Inc.', orgId: 'ORG-001', status: 'suspended', lastLogin: '2w ago', mfa: true, jobs: 19 },
  { id: 'U-009', name: 'Lisa Anderson', email: 'lisa@alpine.com', role: 'Admin', org: 'Alpine Freight', orgId: 'ORG-007', status: 'active', lastLogin: '2h ago', mfa: false, jobs: 12 },
  { id: 'U-010', name: 'Michael Chen', email: 'mchen@pacific.com', role: 'Operations Manager', org: 'Pacific Rail Systems', orgId: 'ORG-008', status: 'active', lastLogin: '4h ago', mfa: true, jobs: 76 },
  { id: 'U-011', name: 'Sandra White', email: 'swhite@freightco.com', role: 'Compliance Officer', org: 'FreightCo Global', orgId: 'ORG-003', status: 'active', lastLogin: '8h ago', mfa: true, jobs: 0 },
  { id: 'U-012', name: 'Tom Wright', email: 'twright@nationalrail.gov', role: 'Loader Operator', org: 'National Rail Authority', orgId: 'ORG-005', status: 'invited', lastLogin: 'Never', mfa: false, jobs: 0 },
];

const ROLE_COLORS: Record<string, string> = {
  'Organization Owner': SA.purple,
  'Admin': SA.blue,
  'Sub-Admin': SA.cyan,
  'Operations Manager': '#059669',
  'Rail Planner': '#0891B2',
  'Compliance Officer': '#EA580C',
  'Yard Supervisor': '#CA8A04',
  'Loader Operator': SA.text,
  'Viewer': SA.textMuted,
};

const STATUS_COLOR: Record<string, string> = {
  active: SA.green,
  suspended: SA.red,
  invited: SA.amber,
};

export function GlobalUsers() {
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<GlobalUser | null>(null);

  const orgs = Array.from(new Set(ALL_USERS.map(u => u.org)));

  const filtered = ALL_USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchOrg = filterOrg === 'all' || u.org === filterOrg;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchOrg && matchStatus;
  });

  return (
    <div className="flex h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
              Global Users
            </h1>
            <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>
              All users across {orgs.length} organizations — {ALL_USERS.length} total
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Active', count: ALL_USERS.filter(u => u.status === 'active').length, color: SA.green },
              { label: 'Suspended', count: ALL_USERS.filter(u => u.status === 'suspended').length, color: SA.red },
              { label: 'Invited', count: ALL_USERS.filter(u => u.status === 'invited').length, color: SA.amber },
            ].map(s => (
              <div key={s.label} className="rounded-lg px-3 py-1.5" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
                <span style={{ fontSize: 11, color: SA.text }}>{s.label}: </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-48" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <Search size={14} style={{ color: SA.text }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or role..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: SA.textPrimary, flex: 1 }}
            />
          </div>
          <select
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
            style={{ background: SA.card, border: `1px solid ${SA.border}`, color: SA.text, borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Organizations</option>
            {orgs.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {['all', 'active', 'suspended', 'invited'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="rounded-lg px-3 py-1.5 transition-all"
              style={{
                fontSize: 12, background: filterStatus === s ? SA.blue + '20' : SA.card,
                border: `1px solid ${filterStatus === s ? SA.blue : SA.border}`,
                color: filterStatus === s ? SA.blue : SA.text, cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${SA.border}` }}>
                {['User', 'Organization', 'Role', 'Status', 'MFA', 'Last Login', 'Jobs', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SA.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${SA.border}30` : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = SA.cardAlt)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setSelected(u)}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, background: (ROLE_COLORS[u.role] || SA.text) + '20', color: ROLE_COLORS[u.role] || SA.text, fontSize: 11, fontWeight: 700 }}>
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: SA.text }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-1.5">
                      <Building2 size={11} style={{ color: SA.text }} />
                      <span style={{ fontSize: 12, color: SA.textPrimary }}>{u.org}</span>
                    </div>
                    <div style={{ fontSize: 10, color: SA.text }}>{u.orgId}</div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className="rounded px-2 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: (ROLE_COLORS[u.role] || SA.text) + '18', color: ROLE_COLORS[u.role] || SA.text }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 600, background: STATUS_COLOR[u.status] + '18', color: STATUS_COLOR[u.status], textTransform: 'capitalize' }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {u.mfa
                      ? <CheckCircle2 size={14} style={{ color: SA.green }} />
                      : <AlertTriangle size={14} style={{ color: SA.amber }} />}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: SA.text }}>{u.lastLogin}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: SA.textPrimary }}>{u.jobs}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-1.5">
                      <button onClick={e => { e.stopPropagation(); setSelected(u); }} className="rounded px-2 py-0.5 transition-all" style={{ fontSize: 11, background: SA.blue + '15', color: SA.blue, border: `1px solid ${SA.blue}30`, cursor: 'pointer' }}>
                        View
                      </button>
                      {u.status === 'active' ? (
                        <button onClick={e => e.stopPropagation()} className="rounded px-2 py-0.5 transition-all" style={{ fontSize: 11, background: SA.red + '15', color: SA.red, border: `1px solid ${SA.red}30`, cursor: 'pointer' }}>
                          Suspend
                        </button>
                      ) : u.status === 'suspended' ? (
                        <button onClick={e => e.stopPropagation()} className="rounded px-2 py-0.5 transition-all" style={{ fontSize: 11, background: SA.green + '15', color: SA.green, border: `1px solid ${SA.green}30`, cursor: 'pointer' }}>
                          Restore
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-auto"
            style={{ width: 360, background: SA.card, borderLeft: `1px solid ${SA.border}` }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${SA.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: SA.textPrimary }}>User Profile</div>
              <button onClick={() => setSelected(null)} style={{ color: SA.text, background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, background: (ROLE_COLORS[selected.role] || SA.text) + '25', color: ROLE_COLORS[selected.role] || SA.text, fontSize: 16, fontWeight: 700 }}>
                  {selected.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: SA.textPrimary }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: SA.text }}>{selected.email}</div>
                </div>
              </div>

              {/* Meta */}
              <div className="rounded-lg p-3 space-y-2" style={{ background: SA.cardAlt, border: `1px solid ${SA.border}` }}>
                {[
                  { label: 'Role', value: selected.role, color: ROLE_COLORS[selected.role] },
                  { label: 'Organization', value: selected.org },
                  { label: 'Org ID', value: selected.orgId },
                  { label: 'Status', value: selected.status, color: STATUS_COLOR[selected.status] },
                  { label: 'Last Login', value: selected.lastLogin },
                  { label: 'MFA', value: selected.mfa ? 'Enabled' : 'Disabled', color: selected.mfa ? SA.green : SA.amber },
                  { label: 'Jobs Run', value: String(selected.jobs) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: SA.text }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: item.color || SA.textPrimary }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Activity Summary */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: SA.textPrimary, marginBottom: 8 }}>Recent Activity</div>
                {[
                  { action: 'Ran optimization OPT-2941', time: '2h ago' },
                  { action: 'Exported compliance report', time: '1d ago' },
                  { action: 'Modified vehicle V-124', time: '3d ago' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${SA.border}20` }}>
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: SA.blue }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: SA.textPrimary }}>{a.action}</div>
                      <div style={{ fontSize: 10, color: SA.text }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Super Admin Actions */}
              <div className="space-y-2 pt-2">
                <div style={{ fontSize: 11, color: SA.text, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Super Admin Actions</div>
                <button className="w-full flex items-center gap-2 rounded-lg py-2 px-3 transition-all" style={{ background: SA.amber + '15', color: SA.amber, border: `1px solid ${SA.amber}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  <Key size={13} /> Reset Access
                </button>
                {selected.status === 'active' ? (
                  <button className="w-full flex items-center gap-2 rounded-lg py-2 px-3 transition-all" style={{ background: SA.red + '15', color: SA.red, border: `1px solid ${SA.red}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    <UserX size={13} /> Suspend User
                  </button>
                ) : (
                  <button className="w-full flex items-center gap-2 rounded-lg py-2 px-3 transition-all" style={{ background: SA.green + '15', color: SA.green, border: `1px solid ${SA.green}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    <CheckCircle2 size={13} /> Restore User
                  </button>
                )}
                <button className="w-full flex items-center gap-2 rounded-lg py-2 px-3 transition-all" style={{ background: SA.blue + '15', color: SA.blue, border: `1px solid ${SA.blue}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  <Activity size={13} /> View Full Activity
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
