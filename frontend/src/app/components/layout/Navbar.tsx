import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Bell, Moon, Sun, Monitor, ChevronDown, Search,
  User, Building2, Key, LogOut, ChevronRight, Settings, Keyboard, Menu, X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BREADCRUMBS: Record<string, string[]> = {
  '/': ['Dashboard'],
  '/jobs': ['Optimization', 'Jobs'],
  '/jobs/new': ['Optimization', 'Jobs', 'New Job'],
  '/jobs/processing': ['Optimization', 'Jobs', 'Processing'],
  '/jobs/results': ['Optimization', 'Jobs', 'Results'],
  '/vehicles': ['Fleet', 'Vehicles'],
  '/vehicles/new': ['Fleet', 'Vehicles', 'Add Vehicle'],
  '/loads': ['Operations', 'Loads'],
  '/loads/new': ['Operations', 'Loads', 'Add Load'],
  '/reports': ['Analytics', 'Reports'],
  '/users': ['Admin', 'Users'],
  '/users/management': ['Admin', 'Users', 'Management'],
  '/users/roles': ['Admin', 'Users', 'Roles & Permissions'],
  '/users/audit': ['Admin', 'Users', 'Audit Logs'],
  '/settings': ['Admin', 'Settings'],
};

const PAGE_TITLES: Record<string, string> = {
  '/': 'Executive Dashboard',
  '/jobs': 'Optimization Jobs',
  '/jobs/new': 'New Optimization Job',
  '/jobs/processing': 'Processing Job',
  '/jobs/results': 'Optimization Results',
  '/vehicles': 'Vehicle Fleet',
  '/vehicles/new': 'Add Vehicle',
  '/loads': 'Load Management',
  '/loads/new': 'Add Load',
  '/reports': 'Reports & Analytics',
  '/users': 'User Management',
  '/users/management': 'User Management',
  '/users/roles': 'Roles & Permissions',
  '/users/audit': 'Audit Logs',
  '/settings': 'Settings',
};

interface NavbarProps {
  onOpenCommandPalette?: () => void;
  onToggleNotifications?: () => void;
  notificationCount?: number;
}

export function Navbar({ onOpenCommandPalette, onToggleNotifications, notificationCount = 0 }: NavbarProps) {
  const { colorMode, setColorMode, isDark, palette, mobileMenuOpen, setMobileMenuOpen } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [env, setEnv] = useState<'Production' | 'Testing'>('Production');

  const profileRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (envOpen && envRef.current && !envRef.current.contains(e.target as Node)) {
        setEnvOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen, envOpen]);

  const crumbs = BREADCRUMBS[location.pathname] || ['Dashboard'];
  const title = PAGE_TITLES[location.pathname] || 'OptiLoad';

  const bg = isDark ? '#0D1117' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const inputBg = isDark ? '#161D2A' : '#F1F5F9';

  const cycleModes = () => {
    const modes: typeof colorMode[] = ['light', 'dark', 'auto'];
    const idx = modes.indexOf(colorMode);
    setColorMode(modes[(idx + 1) % 3]);
  };

  return (
    <div
      className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 relative z-20"
      style={{
        height: '72px',
        background: bg,
        borderBottom: `1px solid ${border}`,
        boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.04)' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden flex items-center justify-center rounded-lg transition-colors"
        style={{ width: 36, height: 36, background: 'transparent', color: text }}
        onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#161D2A' : '#F1F5F9')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Left: Breadcrumb + Title */}
      <div className="flex flex-col justify-center min-w-0 flex-shrink-0">
        <div className="hidden md:flex items-center gap-1" style={{ fontSize: '11px', color: text }}>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} />}
              <span style={{ color: i === crumbs.length - 1 ? palette.accent : text }}>{c}</span>
            </span>
          ))}
        </div>
        <div className="truncate" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px sm:16px', color: textPrimary, letterSpacing: '-0.01em' }}>
          {title}
        </div>
      </div>

      {/* Center: Search — opens Command Palette */}
      <div className="hidden md:flex flex-1 justify-center max-w-lg mx-auto">
        <button
          onClick={onOpenCommandPalette}
          className="relative w-full text-left group"
          style={{ maxWidth: '420px' }}
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: text }} />
          <div
            className="w-full pl-9 pr-16 py-2 rounded-lg transition-all"
            style={{
              background: inputBg,
              border: `1px solid ${border}`,
              color: text,
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = palette.primary)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
          >
            Search jobs, vehicles, loads...
          </div>
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded px-1.5 py-0.5"
            style={{ background: isDark ? '#1E2A38' : '#E2E8F0', fontSize: '10px', color: text, fontFamily: 'JetBrains Mono, monospace' }}
          >
            ⌘K
          </div>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notifications */}
        <button
          onClick={onToggleNotifications}
          className="relative flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 36, height: 36, background: 'transparent', color: text }}
          onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#161D2A' : '#F1F5F9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span
              className="absolute top-1 right-1 flex items-center justify-center rounded-full text-white"
              style={{ width: 14, height: 14, background: '#EF4444', fontSize: '9px', fontWeight: 700 }}
            >
              {notificationCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleModes}
          className="hidden sm:flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 36, height: 36, background: 'transparent', color: text }}
          onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#161D2A' : '#F1F5F9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title={`Mode: ${colorMode}`}
        >
          {colorMode === 'light' ? <Sun size={18} /> : colorMode === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
        </button>

        {/* Keyboard shortcuts */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-shortcuts'))}
          className="hidden md:flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 36, height: 36, background: 'transparent', color: text }}
          onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#161D2A' : '#F1F5F9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={18} />
        </button>

        {/* Environment */}
        <div className="hidden lg:block relative" ref={envRef}>
          <button
            onClick={() => setEnvOpen(!envOpen)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
            style={{
              background: env === 'Production' ? palette.primary + '20' : '#F59E0B20',
              border: `1px solid ${env === 'Production' ? palette.primary + '40' : '#F59E0B40'}`,
              color: env === 'Production' ? palette.accent : '#F59E0B',
              fontSize: '12px', fontWeight: 500,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: env === 'Production' ? '#22C55E' : '#F59E0B' }} />
            {env}
            <ChevronDown size={12} />
          </button>
          {envOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50"
              style={{ background: isDark ? '#1E2A38' : '#ffffff', border: `1px solid ${border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', minWidth: '120px' }}
            >
              {(['Production', 'Testing'] as const).map(e => (
                <button
                  key={e}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                  style={{ fontSize: '12px', color: textPrimary }}
                  onClick={() => { setEnv(e); setEnvOpen(false); }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = isDark ? '#161D2A' : '#F1F5F9')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: e === 'Production' ? '#22C55E' : '#F59E0B' }} />
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg px-1 sm:px-2 py-1.5 transition-colors"
            style={{ background: profileOpen ? (isDark ? '#161D2A' : '#F1F5F9') : 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#161D2A' : '#F1F5F9')}
            onMouseLeave={e => !profileOpen && (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="flex items-center justify-center rounded-full text-white"
              style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`, fontSize: '12px', fontWeight: 700 }}
            >
              JD
            </div>
            <div className="hidden sm:block text-left">
              <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>John Doe</div>
              <div style={{ fontSize: '10px', color: text }}>Admin</div>
            </div>
            <ChevronDown size={12} style={{ color: text }} className="hidden sm:block" />
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50"
              style={{ background: isDark ? '#1E2A38' : '#ffffff', border: `1px solid ${border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.25)', minWidth: '180px' }}
            >
              <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>John Doe</div>
                <div style={{ fontSize: '11px', color: text }}>john@railcorp.com</div>
              </div>
              {[
                { icon: User, label: 'My Account' },
                { icon: Building2, label: 'Organization' },
                { icon: Key, label: 'API Keys' },
                { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setProfileOpen(false); } },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{ fontSize: '12px', color: textPrimary }}
                  onClick={action}
                  onMouseEnter={ev => (ev.currentTarget.style.background = isDark ? '#161D2A' : '#F8FAFC')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={14} style={{ color: text }} />
                  {label}
                </button>
              ))}
              <div style={{ borderTop: `1px solid ${border}`, marginTop: 2 }}>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{ fontSize: '12px', color: '#EF4444' }}
                  onClick={() => navigate('/login')}
                  onMouseEnter={ev => (ev.currentTarget.style.background = '#EF444410')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}