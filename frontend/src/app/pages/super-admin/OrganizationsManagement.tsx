import React, { useState, useEffect } from 'react';
import { fetchOrganizations, fetchUsersGlobal } from '../../services/domainApi';
import { apiRequest } from '../../services/http';
import {
  Building2, Search, Filter, MoreVertical, Users, Cpu,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Globe, TrendingUp, Package, X, Eye, Ban, Activity,
  Calendar, Zap, UserCheck, UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

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

function planLabel(pt: string): 'Enterprise' | 'Professional' | 'Starter' {
  if (pt === 'enterprise') return 'Enterprise';
  if (pt === 'growth') return 'Professional';
  return 'Starter';
}

function statusLabel(s: string): 'active' | 'suspended' | 'trial' {
  if (s === 'suspended') return 'suspended';
  if (s === 'deleted') return 'suspended';
  return 'active';
}

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

export function OrganizationsManagement() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [globalUsers, setGlobalUsers] = useState<{ name: string; email: string; role_id: number; last_login: string | null; status: string; organization_id: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selected, setSelected] = useState<Org | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'users' | 'logs'>('overview');

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const [raw, userPage] = await Promise.all([fetchOrganizations(), fetchUsersGlobal(1, 500)]);
        if (c) return;
        setGlobalUsers(userPage.items.map(u => ({ name: u.name, email: u.email, role_id: u.role_id, last_login: u.last_login, status: u.status, organization_id: u.organization_id })));
        const usersByOrg = new Map<number, number>();
        userPage.items.forEach(u => {
          if (u.organization_id == null) return;
          usersByOrg.set(u.organization_id, (usersByOrg.get(u.organization_id) ?? 0) + 1);
        });
        setOrgs(
          raw.map(o => ({
            id: `ORG-${o.id}`,
            name: o.name,
            plan: planLabel(o.plan_type),
            users: usersByOrg.get(o.id) ?? 0,
            activeJobs: 0,
            status: statusLabel(o.status),
            admin: '—',
            created: new Date(o.created_at).toLocaleDateString(),
            storage: '—',
            apiCalls: 0,
            errorRate: 0,
          })),
        );
      } catch (e) {
        if (!c) setLoadErr(e instanceof Error ? e.message : 'Failed to load organizations');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const filtered = orgs.filter(o => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) || o.admin.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchPlan = filterPlan === 'all' || o.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const selectedNumericId = selected ? Number(String(selected.id).replace(/^ORG-/, '')) : NaN;
  const orgUserRows = Number.isFinite(selectedNumericId) ? globalUsers.filter(u => u.organization_id === selectedNumericId) : [];

  return (
    <div className="flex h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Main */}
      <div className="flex-1 p-6 overflow-auto">
        {loadErr && (
          <div className="mb-4 rounded-lg px-4 py-3" style={{ background: SA.red + '12', border: `1px solid ${SA.red}40`, color: SA.red, fontSize: 13 }}>
            {loadErr}
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
              Organizations
            </h1>
            <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>
              {loading ? 'Loading…' : `${orgs.length} from GET /organizations`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick stats */}
            <div className="flex items-center gap-1 rounded-lg px-3 py-1.5" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
              <span style={{ fontSize: 12, color: SA.text }}>Active:</span>
              <span style={{ fontSize: 12, color: SA.green, fontWeight: 600 }}>{orgs.filter(o => o.status === 'active').length}</span>
              <span style={{ fontSize: 12, color: SA.textMuted, margin: '0 4px' }}>·</span>
              <span style={{ fontSize: 12, color: SA.text }}>Trial:</span>
              <span style={{ fontSize: 12, color: SA.amber, fontWeight: 600 }}>{orgs.filter(o => o.status === 'trial').length}</span>
              <span style={{ fontSize: 12, color: SA.textMuted, margin: '0 4px' }}>·</span>
              <span style={{ fontSize: 12, color: SA.text }}>Suspended:</span>
              <span style={{ fontSize: 12, color: SA.red, fontWeight: 600 }}>{orgs.filter(o => o.status === 'suspended').length}</span>
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
                      {org.status === 'active' ? (
                        <button onClick={async e => {
                          e.stopPropagation();
                          try {
                            const oid = Number(org.id.replace('ORG-', ''));
                            await apiRequest(`/organizations/${oid}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'suspended' }) });
                            setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, status: 'suspended' } : o));
                            toast.success('Organization suspended');
                          } catch { toast.error('Failed to suspend organization'); }
                        }} className="rounded px-2 py-1 transition-all" style={{ fontSize: 11, background: SA.red + '15', color: SA.red, border: `1px solid ${SA.red}30`, cursor: 'pointer' }}>
                          Suspend
                        </button>
                      ) : (
                        <button onClick={async e => {
                          e.stopPropagation();
                          try {
                            const oid = Number(org.id.replace('ORG-', ''));
                            await apiRequest(`/organizations/${oid}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
                            setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, status: 'active' } : o));
                            toast.success('Organization activated');
                          } catch { toast.error('Failed to activate organization'); }
                        }} className="rounded px-2 py-1 transition-all" style={{ fontSize: 11, background: SA.green + '15', color: SA.green, border: `1px solid ${SA.green}30`, cursor: 'pointer' }}>
                          Activate
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
                {/* Suspend/Activate */}
                <div className="flex gap-2 pt-2">
                  {selected.status === 'active' ? (
                    <button onClick={async () => {
                      try {
                        const oid = Number(selected.id.replace('ORG-', ''));
                        await apiRequest(`/organizations/${oid}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'suspended' }) });
                        setSelected(prev => prev ? { ...prev, status: 'suspended' } : null);
                        setOrgs(prev => prev.map(o => o.id === selected.id ? { ...o, status: 'suspended' } : o));
                        toast.success('Organization suspended');
                      } catch { toast.error('Failed to suspend organization'); }
                    }} className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all" style={{ background: SA.red + '15', color: SA.red, border: `1px solid ${SA.red}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                      <Ban size={13} /> Suspend
                    </button>
                  ) : (
                    <button onClick={async () => {
                      try {
                        const oid = Number(selected.id.replace('ORG-', ''));
                        await apiRequest(`/organizations/${oid}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
                        setSelected(prev => prev ? { ...prev, status: 'active' } : null);
                        setOrgs(prev => prev.map(o => o.id === selected.id ? { ...o, status: 'active' } : o));
                        toast.success('Organization activated');
                      } catch { toast.error('Failed to activate organization'); }
                    }} className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all" style={{ background: SA.green + '15', color: SA.green, border: `1px solid ${SA.green}30`, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                      <CheckCircle2 size={13} /> Activate
                    </button>
                  )}
                </div>
              </div>
            )}

            {detailTab === 'users' && (
              <div className="p-5 space-y-2">
                <div style={{ fontSize: 12, color: SA.text, marginBottom: 8 }}>Users in org (from GET /users?scope=global)</div>
                {orgUserRows.length === 0 ? (
                  <div style={{ fontSize: 12, color: SA.textMuted }}>No users in sample page — increase page size or add members.</div>
                ) : (
                  orgUserRows.map(u => (
                    <div key={u.email} className="flex items-center justify-between rounded-lg p-3" style={{ background: SA.cardAlt, border: `1px solid ${SA.border}` }}>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: SA.blue + '25', color: SA.blue, fontSize: 11, fontWeight: 700 }}>
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: SA.textPrimary }}>{u.name}</div>
                          <div style={{ fontSize: 10, color: SA.text }}>
                            role #{u.role_id} · {u.last_login ? new Date(u.last_login).toLocaleString() : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: u.status === 'active' ? SA.green : SA.red }} />
                    </div>
                  ))
                )}
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
