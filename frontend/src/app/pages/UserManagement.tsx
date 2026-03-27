import React, { useState } from 'react';
import {
  Users, Search, Plus, UserX, UserCheck, Eye,
  CheckCircle2, XCircle, Clock, Shield, Mail,
  X, Activity, Key, ChevronDown, Filter, Download
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'invited';
  lastActive: string;
  mfa: boolean;
  jobsRun: number;
  createdBy: string;
}

const MOCK_USERS: OrgUser[] = [
  { id: 'U-001', name: 'Sarah Mitchell', email: 'sarah.mitchell@railcorp.com', role: 'Organization Owner', status: 'active', lastActive: '2 hours ago', mfa: true, jobsRun: 142, createdBy: 'System' },
  { id: 'U-002', name: 'James Chen', email: 'james.chen@railcorp.com', role: 'Admin', status: 'active', lastActive: '5 hours ago', mfa: true, jobsRun: 67, createdBy: 'Sarah Mitchell' },
  { id: 'U-003', name: 'Maria Rodriguez', email: 'maria.r@railcorp.com', role: 'Operations Manager', status: 'active', lastActive: '1 day ago', mfa: false, jobsRun: 34, createdBy: 'James Chen' },
  { id: 'U-004', name: 'David Park', email: 'dpark@railcorp.com', role: 'Rail Planner', status: 'active', lastActive: '3 hours ago', mfa: true, jobsRun: 88, createdBy: 'James Chen' },
  { id: 'U-005', name: 'Emily Watson', email: 'ewatson@railcorp.com', role: 'Compliance Officer', status: 'active', lastActive: '6 hours ago', mfa: true, jobsRun: 0, createdBy: 'Sarah Mitchell' },
  { id: 'U-006', name: 'Michael Brown', email: 'mbrown@railcorp.com', role: 'Sub-Admin', status: 'active', lastActive: '2 days ago', mfa: false, jobsRun: 19, createdBy: 'James Chen' },
  { id: 'U-007', name: 'Lisa Anderson', email: 'landerson@railcorp.com', role: 'Loader Operator', status: 'active', lastActive: '1 day ago', mfa: false, jobsRun: 23, createdBy: 'Michael Brown' },
  { id: 'U-008', name: 'Robert Kim', email: 'rkim@railcorp.com', role: 'Yard Supervisor', status: 'active', lastActive: '4 days ago', mfa: false, jobsRun: 11, createdBy: 'Michael Brown' },
  { id: 'U-009', name: 'Jennifer Lee', email: 'jlee@railcorp.com', role: 'Rail Planner', status: 'suspended', lastActive: '2 weeks ago', mfa: true, jobsRun: 14, createdBy: 'James Chen' },
  { id: 'U-010', name: 'Thomas Wright', email: 'twright@railcorp.com', role: 'Operations Manager', status: 'invited', lastActive: 'Never', mfa: false, jobsRun: 0, createdBy: 'Sarah Mitchell' },
];

const ROLES_LIST = ['Organization Owner', 'Admin', 'Sub-Admin', 'Operations Manager', 'Rail Planner', 'Compliance Officer', 'Yard Supervisor', 'Loader Operator', 'Viewer'];

const ROLE_COLORS: Record<string, string> = {
  'Organization Owner': '#9333EA',
  'Admin': '#2563EB',
  'Sub-Admin': '#0891B2',
  'Operations Manager': '#059669',
  'Rail Planner': '#0891B2',
  'Compliance Officer': '#EA580C',
  'Yard Supervisor': '#CA8A04',
  'Loader Operator': '#64748B',
  'Viewer': '#6B7280',
};

const STATUS_CFG = {
  active: { color: '#10B981', label: 'Active', Icon: CheckCircle2 },
  suspended: { color: '#EF4444', label: 'Suspended', Icon: XCircle },
  invited: { color: '#F59E0B', label: 'Invited', Icon: Clock },
};

export function UserManagement() {
  const { isDark, palette } = useTheme();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [users, setUsers] = useState(MOCK_USERS);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Rail Planner' });

  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#161D2A' : '#F8FAFC';
  const hoverBg = isDark ? '#1E2A38' : '#F8FAFC';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
    }));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, status: prev.status === 'active' ? 'suspended' : 'active' } : null);
    }
  };

  const handleAddUser = () => {
    const u: OrgUser = {
      id: 'U-' + String(users.length + 1).padStart(3, '0'),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'invited',
      lastActive: 'Never',
      mfa: false,
      jobsRun: 0,
      createdBy: 'Sarah Mitchell',
    };
    setUsers(prev => [...prev, u]);
    setShowAddUser(false);
    setNewUser({ name: '', email: '', role: 'Rail Planner' });
  };

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: textPrimary,
    borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%',
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: 'Inter, sans-serif', background: isDark ? '#080D13' : '#F1F5F9' }}>
      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: textPrimary, letterSpacing: '-0.02em' }}>
              User Management
            </h1>
            <p style={{ fontSize: 13, color: text, marginTop: 2 }}>
              {users.filter(u => u.status === 'active').length} active · {users.filter(u => u.status === 'suspended').length} suspended · {users.filter(u => u.status === 'invited').length} invited
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
              style={{ background: cardBg, border: `1px solid ${border}`, color: text, fontSize: 13, cursor: 'pointer' }}
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
              style={{ background: palette.primary, color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={14} /> Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-52" style={{ background: bg, border: `1px solid ${border}` }}>
            <Search size={14} style={{ color: text }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: textPrimary, flex: 1 }}
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            style={{ background: bg, border: `1px solid ${border}`, color: text, borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Roles</option>
            {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {['all', 'active', 'suspended', 'invited'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="rounded-lg px-3 py-2 transition-all"
              style={{
                fontSize: 12,
                background: filterStatus === s ? palette.primary + '18' : bg,
                border: `1px solid ${filterStatus === s ? palette.primary : border}`,
                color: filterStatus === s ? palette.primary : text,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {['Name', 'Role', 'Status', 'Last Active', 'MFA', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const sc = STATUS_CFG[user.status];
                return (
                  <tr
                    key={user.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ width: 32, height: 32, background: (ROLE_COLORS[user.role] || '#64748B') + '20', color: ROLE_COLORS[user.role] || '#64748B', fontSize: 11, fontWeight: 700 }}
                        >
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: text }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="rounded px-2 py-0.5" style={{ fontSize: 11, fontWeight: 500, background: (ROLE_COLORS[user.role] || '#64748B') + '18', color: ROLE_COLORS[user.role] || '#64748B' }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-1.5">
                        <sc.Icon size={12} style={{ color: sc.color }} />
                        <span style={{ fontSize: 12, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: text }}>{user.lastActive}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {user.mfa
                        ? <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Enabled</span>
                        : <span style={{ fontSize: 11, color: text }}>Off</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="rounded px-2 py-1"
                          style={{ fontSize: 11, background: palette.primary + '15', color: palette.primary, border: `1px solid ${palette.primary}30`, cursor: 'pointer' }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => toggleStatus(user.id)}
                          className="rounded px-2 py-1"
                          style={{
                            fontSize: 11,
                            background: user.status === 'active' ? '#EF444415' : '#10B98115',
                            color: user.status === 'active' ? '#EF4444' : '#10B981',
                            border: `1px solid ${user.status === 'active' ? '#EF444430' : '#10B98130'}`,
                            cursor: 'pointer',
                          }}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: text, fontSize: 13 }}>No users match your filters</div>
          )}
        </div>
      </div>

      {/* User Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{ width: 360, background: bg, borderLeft: `1px solid ${border}` }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>User Details</span>
              <button onClick={() => setSelectedUser(null)} style={{ color: text, background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Avatar & basic info */}
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 48, height: 48, background: (ROLE_COLORS[selectedUser.role] || '#64748B') + '25', color: ROLE_COLORS[selectedUser.role] || '#64748B', fontSize: 16, fontWeight: 700 }}
                >
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>{selectedUser.name}</div>
                  <div style={{ fontSize: 12, color: text }}>{selectedUser.email}</div>
                </div>
              </div>

              {/* Role assignment */}
              <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Assign Role
                </label>
                <select
                  defaultValue={selectedUser.role}
                  style={{ ...inputStyle, background: bg }}
                >
                  {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Activity summary */}
              <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Activity Summary
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Status', value: selectedUser.status, color: STATUS_CFG[selectedUser.status].color },
                    { label: 'Last Active', value: selectedUser.lastActive },
                    { label: 'Jobs Run', value: String(selectedUser.jobsRun) },
                    { label: 'MFA', value: selectedUser.mfa ? 'Enabled' : 'Not enabled', color: selectedUser.mfa ? '#10B981' : undefined },
                    { label: 'Created By', value: selectedUser.createdBy },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span style={{ fontSize: 12, color: text }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: item.color || textPrimary, textTransform: item.label === 'Status' ? 'capitalize' : 'none' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Recent Activity</div>
                {[
                  { action: 'Ran optimization OPT-2941', time: '2h ago', type: 'job' },
                  { action: 'Modified vehicle V-124', time: '1d ago', type: 'update' },
                  { action: 'Exported compliance report', time: '3d ago', type: 'export' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: palette.accent }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: textPrimary }}>{a.action}</div>
                      <div style={{ fontSize: 10, color: text }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2" style={{ borderTop: `1px solid ${border}` }}>
              <button
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all"
                style={{ background: palette.primary, color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Save Changes
              </button>
              <button
                onClick={() => toggleStatus(selectedUser.id)}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all"
                style={{
                  background: 'transparent',
                  color: selectedUser.status === 'active' ? '#EF4444' : '#10B981',
                  border: `1px solid ${selectedUser.status === 'active' ? '#EF444430' : '#10B98130'}`,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                {selectedUser.status === 'active'
                  ? <><UserX size={14} /> Deactivate User</>
                  : <><UserCheck size={14} /> Activate User</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={e => e.target === e.currentTarget && setShowAddUser(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-md"
              style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>Add User</div>
                <button onClick={() => setShowAddUser(false)} style={{ color: text, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Full Name</label>
                  <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Jane Smith" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Work Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="jane@company.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Role</label>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {ROLES_LIST.filter(r => r !== 'Organization Owner').map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddUser(false)} className="flex-1 rounded-lg py-2.5" style={{ background: 'transparent', border: `1px solid ${border}`, color: text, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleAddUser} className="flex-1 rounded-lg py-2.5" style={{ background: palette.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
