import React, { useState, useEffect, useMemo } from 'react';
import { fetchAuditLogs, fetchOrganizations, type AuditLogRow } from '../../services/domainApi';
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

function mapApi(l: AuditLogRow, orgNames: Map<number, string>): Log {
  const a = l.action.toLowerCase();
  let severity: Log['severity'] = 'info';
  if (a.includes('fail') || a.includes('error') || a.includes('denied')) severity = 'critical';
  else if (a.includes('delete') || a.includes('warn')) severity = 'warning';
  else if (a.includes('create') || a.includes('success')) severity = 'success';
  const result: Log['result'] = a.includes('fail') ? 'failed' : 'success';
  const org = l.organization_id != null ? orgNames.get(l.organization_id) ?? `Org ${l.organization_id}` : 'Platform';
  return {
    id: String(l.id),
    timestamp: new Date(l.timestamp).toLocaleString(),
    user: `User ${l.user_id}`,
    org,
    action: l.action,
    resource: l.resource,
    ip: l.ip_address ?? '—',
    severity,
    result,
    details: JSON.stringify(l.metadata_json ?? {}),
  };
}

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

export function GlobalAuditLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterSev, setFilterSev] = useState('all');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const [rows, orgs] = await Promise.all([fetchAuditLogs({}), fetchOrganizations()]);
        if (c) return;
        const names = new Map(orgs.map(o => [o.id, o.name]));
        setLogs(rows.map(r => mapApi(r, names)));
      } catch (e) {
        if (!c) setLoadErr(e instanceof Error ? e.message : 'Failed to load');
        if (!c) setLogs([]);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const ORGS = useMemo(() => Array.from(new Set(logs.map(l => l.org))).sort(), [logs]);

  const filtered = logs.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.org.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchSev = filterSev === 'all' || l.severity === filterSev;
    const matchOrg = filterOrg === 'all' || l.org === filterOrg;
    const matchResult = filterResult === 'all' || l.result === filterResult;
    return matchSearch && matchSev && matchOrg && matchResult;
  });

  const criticalCount = logs.filter(l => l.severity === 'critical').length;
  const warningCount = logs.filter(l => l.severity === 'warning').length;
  const failedCount = logs.filter(l => l.result === 'failed').length;

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      {loadErr && (
        <div className="rounded-lg px-4 py-3" style={{ background: SA.red + '12', border: `1px solid ${SA.red}40`, color: SA.red, fontSize: 13 }}>
          {loadErr} (requires audit.read)
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
            Global Audit Logs
          </h1>
          <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>
            {loading ? 'Loading…' : `GET /audit-logs (super_admin) — ${logs.length} events loaded`}
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
          { label: 'Total Events', count: logs.length, color: SA.text },
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
        {loading && <div className="py-12 text-center text-sm" style={{ color: SA.text }}>Loading…</div>}
        {!loading && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${SA.border}` }}>
              {['', 'Timestamp', 'User / Org', 'Action', 'Resource', 'IP Address', 'Result', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: SA.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => {
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
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: SA.text, fontSize: 13 }}>No logs match your filters</div>
        )}
      </div>

      <div style={{ fontSize: 11, color: SA.textMuted }}>
        Showing {filtered.length} of {logs.length} log entries
      </div>
    </div>
  );
}
