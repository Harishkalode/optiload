import React, { useState } from 'react';
import { Shield, Plus, Users, X, Save, ChevronRight, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

interface Role {
  id: string;
  name: string;
  description: string;
  scope: 'organization';
  userCount: number;
  color: string;
  isSystem: boolean;
}

interface Permission {
  id: string;
  label: string;
  category: string;
}

const CATEGORIES = ['Vehicles', 'Loads', 'Optimization', 'Analytics', 'User Management', 'Audit Logs'];

const PERMISSIONS: Permission[] = [
  // Vehicles
  { id: 'vehicle.view', label: 'View Vehicles', category: 'Vehicles' },
  { id: 'vehicle.create', label: 'Create Vehicles', category: 'Vehicles' },
  { id: 'vehicle.edit', label: 'Edit Vehicles', category: 'Vehicles' },
  { id: 'vehicle.delete', label: 'Delete Vehicles', category: 'Vehicles' },
  { id: 'vehicle.import', label: 'Import Vehicles', category: 'Vehicles' },
  // Loads
  { id: 'load.view', label: 'View Loads', category: 'Loads' },
  { id: 'load.create', label: 'Create Loads', category: 'Loads' },
  { id: 'load.edit', label: 'Edit Loads', category: 'Loads' },
  { id: 'load.delete', label: 'Delete Loads', category: 'Loads' },
  { id: 'load.import', label: 'Bulk Import Loads', category: 'Loads' },
  // Optimization
  { id: 'opt.view', label: 'View Jobs', category: 'Optimization' },
  { id: 'opt.run', label: 'Run Optimization', category: 'Optimization' },
  { id: 'opt.export', label: 'Export Results', category: 'Optimization' },
  { id: 'opt.advanced', label: 'Multi-Objective Mode', category: 'Optimization' },
  { id: 'opt.simulation', label: 'Simulation Mode', category: 'Optimization' },
  // Analytics
  { id: 'analytics.view', label: 'View Analytics', category: 'Analytics' },
  { id: 'analytics.export', label: 'Export Reports', category: 'Analytics' },
  { id: 'analytics.compliance', label: 'Compliance Reports', category: 'Analytics' },
  // User Management
  { id: 'user.view', label: 'View Users', category: 'User Management' },
  { id: 'user.invite', label: 'Invite Users', category: 'User Management' },
  { id: 'user.edit', label: 'Edit Users', category: 'User Management' },
  { id: 'user.suspend', label: 'Suspend Users', category: 'User Management' },
  { id: 'role.view', label: 'View Roles', category: 'User Management' },
  { id: 'role.manage', label: 'Manage Roles', category: 'User Management' },
  // Audit Logs
  { id: 'audit.view', label: 'View Audit Logs', category: 'Audit Logs' },
  { id: 'audit.export', label: 'Export Audit Logs', category: 'Audit Logs' },
];

const MOCK_ROLES: Role[] = [
  { id: 'R-001', name: 'Admin', description: 'Full operational access within the organization', scope: 'organization', userCount: 3, color: '#2563EB', isSystem: true },
  { id: 'R-002', name: 'Sub-Admin', description: 'Delegated admin created by the Admin', scope: 'organization', userCount: 2, color: '#0891B2', isSystem: true },
  { id: 'R-003', name: 'Operations Manager', description: 'Manages optimization operations and analytics', scope: 'organization', userCount: 4, color: '#059669', isSystem: true },
  { id: 'R-004', name: 'Rail Planner', description: 'Plans and executes optimization jobs', scope: 'organization', userCount: 6, color: '#0891B2', isSystem: true },
  { id: 'R-005', name: 'Compliance Officer', description: 'Read-only access with compliance report export', scope: 'organization', userCount: 2, color: '#EA580C', isSystem: true },
  { id: 'R-006', name: 'Yard Supervisor', description: 'Oversees on-ground load operations', scope: 'organization', userCount: 3, color: '#CA8A04', isSystem: true },
  { id: 'R-007', name: 'Loader Operator', description: 'Executes load placement in the field', scope: 'organization', userCount: 8, color: '#64748B', isSystem: true },
  { id: 'R-008', name: 'Viewer', description: 'Read-only access to assigned resources', scope: 'organization', userCount: 5, color: '#6B7280', isSystem: true },
  { id: 'R-009', name: 'Senior Planner', description: 'Custom role — elevated planner with analytics access', scope: 'organization', userCount: 2, color: '#8B5CF6', isSystem: false },
];

// Default permissions per role
const ROLE_PERMS: Record<string, string[]> = {
  'R-001': PERMISSIONS.map(p => p.id), // Admin: all
  'R-002': PERMISSIONS.filter(p => !p.id.includes('role.manage') && !p.id.includes('audit.export') && !p.id.includes('user.suspend')).map(p => p.id),
  'R-003': ['vehicle.view', 'load.view', 'opt.view', 'opt.run', 'opt.export', 'analytics.view', 'analytics.export', 'analytics.compliance', 'audit.view'],
  'R-004': ['vehicle.view', 'load.view', 'load.create', 'load.edit', 'opt.view', 'opt.run', 'opt.export', 'analytics.view'],
  'R-005': ['vehicle.view', 'load.view', 'opt.view', 'analytics.view', 'analytics.export', 'analytics.compliance', 'audit.view', 'audit.export'],
  'R-006': ['vehicle.view', 'load.view', 'load.create', 'load.edit', 'opt.view'],
  'R-007': ['vehicle.view', 'load.view', 'load.create'],
  'R-008': ['vehicle.view', 'load.view', 'opt.view'],
  'R-009': ['vehicle.view', 'load.view', 'load.create', 'opt.view', 'opt.run', 'opt.export', 'analytics.view', 'analytics.export'],
};

export function RolesManagement() {
  const { isDark, palette } = useTheme();
  const [roles, setRoles] = useState(MOCK_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    const p: Record<string, Record<string, boolean>> = {};
    MOCK_ROLES.forEach(r => {
      p[r.id] = {};
      PERMISSIONS.forEach(perm => {
        p[r.id][perm.id] = (ROLE_PERMS[r.id] || []).includes(perm.id);
      });
    });
    return p;
  });
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', color: '#8B5CF6' });

  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#161D2A' : '#F8FAFC';
  const hoverBg = isDark ? '#1A2235' : '#F1F5F9';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: textPrimary,
    borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%',
  };

  const togglePerm = (permId: string) => {
    if (!selectedRole) return;
    setPermissions(prev => ({
      ...prev,
      [selectedRole.id]: {
        ...prev[selectedRole.id],
        [permId]: !prev[selectedRole.id][permId],
      },
    }));
  };

  const toggleCategory = (cat: string) => {
    if (!selectedRole) return;
    const catPerms = PERMISSIONS.filter(p => p.category === cat);
    const allEnabled = catPerms.every(p => permissions[selectedRole.id][p.id]);
    setPermissions(prev => ({
      ...prev,
      [selectedRole.id]: {
        ...prev[selectedRole.id],
        ...Object.fromEntries(catPerms.map(p => [p.id, !allEnabled])),
      },
    }));
  };

  const handleCreateRole = () => {
    const id = 'R-' + String(roles.length + 1).padStart(3, '0');
    const role: Role = { id, name: newRole.name, description: newRole.description, scope: 'organization', userCount: 0, color: newRole.color, isSystem: false };
    const perms: Record<string, boolean> = {};
    PERMISSIONS.forEach(p => { perms[p.id] = false; });
    setRoles(prev => [...prev, role]);
    setPermissions(prev => ({ ...prev, [id]: perms }));
    setShowCreate(false);
    setSelectedRole(role);
    setNewRole({ name: '', description: '', color: '#8B5CF6' });
  };

  const enabledCount = selectedRole ? Object.values(permissions[selectedRole.id] || {}).filter(Boolean).length : 0;

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: 'Inter, sans-serif', background: isDark ? '#080D13' : '#F1F5F9' }}>
      {/* Roles list */}
      <div className="flex-shrink-0 overflow-auto p-5" style={{ width: 300, background: bg, borderRight: `1px solid ${border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>Roles</div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all"
            style={{ background: palette.primary, color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <Plus size={13} /> Create
          </button>
        </div>

        {/* System roles */}
        <div style={{ fontSize: 10, color: text, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>
          System Roles
        </div>
        {roles.filter(r => r.isSystem).map(role => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role)}
            className="w-full rounded-xl p-3 mb-1.5 text-left transition-all"
            style={{
              background: selectedRole?.id === role.id ? role.color + '15' : cardBg,
              border: `1px solid ${selectedRole?.id === role.id ? role.color + '40' : border}`,
              cursor: 'pointer',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full" style={{ background: role.color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{role.name}</span>
            </div>
            <div style={{ fontSize: 11, color: text }}>{role.description}</div>
            <div className="flex items-center gap-1 mt-1.5">
              <Users size={10} style={{ color: text }} />
              <span style={{ fontSize: 10, color: text }}>{role.userCount} users</span>
            </div>
          </button>
        ))}

        {/* Custom roles */}
        {roles.some(r => !r.isSystem) && (
          <>
            <div style={{ fontSize: 10, color: text, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '12px 0 6px 4px' }}>
              Custom Roles
            </div>
            {roles.filter(r => !r.isSystem).map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className="w-full rounded-xl p-3 mb-1.5 text-left transition-all"
                style={{
                  background: selectedRole?.id === role.id ? role.color + '15' : cardBg,
                  border: `1px solid ${selectedRole?.id === role.id ? role.color + '40' : border}`,
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: role.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{role.name}</span>
                  <span className="rounded px-1.5" style={{ fontSize: 9, background: '#8B5CF615', color: '#8B5CF6' }}>Custom</span>
                </div>
                <div style={{ fontSize: 11, color: text }}>{role.description}</div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Users size={10} style={{ color: text }} />
                  <span style={{ fontSize: 10, color: text }}>{role.userCount} users</span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Permission editor */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedRole ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: text }}>
            <Shield size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontSize: 14, color: text }}>Select a role to edit permissions</div>
          </div>
        ) : (
          <div>
            {/* Role header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: selectedRole.color }} />
                  <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: textPrimary }}>
                    {selectedRole.name}
                  </h2>
                  {selectedRole.isSystem && (
                    <span className="rounded px-2 py-0.5" style={{ fontSize: 10, background: border, color: text }}>System</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: text, marginTop: 2 }}>{selectedRole.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, color: text }}>
                  <span style={{ color: palette.primary, fontWeight: 700 }}>{enabledCount}</span> / {PERMISSIONS.length} permissions
                </span>
                <button
                  className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
                  style={{ background: palette.primary, color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  <Save size={14} /> Save Role
                </button>
              </div>
            </div>

            {/* Permission Matrix */}
            <div className="space-y-4">
              {CATEGORIES.map(cat => {
                const catPerms = PERMISSIONS.filter(p => p.category === cat);
                const enabledInCat = catPerms.filter(p => permissions[selectedRole.id]?.[p.id]).length;
                const allEnabled = enabledInCat === catPerms.length;
                const someEnabled = enabledInCat > 0 && !allEnabled;

                return (
                  <div key={cat} className="rounded-xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
                    {/* Category header */}
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ background: cardBg, borderBottom: `1px solid ${border}` }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Category toggle */}
                        <button
                          onClick={() => toggleCategory(cat)}
                          className="flex items-center justify-center rounded transition-all"
                          style={{ width: 18, height: 18, background: allEnabled ? palette.primary : someEnabled ? palette.primary + '50' : 'transparent', border: `2px solid ${allEnabled || someEnabled ? palette.primary : border}`, cursor: 'pointer' }}
                        >
                          {(allEnabled || someEnabled) && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d={allEnabled ? 'M1 4l3 3 5-6' : 'M2 4h6'} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{cat}</span>
                      </div>
                      <span style={{ fontSize: 11, color: text }}>{enabledInCat}/{catPerms.length} enabled</span>
                    </div>

                    {/* Permission checkboxes */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
                      {catPerms.map((perm, i) => {
                        const enabled = permissions[selectedRole.id]?.[perm.id] ?? false;
                        return (
                          <label
                            key={perm.id}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                            style={{
                              background: 'transparent',
                              borderRight: (i + 1) % 3 !== 0 ? `1px solid ${border}` : 'none',
                              borderBottom: Math.floor(i / 3) < Math.floor((catPerms.length - 1) / 3) ? `1px solid ${border}` : 'none',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div
                              className="flex items-center justify-center rounded flex-shrink-0"
                              style={{ width: 16, height: 16, background: enabled ? palette.primary : 'transparent', border: `2px solid ${enabled ? palette.primary : border}`, cursor: 'pointer', transition: 'all 0.15s' }}
                              onClick={() => togglePerm(perm.id)}
                            >
                              {enabled && (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <span
                              style={{ fontSize: 12, color: enabled ? textPrimary : text, fontWeight: enabled ? 500 : 400 }}
                              onClick={() => togglePerm(perm.id)}
                            >
                              {perm.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-md"
              style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>Create Custom Role</div>
                <button onClick={() => setShowCreate(false)} style={{ color: text, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Role Name</label>
                  <input value={newRole.name} onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="e.g. Senior Planner" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                    placeholder="Describe this role's responsibilities..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Role Color</label>
                  <div className="flex items-center gap-3">
                    {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'].map(c => (
                      <button
                        key={c}
                        onClick={() => setNewRole(p => ({ ...p, color: c }))}
                        className="rounded-full transition-all"
                        style={{ width: 24, height: 24, background: c, border: newRole.color === c ? `3px solid ${textPrimary}` : '3px solid transparent', cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg py-2.5" style={{ background: 'transparent', border: `1px solid ${border}`, color: text, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleCreateRole} disabled={!newRole.name} className="flex-1 rounded-lg py-2.5" style={{ background: newRole.name ? palette.primary : palette.primary + '60', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: newRole.name ? 'pointer' : 'not-allowed' }}>
                  Create Role
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
