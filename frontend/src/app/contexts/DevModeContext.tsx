import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevModeContextValue {
  devMode: boolean;
  toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextValue>({ devMode: false, toggleDevMode: () => {} });

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [devMode, setDevMode] = useState(() => {
    try { return localStorage.getItem('optiload_devmode') === 'true'; } catch { return false; }
  });

  const toggleDevMode = () => setDevMode(v => {
    const next = !v;
    try { localStorage.setItem('optiload_devmode', String(next)); } catch {}
    return next;
  });

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); toggleDevMode(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <DevModeContext.Provider value={{ devMode, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
