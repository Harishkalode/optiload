import React, { createContext, useContext, useEffect, useState } from 'react';

interface DevModeContextValue {
  devMode: boolean;
  toggleDevMode: () => void;
  setDevMode: (value: boolean) => void;
}

const DevModeContext = createContext<DevModeContextValue>({
  devMode: false,
  toggleDevMode: () => {},
  setDevMode: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [devMode, setDevModeState] = useState(() => {
    try {
      return localStorage.getItem('optiload_devmode') === 'true';
    } catch {
      return false;
    }
  });

  const setDevMode = (value: boolean) => {
    setDevModeState(value);
    try {
      localStorage.setItem('optiload_devmode', String(value));
    } catch {
      // ignore
    }
  };

  const toggleDevMode = () => setDevMode(!devMode);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDevMode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [devMode]);

  return <DevModeContext.Provider value={{ devMode, toggleDevMode, setDevMode }}>{children}</DevModeContext.Provider>;
}

export const useDevMode = () => useContext(DevModeContext);
