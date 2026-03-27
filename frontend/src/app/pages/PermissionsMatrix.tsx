import React, { useState } from 'react';
import { Grid3x3, Check, Search, Save } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Permission {
  id: string;
  category: string;
  name: string;
  description: string;
}

const PERMISSIONS: Permission[] = [
  { id: 'vehicle.view', category: 'Vehicle Management', name: 'View Vehicles', description: 'View vehicle list and details' },
  { id: 'vehicle.create', category: 'Vehicle Management', name: 'Create Vehicles', description: 'Create new vehicle instances' },
  { id: 'vehicle.edit', category: 'Vehicle Management', name: 'Edit Vehicles', description: 'Modify existing vehicles' },
  { id: 'vehicle.delete', category: 'Vehicle Management', name: 'Delete Vehicles', description: 'Remove vehicles from system' },
  
  { id: 'load.view', category: 'Load Management', name: 'View Loads', description: 'View load list and details' },
  { id: 'load.create', category: 'Load Management', name: 'Create Loads', description: 'Create new load entries' },
  { id: 'load.edit', category: 'Load Management', name: 'Edit Loads', description: 'Modify existing loads' },
  { id: 'load.delete', category: 'Load Management', name: 'Delete Loads', description: 'Remove loads from system' },
  
  { id: 'optimization.view', category: 'Optimization', name: 'View Optimizations', description: 'View optimization jobs and results' },
  { id: 'optimization.run', category: 'Optimization', name: 'Run Optimization', description: 'Execute optimization engine' },
  { id: 'optimization.export', category: 'Optimization', name: 'Export Results', description: 'Export optimization plans' },
  
  { id: 'simulation.view', category: 'Simulation', name: 'View Simulations', description: 'View shock and stress simulations' },
  { id: 'simulation.run', category: 'Simulation', name: 'Run Simulations', description: 'Execute simulation engine' },
  
  { id: 'analytics.view', category: 'Analytics', name: 'View Analytics', description: 'Access analytics dashboard' },
  { id: 'analytics.export', category: 'Analytics', name: 'Export Analytics', description: 'Export analytics data' },
  
  { id: 'compliance.view', category: 'Compliance', name: 'View Compliance', description: 'Access compliance reports' },
  { id: 'compliance.export', category: 'Compliance', name: 'Export Compliance', description: 'Export compliance documents' },
  
  { id: 'audit.view', category: 'Audit', name: 'View Audit Logs', description: 'Access audit trail' },
  { id: 'audit.export', category: 'Audit', name: 'Export Audit Logs', description: 'Export audit data' },
  
  { id: 'user.view', category: 'User Management', name: 'View Users', description: 'View user list' },
  { id: 'user.create', category: 'User Management', name: 'Create Users', description: 'Add new users' },
  { id: 'user.edit', category: 'User Management', name: 'Edit Users', description: 'Modify user details' },
  { id: 'user.delete', category: 'User Management', name: 'Delete Users', description: 'Remove users' },
  
  { id: 'org.view', category: 'Organization', name: 'View Org Settings', description: 'View organization settings' },
  { id: 'org.edit', category: 'Organization', name: 'Edit Org Settings', description: 'Modify organization settings' },
  { id: 'billing.view', category: 'Organization', name: 'View Billing', description: 'Access billing information' },
  
  { id: 'api.view', category: 'API', name: 'View API Keys', description: 'View API keys' },
  { id: 'api.create', category: 'API', name: 'Create API Keys', description: 'Generate new API keys' },
  { id: 'api.revoke', category: 'API', name: 'Revoke API Keys', description: 'Revoke existing API keys' },
  
  { id: 'execution.view', category: 'Execution Mode', name: 'View Execution', description: 'Access execution assistant' },
  { id: 'execution.confirm', category: 'Execution Mode', name: 'Confirm Placement', description: 'Confirm load placement' },
  { id: 'execution.photo', category: 'Execution Mode', name: 'Upload Photo Proof', description: 'Upload placement photos' },
];

const ROLES = [
  { id: 'super-admin', name: 'Super Admin', color: '#DC2626' },
  { id: 'org-owner', name: 'Org Owner', color: '#9333EA' },
  { id: 'admin', name: 'Admin', color: '#2563EB' },
  { id: 'ops-manager', name: 'Ops Manager', color: '#059669' },
  { id: 'planner', name: 'Rail Planner', color: '#0891B2' },
  { id: 'compliance', name: 'Compliance', color: '#EA580C' },
  { id: 'supervisor', name: 'Supervisor', color: '#CA8A04' },
  { id: 'operator', name: 'Operator', color: '#64748B' },
  { id: 'viewer', name: 'Viewer', color: '#6B7280' },
];

// Mock permission matrix
const PERMISSION_MATRIX: Record<string, Record<string, boolean>> = {
  'super-admin': Object.fromEntries(PERMISSIONS.map(p => [p.id, true])),
  'org-owner': {
    'vehicle.view': true, 'vehicle.create': true, 'vehicle.edit': true, 'vehicle.delete': true,
    'load.view': true, 'load.create': true, 'load.edit': true, 'load.delete': true,
    'optimization.view': true, 'optimization.run': true, 'optimization.export': true,
    'simulation.view': true, 'simulation.run': true,
    'analytics.view': true, 'analytics.export': true,
    'compliance.view': true, 'compliance.export': true,
    'audit.view': true,
    'user.view': true, 'user.create': true, 'user.edit': true, 'user.delete': true,
    'org.view': true, 'org.edit': true, 'billing.view': true,
    'api.view': true, 'api.create': true, 'api.revoke': true,
  },
  'admin': {
    'vehicle.view': true, 'vehicle.create': true, 'vehicle.edit': true, 'vehicle.delete': true,
    'load.view': true, 'load.create': true, 'load.edit': true, 'load.delete': true,
    'optimization.view': true, 'optimization.run': true, 'optimization.export': true,
    'simulation.view': true, 'simulation.run': true,
    'analytics.view': true,
    'compliance.view': true,
  },
  'ops-manager': {
    'optimization.view': true, 'optimization.run': true, 'optimization.export': true,
    'analytics.view': true, 'analytics.export': true,
    'compliance.view': true,
  },
  'planner': {
    'vehicle.view': true,
    'load.view': true, 'load.create': true,
    'optimization.view': true, 'optimization.run': true,
    'compliance.view': true,
  },
  'compliance': {
    'optimization.view': true,
    'compliance.view': true, 'compliance.export': true,
    'audit.view': true, 'audit.export': true,
  },
  'supervisor': {
    'execution.view': true, 'execution.confirm': true, 'execution.photo': true,
    'compliance.view': true,
  },
  'operator': {
    'execution.view': true, 'execution.confirm': true, 'execution.photo': true,
  },
  'viewer': {
    'optimization.view': true,
    'analytics.view': true,
    'compliance.view': true,
  },
};

export function PermissionsMatrix() {
  const { isDark, palette } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#161D2A' : '#F8FAFC';

  const categories = Array.from(new Set(PERMISSIONS.map(p => p.category)));

  const filteredPermissions = PERMISSIONS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, fontFamily: 'Space Grotesk, sans-serif' }}>
              Permission Matrix
            </h2>
            <p style={{ fontSize: 12, color: text, marginTop: 2 }}>
              Granular permission control across all roles
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{ background: palette.primary, color: 'white', fontWeight: 600, fontSize: 13 }}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-6 py-3 flex items-center gap-3" style={{ background: cardBg, borderBottom: `1px solid ${border}` }}>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: text }} />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border outline-none"
            style={{
              background: bg,
              borderColor: border,
              color: textPrimary,
              fontSize: 13,
            }}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border outline-none"
          style={{ background: bg, borderColor: border, color: textPrimary, fontSize: 13 }}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Matrix Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: border, background: bg }}>
          <table className="w-full" style={{ minWidth: 1200 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: cardBg, borderBottom: `2px solid ${border}` }}>
                <th
                  className="text-left px-4 py-3"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: text,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    minWidth: 300,
                    position: 'sticky',
                    left: 0,
                    background: cardBg,
                    borderRight: `1px solid ${border}`,
                  }}
                >
                  Permission
                </th>
                {ROLES.map(role => (
                  <th
                    key={role.id}
                    className="text-center px-3 py-3"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: role.color,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      minWidth: 100,
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: role.color + '15' }}
                      >
                        <Grid3x3 size={14} style={{ color: role.color }} />
                      </div>
                      <span>{role.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((permission, idx) => {
                const isNewCategory = idx === 0 || filteredPermissions[idx - 1].category !== permission.category;
                return (
                  <React.Fragment key={permission.id}>
                    {isNewCategory && (
                      <tr>
                        <td
                          colSpan={ROLES.length + 1}
                          className="px-4 py-2"
                          style={{
                            background: cardBg,
                            fontSize: 12,
                            fontWeight: 600,
                            color: palette.primary,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {permission.category}
                        </td>
                      </tr>
                    )}
                    <tr
                      style={{
                        borderBottom: `1px solid ${border}`,
                        background: idx % 2 === 0 ? 'transparent' : cardBg + '40',
                      }}
                    >
                      <td
                        className="px-4 py-3"
                        style={{
                          minWidth: 300,
                          position: 'sticky',
                          left: 0,
                          background: idx % 2 === 0 ? bg : cardBg + '40',
                          borderRight: `1px solid ${border}`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary }}>
                            {permission.name}
                          </div>
                          <div style={{ fontSize: 11, color: text, marginTop: 2 }}>
                            {permission.description}
                          </div>
                        </div>
                      </td>
                      {ROLES.map(role => {
                        const hasPermission = PERMISSION_MATRIX[role.id]?.[permission.id] || false;
                        return (
                          <td key={role.id} className="text-center px-3 py-3">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                className="sr-only peer"
                              />
                              <div
                                className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all peer-checked:scale-110"
                                style={{
                                  borderColor: hasPermission ? role.color : border,
                                  background: hasPermission ? role.color : 'transparent',
                                }}
                              >
                                {hasPermission && <Check size={14} color="white" />}
                              </div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
