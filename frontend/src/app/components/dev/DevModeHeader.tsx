import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useDevMode } from '../../contexts/DevModeContext';

export function DevModeHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { devMode, setDevMode } = useDevMode();

  const isDevRoute = location.pathname.startsWith('/dev/');

  useEffect(() => {
    if (!isDevRoute) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDevMode(false);
        navigate('/dashboard');
      }
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isDevRoute, navigate, setDevMode]);

  if (!isDevRoute) return null;

  const envLabel = import.meta.env.MODE?.toUpperCase() ?? 'DEV';

  return (
    <div className="fixed top-0 left-0 right-0 z-[99998] bg-[#0B1220] border-b border-cyan-900/60 text-slate-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3 text-sm">
        <button className="hover:text-cyan-300" onClick={() => navigate('/dashboard')}>
          ← Back to Application
        </button>
        <button className="hover:text-cyan-300" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
        <span className="text-xs px-2 py-0.5 rounded border border-cyan-600/60 text-cyan-300">{envLabel}</span>
      </div>
      <span className="text-xs text-slate-400">ESC to exit Dev Mode {devMode ? '(active)' : ''}</span>
    </div>
  );
}
