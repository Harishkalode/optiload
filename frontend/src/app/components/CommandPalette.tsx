import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, LayoutGrid, Box, Truck, Package, BarChart3,
  Users, Settings, Clock, Zap,
  Keyboard, Sun, Moon, Monitor, CornerDownLeft
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface PaletteItem {
  id: string;
  label: string;
  category: 'page' | 'action' | 'job' | 'vehicle' | 'load' | 'theme';
  icon: React.FC<any>;
  description?: string;
  path?: string;
  action?: () => void;
  shortcut?: string;
  tags?: string[];
}

const RECENT_SEARCHES = ['OPT-2891', 'Flatcar Alpha-7', 'Steel Coil'];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isDark, palette, setColorMode } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const bg = isDark ? '#0A1018' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const tx = isDark ? '#94A3B8' : '#64748B';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const selBg = isDark ? '#162030' : '#EFF6FF';

  const items: PaletteItem[] = useMemo(() => {
    const base: PaletteItem[] = [
      // Pages
      { id: 'nav-dashboard', label: 'Dashboard', category: 'page', icon: LayoutGrid, description: 'Executive overview', path: '/', shortcut: 'G D', tags: ['home', 'overview', 'kpi'] },
      { id: 'nav-jobs', label: 'Optimization Jobs', category: 'page', icon: Box, description: 'Create & manage optimization runs', path: '/jobs', shortcut: 'G J', tags: ['optimization', 'runs'] },
      { id: 'nav-vehicles', label: 'Vehicles', category: 'page', icon: Truck, description: 'Fleet management', path: '/vehicles', shortcut: 'G V', tags: ['fleet', 'railcar', 'flatcar'] },
      { id: 'nav-loads', label: 'Loads', category: 'page', icon: Package, description: 'Load management', path: '/loads', shortcut: 'G L', tags: ['cargo', 'freight'] },
      { id: 'nav-reports', label: 'Reports', category: 'page', icon: BarChart3, description: 'Analytics & reporting', path: '/reports', shortcut: 'G R', tags: ['analytics', 'charts'] },
      { id: 'nav-users', label: 'Users', category: 'page', icon: Users, description: 'User management', path: '/users/management', tags: ['team', 'accounts', 'roles'] },
      { id: 'nav-roles', label: 'Roles & Permissions', category: 'page', icon: Users, description: 'Role and permission management', path: '/users/roles', tags: ['roles', 'permissions', 'access'] },
      { id: 'nav-audit', label: 'Audit Logs', category: 'page', icon: Users, description: 'Organization audit log', path: '/users/audit', tags: ['audit', 'log', 'activity'] },
      { id: 'nav-settings', label: 'Settings', category: 'page', icon: Settings, description: 'System configuration', path: '/settings', shortcut: 'G S', tags: ['preferences', 'config'] },

      // Actions
      { id: 'act-new-job', label: 'New Optimization Job', category: 'action', icon: Zap, description: 'Start a new load optimization', path: '/jobs/new', tags: ['create', 'new', 'optimize'] },
      { id: 'act-new-vehicle', label: 'Add Vehicle', category: 'action', icon: Truck, description: 'Register new railcar', path: '/vehicles/new', tags: ['create', 'add', 'fleet'] },
      { id: 'act-new-load', label: 'Add Load', category: 'action', icon: Package, description: 'Register new cargo load', path: '/loads/new', tags: ['create', 'add', 'cargo'] },
      { id: 'act-shortcuts', label: 'Keyboard Shortcuts', category: 'action', icon: Keyboard, description: 'View all keyboard shortcuts', shortcut: '?', tags: ['help', 'keys', 'hotkeys'] },

      // Theme
      { id: 'theme-light', label: 'Switch to Light Mode', category: 'theme', icon: Sun, description: 'Light color scheme', tags: ['theme', 'appearance', 'mode'] },
      { id: 'theme-dark', label: 'Switch to Dark Mode', category: 'theme', icon: Moon, description: 'Dark color scheme', tags: ['theme', 'appearance', 'mode'] },
      { id: 'theme-auto', label: 'Switch to Auto Mode', category: 'theme', icon: Monitor, description: 'Follow system preference', tags: ['theme', 'appearance', 'system'] },

      // Mock jobs
      { id: 'job-2891', label: 'OPT-2891', category: 'job', icon: Box, description: 'Completed · 91.2% · S. Kumar', path: '/jobs/results', tags: ['optimization', 'completed'] },
      { id: 'job-2890', label: 'OPT-2890', category: 'job', icon: Box, description: 'Processing · 87.5% · J. Doe', path: '/jobs/processing', tags: ['optimization', 'processing'] },
      { id: 'job-2889', label: 'OPT-2889', category: 'job', icon: Box, description: 'Warning · 74.3% · M. Torres', path: '/jobs/results', tags: ['optimization', 'warning'] },

      // Mock vehicles
      { id: 'veh-001', label: 'V-001 — Flatcar Alpha-7', category: 'vehicle', icon: Truck, description: 'Flatcar · 20.0×3.2×1.8m · 80,000 kg', path: '/vehicles', tags: ['flatcar', 'alpha'] },
      { id: 'veh-002', label: 'V-002 — Boxcar Bravo-12', category: 'vehicle', icon: Truck, description: 'Boxcar · 15.0×2.8×3.2m · 65,000 kg', path: '/vehicles', tags: ['boxcar', 'bravo'] },
      { id: 'veh-004', label: 'V-004 — Hopper Echo-9', category: 'vehicle', icon: Truck, description: 'Hopper · 18.5×3.0×3.6m · 100,000 kg', path: '/vehicles', tags: ['hopper', 'echo'] },

      // Mock loads
      { id: 'load-0441', label: 'L-0441 — Steel Coil Batch A', category: 'load', icon: Package, description: '12,400 kg · Priority 8 · SteelCorp', path: '/loads', tags: ['steel', 'coil', 'heavy'] },
      { id: 'load-0443', label: 'L-0443 — Grain Bulk Unit', category: 'load', icon: Package, description: '24,000 kg · Priority 9 · AgroTrans', path: '/loads', tags: ['grain', 'bulk', 'heavy'] },
      { id: 'load-0446', label: 'L-0446 — Machinery Crate', category: 'load', icon: Package, description: '18,000 kg · Priority 10 · HeavyMach', path: '/loads', tags: ['machinery', 'crate', 'heavy'] },
    ];

    return base;
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 10);
    const q = query.toLowerCase();
    return items
      .filter(item => {
        const searchable = [item.label, item.description, item.category, ...(item.tags || [])].join(' ').toLowerCase();
        return searchable.includes(q);
      })
      .slice(0, 12);
  }, [query, items]);

  const grouped = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {};
    filtered.forEach(item => {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filtered]);

  const flatList = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const execute = useCallback((item: PaletteItem) => {
    if (item.id === 'theme-light') { setColorMode('light'); onClose(); return; }
    if (item.id === 'theme-dark') { setColorMode('dark'); onClose(); return; }
    if (item.id === 'theme-auto') { setColorMode('auto'); onClose(); return; }
    if (item.id === 'act-shortcuts') {
      onClose();
      // Dispatch a custom event to open keyboard shortcuts
      window.dispatchEvent(new CustomEvent('open-shortcuts'));
      return;
    }
    if (item.path) { navigate(item.path); onClose(); return; }
    if (item.action) { item.action(); onClose(); }
  }, [navigate, onClose, setColorMode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatList[selectedIdx]) {
      e.preventDefault();
      execute(flatList[selectedIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [flatList, selectedIdx, execute, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const CATEGORY_LABELS: Record<string, string> = {
    page: 'Pages',
    action: 'Quick Actions',
    job: 'Optimization Jobs',
    vehicle: 'Vehicles',
    load: 'Loads',
    theme: 'Theme',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative rounded-xl overflow-hidden"
            style={{
              width: 600, maxWidth: '92vw', maxHeight: '60vh',
              background: bg, border: `1px solid ${border}`,
              boxShadow: '0 24px 72px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4" style={{ borderBottom: `1px solid ${border}`, height: 54 }}>
              <Search size={16} style={{ color: tx, flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, jobs, vehicles, actions..."
                className="flex-1 bg-transparent outline-none"
                style={{ color: txP, fontSize: 14, fontFamily: 'Inter, sans-serif' }}
              />
              <div className="flex items-center gap-1.5">
                <kbd style={{
                  fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                  padding: '2px 6px', borderRadius: 4,
                  background: isDark ? '#1E2A38' : '#E2E8F0',
                  color: tx, border: `1px solid ${border}`,
                }}>ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-2" style={{ maxHeight: 'calc(60vh - 54px - 40px)' }}>
              {!query.trim() && (
                <div className="px-4 py-2 mb-1">
                  <div style={{ fontSize: 10, color: tx, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Recent</div>
                  <div className="flex gap-2 mt-2">
                    {RECENT_SEARCHES.map(s => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
                        style={{ fontSize: 11, color: tx, background: isDark ? '#111B27' : '#F1F5F9', border: `1px solid ${border}`, fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        <Clock size={10} />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(grouped).map(([cat, catItems]) => (
                <div key={cat}>
                  <div className="px-4 pt-2 pb-1">
                    <div style={{ fontSize: 10, color: tx, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      {CATEGORY_LABELS[cat] || cat}
                    </div>
                  </div>
                  {catItems.map(item => {
                    const globalIdx = flatList.indexOf(item);
                    const isSelected = globalIdx === selectedIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        data-idx={globalIdx}
                        onClick={() => execute(item)}
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{
                          background: isSelected ? selBg : 'transparent',
                          borderLeft: isSelected ? `2px solid ${palette.primary}` : '2px solid transparent',
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-md flex-shrink-0"
                          style={{
                            width: 32, height: 32,
                            background: isSelected ? `${palette.primary}20` : (isDark ? '#111B27' : '#F1F5F9'),
                          }}
                        >
                          <Icon size={14} style={{ color: isSelected ? palette.primary : tx }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 13, fontWeight: 500, color: txP }}>{item.label}</div>
                          {item.description && (
                            <div style={{ fontSize: 11, color: tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.shortcut && (
                            <div className="flex items-center gap-0.5">
                              {item.shortcut.split(' ').map((k, i) => (
                                <kbd
                                  key={i}
                                  style={{
                                    fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                                    padding: '1px 5px', borderRadius: 3,
                                    background: isDark ? '#1E2A38' : '#E2E8F0',
                                    color: tx, border: `1px solid ${border}`,
                                    minWidth: 18, textAlign: 'center',
                                  }}
                                >{k}</kbd>
                              ))}
                            </div>
                          )}
                          {isSelected && <CornerDownLeft size={11} style={{ color: palette.primary }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {flatList.length === 0 && (
                <div className="text-center py-12">
                  <Search size={32} style={{ color: isDark ? '#1E2A38' : '#E2E8F0', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 13, color: tx }}>No results for "{query}"</div>
                  <div style={{ fontSize: 11, color: isDark ? '#374151' : '#CBD5E1', marginTop: 4 }}>Try searching for pages, jobs, or vehicles</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 flex-shrink-0" style={{ height: 40, borderTop: `1px solid ${border}`, background: isDark ? '#060C14' : '#F8FAFC' }}>
              <div className="flex items-center gap-3" style={{ fontSize: 10, color: tx, fontFamily: 'Inter, sans-serif' }}>
                <span className="flex items-center gap-1">
                  <kbd style={{ fontSize: 9, padding: '0 4px', borderRadius: 2, background: isDark ? '#1E2A38' : '#E2E8F0', border: `1px solid ${border}`, fontFamily: 'JetBrains Mono, monospace' }}>↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd style={{ fontSize: 9, padding: '0 4px', borderRadius: 2, background: isDark ? '#1E2A38' : '#E2E8F0', border: `1px solid ${border}`, fontFamily: 'JetBrains Mono, monospace' }}>↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd style={{ fontSize: 9, padding: '0 4px', borderRadius: 2, background: isDark ? '#1E2A38' : '#E2E8F0', border: `1px solid ${border}`, fontFamily: 'JetBrains Mono, monospace' }}>esc</kbd>
                  Close
                </span>
              </div>
              <div style={{ fontSize: 10, color: tx }}>
                {flatList.length} result{flatList.length !== 1 ? 's' : ''}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}