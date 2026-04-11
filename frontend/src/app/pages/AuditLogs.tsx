import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollText, Download, Search, ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle2, XCircle, RefreshCw, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { fetchAuditLogs, type AuditLogRow } from '../services/domainApi';

const SEV_CONFIG = {
  info: { icon: Info, color: '#3B82F6', label: 'Info' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'Warning' },
  critical: { icon: XCircle, color: '#EF4444', label: 'Critical' },
  success: { icon: CheckCircle2, color: '#10B981', label: 'Success' },
};

const DATE_PRESETS = [
  { label: 'Last 24h', hours: 24 },
  { label: 'Last 7 days', hours: 168 },
  { label: 'Last 30 days', hours: 720 },
  { label: 'Custom', hours: 0 },
];

function guessSeverity(action: string): keyof typeof SEV_CONFIG {
  const a = action.toLowerCase();
  if (a.includes('fail') || a.includes('delete')) return 'warning';
  if (a.includes('error') || a.includes('denied')) return 'critical';
  if (a.includes('create') || a.includes('success')) return 'success';
  return 'info';
}

type SortKey = 'timestamp' | 'user_id' | 'action' | 'resource';
type SortDir = 'asc' | 'desc';

export function AuditLogs() {
  const { isDark } = useTheme();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUserId, setFilterUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [datePreset, setDatePreset] = useState('');

  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#161D2A' : '#F8FAFC';
  const hoverBg = isDark ? '#1E2A38' : '#F8FAFC';

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setLoadError(null);
    try {
      const data = await fetchAuditLogs({
        user_id: filterUserId || undefined,
        action: filterAction === 'all' ? undefined : filterAction,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      });
      const arr = Array.isArray(data) ? data : (data as any).items ?? [];
      const t = (data as any).total ?? arr.length;
      setRows(arr);
      setTotal(t);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load audit logs');
      setRows([]);
      setTotal(0);
    } finally {
      if (!silent) setLoading(false); else setRefreshing(false);
    }
  }, [filterAction, filterUserId, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const p = DATE_PRESETS.find(d => d.label === preset);
    if (!p || p.hours === 0) return;
    const now = new Date();
    const from = new Date(now.getTime() - p.hours * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 16);
    setDateFrom(fmt(from));
    setDateTo(fmt(now));
  };

  const actionTypes = useMemo(() => Array.from(new Set(rows.map(r => r.action))).sort(), [rows]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = rows.filter(r => {
      if (!q) return true;
      return (
        String(r.user_id).includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.resource.toLowerCase().includes(q) ||
        (r.resource_id && r.resource_id.toLowerCase().includes(q))
      );
    });
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'timestamp') cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      else if (sortKey === 'user_id') cmp = a.user_id - b.user_id;
      else if (sortKey === 'action') cmp = a.action.localeCompare(b.action);
      else if (sortKey === 'resource') cmp = a.resource.localeCompare(b.resource);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [rows, search, sortKey, sortDir, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil((search ? sortedFiltered.length : total) / pageSize));

  const critCount = rows.filter(r => guessSeverity(r.action) === 'critical').length;
  const warnCount = rows.filter(r => guessSeverity(r.action) === 'warning').length;

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return <ChevronDown size={12} style={{ color: text, opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} style={{ color: textPrimary }} /> : <ChevronDown size={12} style={{ color: textPrimary }} />;
  };

  if (loadError && !loading && rows.length === 0) {
    return (
      <div className="p-6" style={{ fontFamily: 'Inter, sans-serif', background: isDark ? '#080D13' : '#F1F5F9', minHeight: '100%' }}>
        <div className="rounded-xl p-6" style={{ background: bg, border: `1px solid ${border}` }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: textPrimary }}>Audit Logs</h1>
          <p className="mt-2" style={{ color: '#EF4444', fontSize: 14 }}>{loadError}</p>
          <p className="mt-2" style={{ color: text, fontSize: 13 }}>Requires permission <code>audit.read</code> (GET /audit-logs).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: 'Inter, sans-serif', background: isDark ? '#080D13' : '#F1F5F9', minHeight: '100%' }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: textPrimary, letterSpacing: '-0.02em' }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: text, marginTop: 2 }}>Organization scope · GET /audit-logs</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
          style={{ background: cardBg, border: `1px solid ${border}`, color: text, fontSize: 13, cursor: 'pointer' }}
          onClick={() => void load(false)}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: 'Events', count: total, color: text },
          { label: 'Critical', count: critCount, color: '#EF4444' },
          { label: 'Warnings', count: warnCount, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: bg, border: `1px solid ${border}` }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: text }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Date presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar size={14} style={{ color: text }} />
        {DATE_PRESETS.map(p => (
          <button key={p.label} onClick={() => handleDatePreset(p.label)}
            className="rounded-md px-3 py-1.5 text-xs transition-colors"
            style={{
              background: datePreset === p.label ? (isDark ? '#1E2A38' : '#E2E8F0') : 'transparent',
              border: `1px solid ${datePreset === p.label ? (isDark ? '#334155' : '#CBD5E1') : border}`,
              color: datePreset === p.label ? textPrimary : text,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-52" style={{ background: bg, border: `1px solid ${border}` }}>
          <Search size={14} style={{ color: text }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter client-side: user id, action, resource…"
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: textPrimary, flex: 1 }} />
        </div>
        <input type="number" placeholder="User ID" value={filterUserId} onChange={e => setFilterUserId(e.target.value)}
          style={{ background: bg, border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, padding: '8px 12px', fontSize: 12, width: 120 }} />
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          style={{ background: bg, border: `1px solid ${border}`, color: text, borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <div>
            <label style={{ fontSize: 10, color: text, display: 'block', marginBottom: 2 }}>From</label>
            <input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ background: bg, border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, padding: '6px 8px', fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: text, display: 'block', marginBottom: 2 }}>To</label>
            <input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ background: bg, border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, padding: '6px 8px', fontSize: 12 }} />
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: text }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {[
                  { key: '' as SortKey, label: '' },
                  { key: 'timestamp', label: 'Timestamp' },
                  { key: 'user_id', label: 'User' },
                  { key: 'action', label: 'Action' },
                  { key: 'resource', label: 'Resource' },
                  { key: '' as SortKey, label: 'Severity' },
                  { key: '' as SortKey, label: 'IP' },
                  { key: '' as SortKey, label: '' },
                ].map(({ key, label }, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: key ? 'pointer' : 'default' }}
                    onClick={() => key && handleSort(key)}>
                    <span className="flex items-center gap-1">{label}{key && <SortIcon colKey={key} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map(log => {
                const sev = guessSeverity(log.action);
                const sc = SEV_CONFIG[sev];
                const SevIcon = sc.icon;
                const isExpanded = expanded === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr style={{ borderBottom: `1px solid ${border}30`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setExpanded(isExpanded ? null : log.id)}>
                      <td style={{ padding: '10px 14px', width: 32 }}><SevIcon size={13} style={{ color: sc.color }} /></td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: text, whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>User #{log.user_id}</div>
                        <div style={{ fontSize: 10, color: text }}>Org {log.organization_id ?? '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="rounded px-2 py-0.5" style={{ fontSize: 11, fontFamily: 'monospace', background: isDark ? '#0A1118' : '#F1F5F9', color: isDark ? '#06B6D4' : '#0891B2' }}>{log.action}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12, color: textPrimary }}>{log.resource}</div>
                        <div style={{ fontSize: 10, color: text }}>{log.resource_id}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="rounded px-2 py-0.5" style={{ fontSize: 10, fontWeight: 500, background: sc.color + '18', color: sc.color, textTransform: 'capitalize' }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: text, fontFamily: 'monospace' }}>{log.ip_address ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <ChevronDown size={13} style={{ color: text, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: '0 14px 10px 50px', background: isDark ? '#0A1118' : '#F8FAFC' }}>
                          <div style={{ fontSize: 12, color: textPrimary, paddingTop: 6 }}>
                            <pre style={{ margin: 0, fontSize: 11, overflow: 'auto' }}>{JSON.stringify(log.metadata_json, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && sortedFiltered.length === 0 && (
          <div className="text-center py-12" style={{ color: text, fontSize: 13 }}>No logs match your filters</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
          <span style={{ fontSize: '12px', color: text }}>
            Showing {sortedFiltered.length} of {total} events · Page {page} of {totalPages}
          </span>
          <div className="flex gap-1 items-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ fontSize: '12px', background: 'transparent', color: page === 1 ? text : textPrimary, opacity: page === 1 ? 0.4 : 1 }}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ fontSize: '12px', background: p === page ? '#3B82F6' : 'transparent', color: p === page ? '#fff' : text }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ fontSize: '12px', background: 'transparent', color: page === totalPages ? text : textPrimary, opacity: page === totalPages ? 0.4 : 1 }}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}
