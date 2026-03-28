import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Globe, Building2, Users, Activity, ScrollText, Zap,
  ToggleLeft, Settings, ChevronLeft, ChevronRight, LogOut,
  Shield, Radio
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SA_NAV = [
  { icon: Globe, label: 'Global Dashboard', path: '/super-admin/dashboard' },
  { icon: Building2, label: 'Organizations', path: '/super-admin/organizations' },
  { icon: Users, label: 'Users (Global)', path: '/super-admin/users' },
  { icon: Activity, label: 'System Monitoring', path: '/super-admin/monitoring' },
  { icon: ScrollText, label: 'Audit Logs', path: '/super-admin/audit' },
  { icon: Zap, label: 'API Usage', path: '/super-admin/api-usage' },
  { icon: ToggleLeft, label: 'Feature Control', path: '/super-admin/feature-control' },
  { icon: Settings, label: 'Settings', path: '/super-admin/settings' },
];

const SA_BG = '#080C12';
const SA_BORDER = '#162032';
const SA_TEXT = '#64748B';
const SA_TEXT_ACTIVE = '#E2E8F0';
const SA_HOVER = '#0D1520';
const SA_ACTIVE = '#0F1E2E';
const SA_ACCENT = '#06B6D4';

export function SuperAdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="flex flex-col h-full flex-shrink-0 relative transition-all duration-300"
      style={{
        width: collapsed ? 64 : 240,
        background: SA_BG,
        borderRight: `1px solid ${SA_BORDER}`,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ borderBottom: `1px solid ${SA_BORDER}`, minHeight: 72, paddingTop: 16, paddingBottom: 16 }}
      >
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0891B2, #06B6D4)', boxShadow: '0 0 12px rgba(6,182,212,0.4)' }}
        >
          <Shield size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: SA_TEXT_ACTIVE, letterSpacing: '-0.02em' }}>
              Super Admin
            </div>
            <div style={{ fontSize: '10px', color: SA_ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Radio size={8} style={{ color: '#10B981' }} /> Platform Control
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {!collapsed && (
          <div style={{ fontSize: '10px', color: SA_TEXT, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 16px 8px', marginTop: 4 }}>
            Control Center
          </div>
        )}
        {SA_NAV.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <div key={path} className="relative px-2 mb-0.5">
              {isActive && (
                <div
                  className="absolute left-0 top-1 bottom-1 rounded-r"
                  style={{ width: 3, background: SA_ACCENT }}
                />
              )}
              <button
                onClick={() => navigate(path)}
                title={collapsed ? label : undefined}
                className="w-full flex items-center gap-3 rounded-lg transition-all duration-150"
                style={{
                  padding: collapsed ? '10px 0' : '9px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? SA_ACTIVE : 'transparent',
                  color: isActive ? SA_ACCENT : SA_TEXT,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = SA_HOVER;
                    (e.currentTarget as HTMLElement).style.color = SA_TEXT_ACTIVE;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = SA_TEXT;
                  }
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: isActive ? 600 : 400 }}>
                    {label}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      {!collapsed && user && (
        <div style={{ borderTop: `1px solid ${SA_BORDER}`, padding: 12, background: SA_BG }}>
          <div
            className="rounded-lg p-2 mb-2"
            style={{ background: SA_HOVER, border: `1px solid ${SA_BORDER}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #0891B2, #06B6D4)', fontSize: '11px', fontWeight: 700, color: '#fff' }}
              >
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: SA_TEXT_ACTIVE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '10px', color: SA_ACCENT }}>Super Admin</div>
              </div>
            </div>
            <button
              onClick={() => {
                void (async () => {
                  await logout();
                  navigate('/login');
                })();
              }}
              className="w-full flex items-center justify-center gap-2 rounded py-1.5 transition-all"
              style={{ fontSize: '11px', color: '#EF4444', border: `1px solid ${SA_BORDER}`, background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={11} /> Logout
            </button>
          </div>
          <div style={{ fontSize: '10px', color: SA_TEXT, paddingLeft: 4 }}>v1.0.0 — Platform</div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex items-center justify-center rounded-full z-10 transition-colors"
        style={{ width: 24, height: 24, background: SA_BG, border: `1px solid ${SA_BORDER}`, color: SA_TEXT }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );
}
