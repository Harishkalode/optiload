import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useTheme } from '../../contexts/ThemeContext';
import { Toaster } from 'sonner';
import { CommandPalette } from '../CommandPalette';
import { NotificationCenter } from '../NotificationCenter';
import { KeyboardShortcuts } from '../KeyboardShortcuts';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../constants/roles';

export function AppLayout() {
  const { isDark, setColorMode, sidebarCollapsed, setSidebarCollapsed } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Route guards
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role === ROLES.SUPER_ADMIN) {
      navigate('/super-admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const [notifRefreshKey, setNotifRefreshKey] = useState(0);
  const handleNotifClose = useCallback(() => setNotifRefreshKey(k => k + 1), []);

  // Track "G" key press for two-key navigation
  const [pendingG, setPendingG] = useState(false);
  const [pendingT, setPendingT] = useState(false);

  // Listen for custom event from command palette
  useEffect(() => {
    const handleOpenShortcuts = () => setShortcutsOpen(true);
    window.addEventListener('open-shortcuts', handleOpenShortcuts);
    return () => window.removeEventListener('open-shortcuts', handleOpenShortcuts);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // ⌘K / Ctrl+K — always active
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
        return;
      }

      // Don't process other shortcuts when typing in inputs
      if (isInput) return;

      // ? — Toggle keyboard shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(v => !v);
        return;
      }

      // N — Toggle notifications
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !cmdOpen && !shortcutsOpen) {
        setNotifOpen(v => !v);
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        if (cmdOpen) setCmdOpen(false);
        if (notifOpen) setNotifOpen(false);
        if (shortcutsOpen) setShortcutsOpen(false);
        setPendingG(false);
        setPendingT(false);
        return;
      }

      // Sidebar toggle
      if (e.key === '[') { setSidebarCollapsed(true); return; }
      if (e.key === ']') { setSidebarCollapsed(false); return; }

      // Theme shortcuts: T then L/D/A
      if (pendingT) {
        setPendingT(false);
        if (e.key === 'l') { setColorMode('light'); return; }
        if (e.key === 'd') { setColorMode('dark'); return; }
        if (e.key === 'a') { setColorMode('auto'); return; }
        return;
      }
      if (e.key === 't' && !e.metaKey && !e.ctrlKey && !cmdOpen && !shortcutsOpen) {
        setPendingT(true);
        setTimeout(() => setPendingT(false), 1500);
        return;
      }

      // Navigation shortcuts: G then D/J/V/L/R/S
      if (pendingG) {
        setPendingG(false);
        if (e.key === 'd') { navigate('/dashboard'); return; }
        if (e.key === 'j') { navigate('/jobs'); return; }
        if (e.key === 'v') { navigate('/vehicles'); return; }
        if (e.key === 'l') { navigate('/loads'); return; }
        if (e.key === 'r') { navigate('/reports'); return; }
        if (e.key === 's') { navigate('/settings'); return; }
        return;
      }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !cmdOpen && !shortcutsOpen) {
        setPendingG(true);
        setTimeout(() => setPendingG(false), 1500);
        return;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cmdOpen, notifOpen, shortcutsOpen, pendingG, pendingT, navigate, setColorMode, setSidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar - hidden on mobile by default, shown on desktop */}
      <div className="hidden lg:block bg-[#c0121200]">
        <Sidebar />
      </div>
      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          onOpenCommandPalette={() => setCmdOpen(true)}
          onToggleNotifications={() => setNotifOpen(v => !v)}
          notificationRefreshKey={notifRefreshKey}
        />
        <main className="flex-1 overflow-auto" style={{ background: isDark ? '#080D13' : '#F1F5F9' }}>
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        theme={isDark ? 'dark' : 'light'}
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          }
        }}
      />

      {/* Global overlays */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <NotificationCenter open={notifOpen} onClose={() => { setNotifOpen(false); handleNotifClose(); }} />
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}