import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, XCircle, Truck, CheckCheck, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../contexts/ThemeContext';
import { fetchNotifications, markNotificationRead, type NotificationRow } from '../services/domainApi';
import { formatRelativeTime } from '../lib/time';

type FilterTab = 'all' | 'unread';

function mapCategoryToType(category: string): 'success' | 'warning' | 'error' | 'info' {
  const c = category.toLowerCase();
  if (c.includes('success') || c.includes('complete')) return 'success';
  if (c.includes('warn')) return 'warning';
  if (c.includes('fail') || c.includes('error')) return 'error';
  return 'info';
}

function mapCategoryLabel(category: string): 'system' | 'job' | 'fleet' | 'alert' {
  const c = category.toLowerCase();
  if (c.includes('vehicle') || c.includes('fleet')) return 'fleet';
  if (c.includes('alert') || c.includes('warn')) return 'alert';
  if (c.includes('job') || c.includes('optim')) return 'job';
  return 'system';
}

export function NotificationCenter({ open, onClose, anchorRef }: { open: boolean; onClose: () => void; anchorRef?: React.RefObject<HTMLElement> }) {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const bg = isDark ? '#0A1018' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const tx = isDark ? '#94A3B8' : '#64748B';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const hoverBg = isDark ? '#111B27' : '#F8FAFC';

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchNotifications(activeTab === 'unread');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const visible = rows.filter(n => !hidden.has(n.id));
  const unreadCount = visible.filter(n => !n.read_at).length;

  const typeConfig: Record<string, { color: string; bgLight: string }> = {
    success: { color: '#10B981', bgLight: '#10B98110' },
    warning: { color: '#F59E0B', bgLight: '#F59E0B10' },
    error: { color: '#EF4444', bgLight: '#EF444410' },
    info: { color: '#3B82F6', bgLight: '#3B82F610' },
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setRows(prev => prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    const unread = rows.filter(n => !n.read_at);
    await Promise.all(unread.map(n => markNotificationRead(n.id).catch(() => undefined)));
    setRows(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  const removeLocal = (id: number) => {
    setHidden(h => new Set(h).add(id));
  };

  const clearHidden = () => setHidden(new Set());

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            className="absolute rounded-xl overflow-hidden"
            style={{
              top: 64,
              right: 160,
              width: 420,
              maxHeight: 'calc(100vh - 100px)',
              background: bg,
              border: `1px solid ${border}`,
              boxShadow: '0 16px 56px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="flex items-center justify-between px-4 flex-shrink-0" style={{ height: 52, borderBottom: `1px solid ${border}` }}>
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: palette.primary }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: txP, fontFamily: 'Space Grotesk, sans-serif' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      background: palette.primary,
                      borderRadius: 10,
                      padding: '1px 7px',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
                    style={{ fontSize: 10, color: palette.primary, fontFamily: 'Inter, sans-serif' }}
                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    title="Mark all as read"
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-md transition-colors"
                  style={{ width: 28, height: 28, color: tx }}
                  onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-0.5 px-3 py-1.5 flex-shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
              {(['all', 'unread'] as const).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors"
                  style={{
                    fontSize: 11,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    color: activeTab === key ? palette.primary : tx,
                    background: activeTab === key ? `${palette.primary}15` : 'transparent',
                  }}
                >
                  {key === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${isDark ? '#1E2A38' : '#CBD5E1'} transparent` }}>
              {loading && <div className="py-12 text-center text-sm" style={{ color: tx }}>Loading…</div>}
              {error && !loading && (
                <div className="py-8 px-4 text-center text-sm" style={{ color: '#EF4444' }}>
                  {error}
                </div>
              )}
              {!loading &&
                !error &&
                visible.map(n => {
                  const type = mapCategoryToType(n.category);
                  const cat = mapCategoryLabel(n.category);
                  const cfg = typeConfig[type];
                  const Icon = type === 'success' ? CheckCircle2 : type === 'warning' ? AlertTriangle : type === 'error' ? XCircle : cat === 'fleet' ? Truck : Info;
                  const read = !!n.read_at;
                  return (
                    <motion.div key={n.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="group relative" style={{ borderBottom: `1px solid ${isDark ? '#0F1824' : '#F8FAFC'}` }}>
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter') void markAsRead(n.id);
                        }}
                        onClick={() => {
                          void markAsRead(n.id);
                          if (n.link) navigate(n.link);
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                        style={{ background: !read ? cfg.bgLight : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = !read ? cfg.bgLight : hoverBg)}
                        onMouseLeave={e => (e.currentTarget.style.background = !read ? cfg.bgLight : 'transparent')}
                      >
                        {!read && (
                          <div
                            className="absolute left-1.5 top-1/2 -translate-y-1/2"
                            style={{ width: 6, height: 6, borderRadius: '50%', background: palette.primary }}
                          />
                        )}
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                          style={{ width: 32, height: 32, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}
                        >
                          <Icon size={14} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 12, fontWeight: read ? 400 : 600, color: txP, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                          <div
                            style={{
                              fontSize: 11,
                              color: tx,
                              lineHeight: 1.45,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as unknown as string,
                            }}
                          >
                            {n.body}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock size={9} style={{ color: isDark ? '#374151' : '#CBD5E1' }} />
                            <span style={{ fontSize: 10, color: isDark ? '#374151' : '#CBD5E1', fontFamily: 'JetBrains Mono, monospace' }}>{formatRelativeTime(n.created_at)}</span>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: cfg.color,
                                background: `${cfg.color}15`,
                                padding: '0 5px',
                                borderRadius: 3,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {cat}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            removeLocal(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-all flex-shrink-0"
                          style={{ width: 24, height: 24, color: tx, marginTop: 2 }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = isDark ? '#1E2A38' : '#E2E8F0')}
                          onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                          title="Hide"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              {!loading && !error && visible.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Bell size={32} style={{ color: isDark ? '#1E2A38' : '#E2E8F0', marginBottom: 12 }} />
                  <div style={{ fontSize: 13, color: tx, fontWeight: 500 }}>{activeTab === 'unread' ? 'All caught up!' : 'No notifications'}</div>
                  <div style={{ fontSize: 11, color: isDark ? '#374151' : '#CBD5E1', marginTop: 4 }}>GET /notifications</div>
                </div>
              )}
            </div>

            {visible.length > 0 && (
              <div className="flex items-center justify-between px-4 flex-shrink-0" style={{ height: 40, borderTop: `1px solid ${border}`, background: isDark ? '#060C14' : '#F8FAFC' }}>
                <button
                  type="button"
                  onClick={() => clearHidden()}
                  className="flex items-center gap-1 transition-colors"
                  style={{ fontSize: 10, color: tx, fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget.style.color = palette.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = tx)}
                >
                  <Trash2 size={10} />
                  Reset hidden
                </button>
                <span style={{ fontSize: 10, color: isDark ? '#374151' : '#CBD5E1', fontFamily: 'JetBrains Mono, monospace' }}>
                  {visible.length} shown
                </span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
