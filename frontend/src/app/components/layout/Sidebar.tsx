import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutGrid, Box, Truck, Package, BarChart3,
  Users, Settings, ChevronLeft, ChevronRight, ChevronDown,
  Building2, LogOut, Zap, Shield, ScrollText, UserCog
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, type RoleValue } from '../../constants/roles';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  children?: { label: string; path: string; icon: any }[];
  roles?: RoleValue[];
}

const ADMIN_NAV: NavItem[] = [
  { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: Box, label: 'Optimization Jobs', path: '/jobs' },
  { icon: Truck, label: 'Vehicles', path: '/vehicles' },
  { icon: Package, label: 'Loads', path: '/loads' },
  {
    icon: Users, label: 'Users', path: '/users',
    roles: [ROLES.ADMIN, ROLES.SUB_ADMIN],
    children: [
      { label: 'User Management', path: '/users/management', icon: UserCog },
      { label: 'Roles & Permissions', path: '/users/roles', icon: Shield },
      { label: 'Audit Logs', path: '/users/audit', icon: ScrollText },
    ]
  },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// For lower-privilege roles: show subset
const BASIC_NAV: NavItem[] = [
  { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: Box, label: 'Optimization Jobs', path: '/jobs' },
  { icon: Truck, label: 'Vehicles', path: '/vehicles' },
  { icon: Package, label: 'Loads', path: '/loads' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUB_ADMIN];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, palette, isDark, mobileMenuOpen, setMobileMenuOpen } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orgOpen, setOrgOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ '/users': true });

  const bg = isDark ? '#0D1117' : '#F8FAFC';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textActive = isDark ? '#F1F5F9' : '#0F172A';
  const hoverBg = isDark ? '#161D2A' : '#EFF6FF';
  const activeBg = isDark ? '#1E2A3A' : '#DBEAFE';
  const subBg = isDark ? '#0A1118' : '#F0F4F8';

  const isAdminLevel = !!user && ADMIN_ROLES.includes(user.role);
  const navItems = isAdminLevel ? ADMIN_NAV : BASIC_NAV;

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  const sidebarClass = `flex flex-col h-full transition-all duration-300 fixed inset-y-0 left-0 z-40 lg:relative lg:z-0 ${
    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
  }`;

  const toggleGroup = (path: string) => {
    setExpandedGroups(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div
        className={sidebarClass}
        style={{
          width: sidebarCollapsed ? '64px' : '240px',
          background: bg,
          borderRight: `1px solid ${border}`,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: `1px solid ${border}`, minHeight: '72px' }}>
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 36, height: 36, background: palette.primary }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="12" width="16" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="4" y="8" width="12" height="3" rx="1.5" fill="white" opacity="0.7"/>
              <rect x="6" y="4" width="8" height="3" rx="1.5" fill="white" opacity="0.5"/>
              <circle cx="5" cy="16.5" r="1.5" fill="white"/>
              <circle cx="15" cy="16.5" r="1.5" fill="white"/>
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', color: textActive, letterSpacing: '-0.02em' }}>
                OptiLoad
              </div>
              <div style={{ fontSize: '10px', color: text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rail Logistics</div>
            </div>
          )}
        </div>

        {/* Role badge */}
        {!sidebarCollapsed && user && (
          <div className="mx-3 mt-3 rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: isDark ? '#0A1118' : '#EFF6FF', border: `1px solid ${border}` }}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: palette.accent }} />
            <span style={{ fontSize: '10px', color: text, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
              {user.role}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(item => {
            const { icon: Icon, label, path, children } = item;
            const hasChildren = children && children.length > 0;
            const isGroupActive = hasChildren
              ? children.some(c => location.pathname.startsWith(c.path)) || location.pathname === path
              : location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            const isExpanded = expandedGroups[path];

            return (
              <div key={path} className="px-2 mb-0.5">
                {/* Main nav item */}
                <div className="relative">
                  {isGroupActive && (
                    <div
                      className="absolute left-0 top-1 bottom-1 rounded-r-sm"
                      style={{ width: 3, background: palette.accent }}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (hasChildren && !sidebarCollapsed) {
                        toggleGroup(path);
                      } else {
                        navigate(path);
                      }
                    }}
                    title={sidebarCollapsed ? label : undefined}
                    className="w-full flex items-center gap-3 rounded-lg transition-all duration-150 group"
                    style={{
                      padding: sidebarCollapsed ? '10px 0' : '10px 12px',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      background: isGroupActive ? activeBg : 'transparent',
                      color: isGroupActive ? palette.primary : text,
                    }}
                    onMouseEnter={e => {
                      if (!isGroupActive) {
                        (e.currentTarget as HTMLElement).style.background = hoverBg;
                        (e.currentTarget as HTMLElement).style.color = textActive;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isGroupActive) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = text;
                      }
                    }}
                  >
                    <Icon size={18} style={{ flexShrink: 0, color: isGroupActive ? palette.primary : 'inherit' }} />
                    {!sidebarCollapsed && (
                      <>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: isGroupActive ? 600 : 400, flex: 1, textAlign: 'left' }}>
                          {label}
                        </span>
                        {hasChildren && (
                          <ChevronDown
                            size={13}
                            style={{
                              color: text,
                              transform: isExpanded ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s',
                            }}
                          />
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Sub-items */}
                {hasChildren && !sidebarCollapsed && isExpanded && (
                  <div className="mt-0.5 mb-1 ml-2 rounded-lg overflow-hidden" style={{ background: subBg, border: `1px solid ${border}` }}>
                    {children!.map(child => {
                      const isChildActive = location.pathname === child.path || location.pathname.startsWith(child.path);
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className="w-full flex items-center gap-2.5 transition-all duration-150"
                          style={{
                            padding: '8px 12px',
                            background: isChildActive ? activeBg : 'transparent',
                            color: isChildActive ? palette.primary : text,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: isChildActive ? 600 : 400,
                            textAlign: 'left',
                            borderBottom: `1px solid ${border}30`,
                          }}
                          onMouseEnter={e => {
                            if (!isChildActive) {
                              (e.currentTarget as HTMLElement).style.background = hoverBg;
                              (e.currentTarget as HTMLElement).style.color = textActive;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isChildActive) {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                              (e.currentTarget as HTMLElement).style.color = text;
                            }
                          }}
                        >
                          <child.icon size={13} />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom user/org section */}
        {!sidebarCollapsed && (
          <div style={{
            borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: border,
            padding: '12px', background: bg, marginTop: 'auto',
            boxShadow: isDark ? '0 -4px 12px rgba(0,0,0,0.3)' : '0 -4px 12px rgba(0,0,0,0.08)',
          }}>
            {user && (
              <div style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: isDark ? '#0D1117' : '#ffffff', border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: 24, height: 24, background: palette.primary, color: '#ffffff', fontSize: '10px', fontWeight: 600 }}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: textActive, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '9px', color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.role}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    void (async () => {
                      await logout();
                      navigate('/login');
                    })();
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '4px', fontSize: '11px', color: '#EF4444', border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={12} /> Logout
                </button>
              </div>
            )}

            <button
              onClick={() => setOrgOpen(!orgOpen)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', padding: '8px', background: hoverBg, border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', width: 28, height: 28, background: palette.secondary }}>
                <Building2 size={14} color="#ffffff" />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: textActive }}>{user?.organization || 'RailCorp Inc.'}</div>
                <div style={{ fontSize: '10px', color: text }}>Production</div>
              </div>
              <ChevronDown size={14} color={text} />
            </button>
            <div style={{ marginTop: '8px', paddingLeft: '4px', fontSize: '10px', color: text, letterSpacing: '0.05em' }}>v1.0.0</div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 hidden lg:flex items-center justify-center rounded-full border transition-colors z-10"
          style={{ width: 24, height: 24, background: isDark ? '#1E2A38' : '#ffffff', borderColor: border, color: text }}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>
    </div>
  );
}
