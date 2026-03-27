import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, X, CheckCircle2, AlertTriangle, Info, XCircle,
  Truck, CheckCheck, Trash2, Settings, Clock
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  category: 'system' | 'job' | 'fleet' | 'alert';
  icon?: React.FC<any>;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n-1', type: 'success', title: 'Job OPT-2891 completed', message: 'Optimization finished with 91.2% efficiency. 10 loads placed on Flatcar Alpha-7.', time: '2 min ago', read: false, category: 'job', icon: CheckCircle2 },
  { id: 'n-2', type: 'warning', title: 'Axle overload warning', message: 'Axle 3 on V-001 at 98.2% capacity. Consider redistributing loads.', time: '14 min ago', read: false, category: 'alert', icon: AlertTriangle },
  { id: 'n-3', type: 'info', title: 'New vehicle registered', message: 'V-047 "Gondola Kilo-2" added to fleet by John D.', time: '32 min ago', read: false, category: 'fleet', icon: Truck },
  { id: 'n-4', type: 'error', title: 'Job OPT-2888 failed', message: 'Total weight exceeded car load limit. 3 loads need redistribution.', time: '1h ago', read: true, category: 'job', icon: XCircle },
  { id: 'n-5', type: 'success', title: 'Export completed', message: 'Q1 2026 performance report exported as PDF (12.4 MB).', time: '2h ago', read: true, category: 'system', icon: CheckCircle2 },
  { id: 'n-6', type: 'info', title: 'System maintenance', message: 'Scheduled maintenance window: Feb 20, 02:00-04:00 UTC.', time: '3h ago', read: true, category: 'system', icon: Settings },
  { id: 'n-7', type: 'warning', title: 'CG threshold approaching', message: 'Combined CG at 92.1" (94% of 98" limit) on active job OPT-2892.', time: '4h ago', read: true, category: 'alert', icon: AlertTriangle },
  { id: 'n-8', type: 'success', title: 'Template saved', message: '"Heavy Bulk Transport v2" saved by S. Kumar.', time: '5h ago', read: true, category: 'system', icon: CheckCircle2 },
];

type FilterTab = 'all' | 'unread' | 'job' | 'alert' | 'system';

export function NotificationCenter({ open, onClose, anchorRef }: {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}) {
  const { isDark, palette } = useTheme();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const bg = isDark ? '#0A1018' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const tx = isDark ? '#94A3B8' : '#64748B';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const hoverBg = isDark ? '#111B27' : '#F8FAFC';

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'job') return n.category === 'job';
    if (activeTab === 'alert') return n.category === 'alert';
    if (activeTab === 'system') return n.category === 'system' || n.category === 'fleet';
    return true;
  });

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const typeConfig: Record<string, { color: string; bgLight: string }> = {
    success: { color: '#10B981', bgLight: '#10B98110' },
    warning: { color: '#F59E0B', bgLight: '#F59E0B10' },
    error: { color: '#EF4444', bgLight: '#EF444410' },
    info: { color: '#3B82F6', bgLight: '#3B82F610' },
  };

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'job', label: 'Jobs' },
    { key: 'alert', label: 'Alerts' },
    { key: 'system', label: 'System' },
  ];

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
              top: 64, right: 160,
              width: 420, maxHeight: 'calc(100vh - 100px)',
              background: bg, border: `1px solid ${border}`,
              boxShadow: '0 16px 56px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 flex-shrink-0" style={{ height: 52, borderBottom: `1px solid ${border}` }}>
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: palette.primary }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: txP, fontFamily: 'Space Grotesk, sans-serif' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#fff',
                    background: palette.primary, borderRadius: 10,
                    padding: '1px 7px', fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
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

            {/* Filter tabs */}
            <div className="flex items-center gap-0.5 px-3 py-1.5 flex-shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors"
                  style={{
                    fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 500,
                    color: activeTab === tab.key ? palette.primary : tx,
                    background: activeTab === tab.key ? `${palette.primary}15` : 'transparent',
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span style={{
                      fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                      background: activeTab === tab.key ? `${palette.primary}25` : (isDark ? '#1E2A38' : '#E2E8F0'),
                      color: activeTab === tab.key ? palette.primary : tx,
                      padding: '0 4px', borderRadius: 4,
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${isDark ? '#1E2A38' : '#CBD5E1'} transparent` }}>
              {filtered.length > 0 ? filtered.map(n => {
                const cfg = typeConfig[n.type];
                const Icon = n.icon || Info;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className="group relative"
                    style={{ borderBottom: `1px solid ${isDark ? '#0F1824' : '#F8FAFC'}` }}
                  >
                    <div
                      onClick={() => markAsRead(n.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                      style={{ background: !n.read ? cfg.bgLight : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = !n.read ? cfg.bgLight : hoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = !n.read ? cfg.bgLight : 'transparent')}
                    >
                      {/* Unread dot */}
                      {!n.read && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: palette.primary,
                        }} />
                      )}

                      {/* Icon */}
                      <div
                        className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                        style={{ width: 32, height: 32, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}
                      >
                        <Icon size={14} style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span style={{
                            fontSize: 12, fontWeight: n.read ? 400 : 600, color: txP,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {n.title}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 11, color: tx, lineHeight: 1.45,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                        }}>
                          {n.message}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock size={9} style={{ color: isDark ? '#374151' : '#CBD5E1' }} />
                          <span style={{ fontSize: 10, color: isDark ? '#374151' : '#CBD5E1', fontFamily: 'JetBrains Mono, monospace' }}>{n.time}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 600,
                            color: cfg.color, background: `${cfg.color}15`,
                            padding: '0 5px', borderRadius: 3,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>
                            {n.category}
                          </span>
                        </div>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={e => { e.stopPropagation(); removeNotification(n.id); }}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-all flex-shrink-0"
                        style={{ width: 24, height: 24, color: tx, marginTop: 2 }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = isDark ? '#1E2A38' : '#E2E8F0')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Bell size={32} style={{ color: isDark ? '#1E2A38' : '#E2E8F0', marginBottom: 12 }} />
                  <div style={{ fontSize: 13, color: tx, fontWeight: 500 }}>
                    {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
                  </div>
                  <div style={{ fontSize: 11, color: isDark ? '#374151' : '#CBD5E1', marginTop: 4 }}>
                    {activeTab === 'unread' ? "You've read all notifications" : 'Nothing here yet'}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between px-4 flex-shrink-0" style={{ height: 40, borderTop: `1px solid ${border}`, background: isDark ? '#060C14' : '#F8FAFC' }}>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 transition-colors"
                  style={{ fontSize: 10, color: tx, fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = tx)}
                >
                  <Trash2 size={10} />
                  Clear all
                </button>
                <span style={{ fontSize: 10, color: isDark ? '#374151' : '#CBD5E1', fontFamily: 'JetBrains Mono, monospace' }}>
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}