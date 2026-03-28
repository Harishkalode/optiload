import { useEffect, useState } from 'react';

import { useDevMode } from '../../contexts/DevModeContext';

export function DevModeHeader() {
  const { devMode, setDevMode } = useDevMode();
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const syncPath = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', syncPath);
    window.addEventListener('hashchange', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('hashchange', syncPath);
    };
  }, []);

  const isDevRoute = pathname.startsWith('/dev/');

  useEffect(() => {
    if (!isDevRoute) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDevMode(false);
        window.location.assign('/dashboard');
      }
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isDevRoute, setDevMode]);

  if (!isDevRoute) return null;

  const envLabel = import.meta.env.MODE?.toUpperCase() ?? 'DEV';

  return (
    <div className="fixed top-0 left-0 right-0 z-[99998] bg-[#0B1220] border-b border-cyan-900/60 text-slate-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3 text-sm">
        <button className="hover:text-cyan-300" onClick={() => window.location.assign('/dashboard')}>
          ← Back to Application
        </button>
        <button className="hover:text-cyan-300" onClick={() => window.location.assign('/dashboard')}>
          Go to Dashboard
        </button>
        <span className="text-xs px-2 py-0.5 rounded border border-cyan-600/60 text-cyan-300">{envLabel}</span>
      </div>
      <span className="text-xs text-slate-400">ESC to exit Dev Mode {devMode ? '(active)' : ''}</span>
    </div>
  );
}
