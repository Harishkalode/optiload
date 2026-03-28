import { Outlet, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../constants/roles';
import { Toaster } from 'sonner';

export function SuperAdminLayout() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== ROLES.SUPER_ADMIN) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== ROLES.SUPER_ADMIN) return null;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif', background: '#060A0F' }}
    >
      <SuperAdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6"
          style={{
            height: 56,
            background: '#080C12',
            borderBottom: '1px solid #162032',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }}
            />
            <span style={{ fontSize: '12px', color: '#64748B', letterSpacing: '0.05em' }}>
              SYSTEM OPERATIONAL
            </span>
            <span style={{ fontSize: '11px', color: '#162032' }}>|</span>
            <span style={{ fontSize: '12px', color: '#4B5563' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              OptiLoad Platform Control Center
            </span>
            <div
              className="flex items-center gap-1.5 rounded px-2 py-1"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}
            >
              <span style={{ fontSize: '11px', color: '#06B6D4', fontWeight: 600 }}>SA</span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>{user?.name}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto" style={{ background: '#060A0F' }}>
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '13px', background: '#0D1520', border: '1px solid #162032', color: '#E2E8F0' } }}
      />
    </div>
  );
}
