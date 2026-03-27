import React, { useState } from 'react';
import { ScrollText, Download, Search, Calendar, ChevronDown, AlertTriangle, Info, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  result: 'success' | 'failed';
  details: string;
}

const MOCK_LOGS: AuditLog[] = [
  { id: 'AL-001', timestamp: '2026-03-27 14:23:15', user: 'Sarah Mitchell', userRole: 'Organization Owner', action: 'user.created', resource: 'User', resourceId: 'U-010', ipAddress: '192.168.1.45', severity: 'info', result: 'success', details: 'Created new user: Thomas Wright' },
  { id: 'AL-002', timestamp: '2026-03-27 14:15:42', user: 'James Chen', userRole: 'Admin', action: 'vehicle.deleted', resource: 'Vehicle', resourceId: 'V-248', ipAddress: '192.168.1.52', severity: 'warning', result: 'success', details: 'Deleted vehicle: Flatcar #248' },
  { id: 'AL-003', timestamp: '2026-03-27 13:58:21', user: 'David Park', userRole: 'Rail Planner', action: 'optimization.run', resource: 'Optimization', resourceId: 'OPT-92', ipAddress: '192.168.1.73', severity: 'info', result: 'success', details: 'Ran optimization job OPT-92' },
  { id: 'AL-004', timestamp: '2026-03-27 13:45:09', user: 'Emily Watson', userRole: 'Compliance Officer', action: 'compliance.export', resource: 'Report', resourceId: 'RPT-2847', ipAddress: '192.168.1.88', severity: 'info', result: 'success', details: 'Exported compliance report for job OPT-91' },
  { id: 'AL-005', timestamp: '2026-03-27 13:32:54', user: 'Unknown', userRole: 'N/A', action: 'auth.failed', resource: 'Authentication', resourceId: 'N/A', ipAddress: '203.45.78.122', severity: 'critical', result: 'failed', details: 'Failed login attempt for user: admin@railcorp.com' },
  { id: 'AL-006', timestamp: '2026-03-27 12:18:33', user: 'Sarah Mitchell', userRole: 'Organization Owner', action: 'role.modified', resource: 'Role', resourceId: 'R-005', ipAddress: '192.168.1.45', severity: 'warning', result: 'success', details: 'Modified permissions for role: Rail Planner' },
  { id: 'AL-007', timestamp: '2026-03-27 11:47:12', user: 'Maria Rodriguez', userRole: 'Operations Manager', action: 'optimization.export', resource: 'Optimization', resourceId: 'OPT-91', ipAddress: '192.168.1.67', severity: 'info', result: 'success', details: 'Exported optimization results' },
  { id: 'AL-008', timestamp: '2026-03-27 11:22:45', user: 'James Chen', userRole: 'Admin', action: 'load.bulk_import', resource: 'Load', resourceId: 'BULK-847', ipAddress: '192.168.1.52', severity: 'info', result: 'success', details: 'Imported 47 loads from CSV' },
  { id: 'AL-009', timestamp: '2026-03-27 10:58:27', user: 'David Park', userRole: 'Rail Planner', action: 'vehicle.accessed', resource: 'Vehicle', resourceId: 'V-352', ipAddress: '192.168.1.73', severity: 'info', result: 'success', details: 'Viewed vehicle details' },
  { id: 'AL-010', timestamp: '2026-03-27 10:15:03', user: 'Lisa Anderson', userRole: 'Loader Operator', action: 'execution.photo_upload', resource: 'Execution', resourceId: 'EXE-428', ipAddress: '192.168.1.94', severity: 'success', result: 'success', details: 'Uploaded placement photo for load L-0445' },
  { id: 'AL-011', timestamp: '2026-03-27 09:42:18', user: 'System', userRole: 'System', action: 'system.backup', resource: 'System', resourceId: 'N/A', ipAddress: '127.0.0.1', severity: 'info', result: 'success', details: 'Automated database backup completed' },
  { id: 'AL-012', timestamp: '2026-03-27 09:12:55', user: 'Emily Watson', userRole: 'Compliance Officer', action: 'audit.view', resource: 'Audit', resourceId: 'N/A', ipAddress: '192.168.1.88', severity: 'info', result: 'success', details: 'Accessed audit logs' },
  { id: 'AL-013', timestamp: '2026-03-27 08:45:00', user: 'Michael Brown', userRole: 'Sub-Admin', action: 'user.role_changed', resource: 'User', resourceId: 'U-007', ipAddress: '192.168.1.55', severity: 'warning', result: 'success', details: 'Role changed for Lisa Anderson: Loader Operator → Sub-Admin' },
];

const SEV_CONFIG = {
  info: { icon: Info, color: '#3B82F6', label: 'Info' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'Warning' },
  critical: { icon: XCircle, color: '#EF4444', label: 'Critical' },
  success: { icon: CheckCircle2, color: '#10B981', label: 'Success' },
};

const ACTION_TYPES = Array.from(new Set(MOCK_LOGS.map(l => l.action)));

export function AuditLogs() {
  const { isDark, palette } = useTheme();
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#161D2A' : '#F8FAFC';
  const hoverBg = isDark ? '#1E2A38' : '#F8FAFC';

  const filtered = MOCK_LOGS.filter(log => {
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchSev = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchResult = filterResult === 'all' || log.result === filterResult;
    return matchSearch && matchSev && matchAction && matchResult;
  });

  const critCount = MOCK_LOGS.filter(l => l.severity === 'critical').length;
  const warnCount = MOCK_LOGS.filter(l => l.severity === 'warning').length;

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: 'Inter, sans-serif', background: isDark ? '#080D13' : '#F1F5F9', minHeight: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: textPrimary, letterSpacing: '-0.02em' }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: 13, color: text, marginTop: 2 }}>
            Organization activity log — RailCorp Inc.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
          style={{ background: cardBg, border: `1px solid ${border}`, color: text, fontSize: 13, cursor: 'pointer' }}
        >
          <Download size={14} /> Export Logs
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: 'Total Events', count: MOCK_LOGS.length, color: text },
          { label: 'Critical', count: critCount, color: '#EF4444' },
          { label: 'Warnings', count: warnCount, color: '#F59E0B' },
          { label: 'Failed Actions', count: MOCK_LOGS.filter(l => l.result === 'failed').length, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: bg, border: `1px solid ${border}` }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: text }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-52" style={{ background: bg, border: `1px solid ${border}` }}>
          <Search size={14} style={{ color: text }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action or details..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: textPrimary, flex: 1 }}
          />
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          style={{ background: bg, border: `1px solid ${border}`, color: text, borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">All Actions</option>
          {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {['all', 'info', 'warning', 'critical', 'success'].map(s => (
          <button
            key={s}
            onClick={() => setFilterSeverity(s)}
            className="rounded-lg px-3 py-2 transition-all"
            style={{
              fontSize: 12,
              background: filterSeverity === s ? (SEV_CONFIG[s as keyof typeof SEV_CONFIG]?.color || palette.primary) + '18' : bg,
              border: `1px solid ${filterSeverity === s ? (SEV_CONFIG[s as keyof typeof SEV_CONFIG]?.color || palette.primary) : border}`,
              color: filterSeverity === s ? (SEV_CONFIG[s as keyof typeof SEV_CONFIG]?.color || palette.primary) : text,
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {s === 'all' ? 'All Severity' : s}
          </button>
        ))}
        <select
          value={filterResult}
          onChange={e => setFilterResult(e.target.value)}
          style={{ background: bg, border: `1px solid ${border}`, color: text, borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">All Results</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              {['', 'Timestamp', 'User', 'Action', 'Resource', 'Status', 'Result', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
              const sc = SEV_CONFIG[log.severity];
              const SevIcon = sc.icon;
              const isExpanded = expanded === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    style={{ borderBottom: `1px solid ${border}30`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                  >
                    <td style={{ padding: '10px 14px', width: 32 }}>
                      <SevIcon size={13} style={{ color: sc.color }} />
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: text, whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{log.user}</div>
                      <div style={{ fontSize: 10, color: text }}>{log.userRole}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="rounded px-2 py-0.5" style={{ fontSize: 11, fontFamily: 'monospace', background: isDark ? '#0A1118' : '#F1F5F9', color: isDark ? '#06B6D4' : '#0891B2' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, color: textPrimary }}>{log.resource}</div>
                      <div style={{ fontSize: 10, color: text }}>{log.resourceId}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="rounded px-2 py-0.5" style={{ fontSize: 10, fontWeight: 500, background: sc.color + '18', color: sc.color, textTransform: 'capitalize' }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="rounded-full px-2 py-0.5" style={{ fontSize: 10, fontWeight: 600, background: log.result === 'success' ? '#10B98118' : '#EF444418', color: log.result === 'success' ? '#10B981' : '#EF4444', textTransform: 'capitalize' }}>
                        {log.result}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <ChevronDown size={13} style={{ color: text, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} style={{ padding: '0 14px 10px 50px', background: isDark ? '#0A1118' : '#F8FAFC' }}>
                        <div style={{ fontSize: 12, color: text, paddingTop: 6 }}>
                          <span style={{ color: text, marginRight: 6 }}>Details:</span>
                          <span style={{ color: textPrimary }}>{log.details}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span style={{ fontSize: 11, color: text }}>IP: <span style={{ fontFamily: 'monospace', color: textPrimary }}>{log.ipAddress}</span></span>
                          <span style={{ fontSize: 11, color: text }}>Log ID: <span style={{ fontFamily: 'monospace', color: textPrimary }}>{log.id}</span></span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: text, fontSize: 13 }}>No logs match your filters</div>
        )}
      </div>

      <div style={{ fontSize: 11, color: text }}>
        Showing {filtered.length} of {MOCK_LOGS.length} entries · Logs retained for 90 days · Organization scope only
      </div>
    </div>
  );
}
