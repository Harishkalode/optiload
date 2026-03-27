import React, { useState } from 'react';
import {
  ScrollText, Download, Search, Filter, Calendar,
  AlertTriangle, Info, CheckCircle2, XCircle, Shield,
  ChevronDown, Building2
} from 'lucide-react';
import { motion } from 'motion/react';

const SA = {
  bg: '#060A0F', card: '#0D1520', cardAlt: '#0A1018', border: '#162032',
  text: '#64748B', textPrimary: '#E2E8F0', textMuted: '#475569',
  cyan: '#06B6D4', blue: '#3B82F6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

interface Log {
  id: string;
  timestamp: string;
  user: string;
  org: string;
  action: string;
  resource: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  result: 'success' | 'failed';
  details: string;
}

const LOGS: Log[] = [
  { id: 'AL-001', timestamp: '2026-03-27 14:23:15', user: 'Sarah Mitchell', org: 'RailCorp Inc.', action: 'user.created', resource: 'User', ip: '192.168.1.45', severity: 'info', result: 'success', details: 'Created new user: Thomas Wright' },
  { id: 'AL-002', timestamp: '2026-03-27 14:15:42', user: 'Unknown', org: 'System', action: 'auth.brute_force', resource: 'Auth', ip: '185.45.72.3', severity: 'critical', result: 'failed', details: 'Brute force attempt blocked — 15 failed logins in 2 minutes' },
  { id: 'AL-003', timestamp: '2026-03-27 13:58:21', user: 'Ana Patel', org: 'FreightCo Global', action: 'optimization.run', resource: 'Optimization', ip: '10.0.1.73', severity: 'info', result: 'success', details: 'Ran optimization job OPT-2941' },
  { id: 'AL-004', timestamp: '2026-03-27 13:45:09', user: 'James Chen', org: 'LogiTrans Partners', action: 'vehicle.deleted', resource: 'Vehicle', ip: '10.0.1.52', severity: 'warning', result: 'success', details: 'Deleted vehicle: Flatcar #248' },
  { id: 'AL-005', timestamp: '2026-03-27 13:32:54', user: 'System', org: 'Platform', action: 'system.backup', resource: 'Database', ip: '127.0.0.1', severity: 'info', result: 'success', details: 'Automated database backup completed — 421 GB' },
  { id: 'AL-006', timestamp: '2026-03-27 12:18:33', user: 'Emily Watson', org: 'National Rail Authority', action: 'role.modified', resource: 'Role', ip: '10.0.1.88', severity: 'warning', result: 'success', details: 'Modified permissions for role: Rail Planner' },
  { id: 'AL-007', timestamp: '2026-03-27 11:47:12', user: 'Mark Torres', org: 'Coastal Logistics', action: 'org.suspended', resource: 'Organization', ip: '10.0.0.1', severity: 'critical', result: 'success', details: 'Organization suspended by Super Admin: billing failure' },
  { id: 'AL-008', timestamp: '2026-03-27 11:22:45', user: 'Robert Kim', org: 'MidWest Rail', action: 'api_key.created', resource: 'API Key', ip: '10.0.1.54', severity: 'info', result: 'success', details: 'Created new API key: prod-integration' },
  { id: 'AL-009', timestamp: '2026-03-27 10:58:27', user: 'David Park', org: 'RailCorp Inc.', action: 'load.bulk_import', resource: 'Load', ip: '10.0.1.73', severity: 'info', result: 'success', details: 'Imported 312 loads from CSV' },
  { id: 'AL-010', timestamp: '2026-03-27 10:15:03', user: 'Unknown', org: 'FreightCo Global', action: 'auth.failed', resource: 'Auth', ip: '203.45.78.122', severity: 'critical', result: 'failed', details: 'Failed login attempt for: admin@freightco.com' },
  { id: 'AL-011', timestamp: '2026-03-27 09:42:18', user: 'System', org: 'Platform', action: 'worker.autoscale', resource: 'Infrastructure', ip: '127.0.0.1', severity: 'info', result: 'success', details: 'Worker pool auto-scaled from 4 to 8 instances' },
  { id: 'AL-012', timestamp: '2026-03-27 09:12:55', user: 'Sandra White', org: 'FreightCo Global', action: 'compliance.export', resource: 'Report', ip: '10.0.1.88', severity: 'info', result: 'success', details: 'Exported AAR compliance report for job OPT-2940' },
  { id: 'AL-013', timestamp: '2026-03-27 08:45:00', user: 'Super Admin', org: 'Platform', action: 'feature.toggled', resource: 'Feature Flag', ip: '10.0.0.1', severity: 'warning', result: 'success', details: 'Disabled Simulation Mode for: Alpine Freight' },
  { id: 'AL-014', timestamp: '2026-03-27 08:12:30', user: 'Lisa Anderson', org: 'Alpine Freight', action: 'user.role_changed', resource: 'User', ip: '10.0.1.92', severity: 'warning', result: 'success', details: 'Role changed for Jennifer Lee: Viewer → Sub-Admin' },
];

const SEV_ICON: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  critical: XCircle,
  success: CheckCircle2,
};

const SEV_COLOR: Record<string, string> = {
  info: SA.blue,
  warning: SA.amber,
  critical: SA.red,
  success: SA.green,
};

const ORGS = Array.from(new Set(LOGS.map(l => l.org)));
const ACTIONS = Array.from(new Set(LOGS.map(l => l.action)));

export function GlobalAuditLogs() {
  const [search, setSearch] = useState('');
  const [filterSev, setFilterSev] = useState('all');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = LOGS.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.org.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchSev = filterSev === 'all' || l.severity === filterSev;
    const matchOrg = filterOrg === 'all' || l.org === filterOrg;
    const matchResult = filterResult === 'all' || l.result === filterResult;
    return matchSearch && matchSev && matchOrg && matchResult;
  });

  const criticalCount = LOGS.filter(l => l.severity === 'critical').length;
  const warningCount = LOGS.filter(l => l.severity === 'warning').length;
  const failedCount = LOGS.filter(l => l.result === 'failed').length;

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
            Global Audit Logs
          </h1>
          <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>
            All platform activity — {LOGS.length} events today across all organizations
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
          style={{ background: SA.cyan + '15', border: `1px solid ${SA.cyan}30`, color: SA.cyan, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <Download size={14} /> Export Logs
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3">
        {[
          { label: 'Critical Events', count: criticalCount, color: SA.red },
          { label: 'Warnings', count: warningCount, color: SA.amber },
          { label: 'Failed Actions', count: failedCount, color: SA.red },
          { label: 'Total Events', count: LOGS.length, color: SA.text },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 11, color: SA.text }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-56" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
          <Search size={14} style={{ color: SA.text }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action, org or detail..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: SA.textPrimary, flex: 1 }}
          />
        </div>
        <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)} style={{ background: SA.card, border: `1px solid ${SA.border}`, color: SA.text, borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Organizations</option>
          {ORGS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {['all', 'info', 'warning', 'critical', 'success'].map(s => (
          <button
            key={s}
            onClick={() => setFilterSev(s)}
            className="rounded-lg px-3 py-1.5 transition-all"
            style={{
              fontSize: 12,
              background: filterSev === s ? (SEV_COLOR[s] || SA.blue) + '20' : SA.card,
              border: `1px solid ${filterSev === s ? (SEV_COLOR[s] || SA.blue) : SA.border}`,
              color: filterSev === s ? (SEV_COLOR[s] || SA.blue) : SA.text,
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {s === 'all' ? 'All Severity' : s}
          </button>
        ))}
        <select value={filterResult} onChange={e => setFilterResult(e.target.value)} style={{ background: SA.card, border: `1px solid ${SA.border}`, color: SA.text, borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Results</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${SA.border}` }}>
              {['', 'Timestamp', 'User / Org', 'Action', 'Resource', 'IP Address', 'Result', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SA.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
              const SevIcon = SEV_ICON[log.severity];
              const isExpanded = expanded === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    style={{ borderBottom: `1px solid ${SA.border}25`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = SA.cardAlt)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                  >
                    <td style={{ padding: '10px 14px', width: 32 }}>
                      <SevIcon size={13} style={{ color: SEV_COLOR[log.severity] }} />
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: SA.text, whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: SA.textPrimary }}>{log.user}</div>
                      <div className="flex items-center gap-1" style={{ fontSize: 10, color: SA.text }}>
                        <Building2 size={9} /> {log.org}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="rounded px-2 py-0.5" style={{ fontSize: 11, fontFamily: 'monospace', background: SA.cardAlt, color: SA.cyan }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: SA.textPrimary }}>{log.resource}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: SA.text }}>{log.ip}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="rounded-full px-2 py-0.5" style={{ fontSize: 10, fontWeight: 600, background: log.result === 'success' ? SA.green + '18' : SA.red + '18', color: log.result === 'success' ? SA.green : SA.red, textTransform: 'capitalize' }}>
                        {log.result}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <ChevronDown size={13} style={{ color: SA.text, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} style={{ padding: '0 14px 10px 50px', background: SA.cardAlt }}>
                        <div style={{ fontSize: 12, color: SA.text, paddingTop: 6 }}>
                          <span style={{ color: SA.textMuted, marginRight: 6 }}>Details:</span>
                          <span style={{ color: SA.textPrimary }}>{log.details}</span>
                        </div>
                        <div style={{ fontSize: 11, color: SA.textMuted, marginTop: 2 }}>Log ID: {log.id}</div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: SA.text, fontSize: 13 }}>No logs match your filters</div>
        )}
      </div>

      <div style={{ fontSize: 11, color: SA.textMuted }}>
        Showing {filtered.length} of {LOGS.length} log entries · Logs retained for 90 days
      </div>
    </div>
  );
}
