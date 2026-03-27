import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ColorMode = 'light' | 'dark' | 'auto';
export type PaletteName = 'industrial-blue' | 'safety-orange' | 'graphite-teal' | 'steel-purple' | 'rail-red';

export interface ColorPalette {
  name: PaletteName;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  warning: string;
  success: string;
  error: string;
}

export const PALETTES: ColorPalette[] = [
  {
    name: 'industrial-blue',
    label: 'Industrial Blue',
    primary: '#1565C0',
    secondary: '#0288D1',
    accent: '#00B0FF',
    highlight: '#1976D2',
    warning: '#F57C00',
    success: '#2E7D32',
    error: '#C62828',
  },
  {
    name: 'safety-orange',
    label: 'Safety Orange',
    primary: '#E65100',
    secondary: '#FF6D00',
    accent: '#FFD600',
    highlight: '#F4511E',
    warning: '#F57C00',
    success: '#2E7D32',
    error: '#C62828',
  },
  {
    name: 'graphite-teal',
    label: 'Graphite Teal',
    primary: '#00695C',
    secondary: '#00897B',
    accent: '#1DE9B6',
    highlight: '#00796B',
    warning: '#F57C00',
    success: '#2E7D32',
    error: '#C62828',
  },
  {
    name: 'steel-purple',
    label: 'Steel Purple',
    primary: '#4527A0',
    secondary: '#5E35B1',
    accent: '#7C4DFF',
    highlight: '#512DA8',
    warning: '#F57C00',
    success: '#2E7D32',
    error: '#C62828',
  },
  {
    name: 'rail-red',
    label: 'Rail Red',
    primary: '#B71C1C',
    secondary: '#C62828',
    accent: '#FF1744',
    highlight: '#D32F2F',
    warning: '#F57C00',
    success: '#2E7D32',
    error: '#B71C1C',
  },
];

interface ThemeContextValue {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  palette: ColorPalette;
  setPalette: (name: PaletteName) => void;
  isDark: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  selectionHighlight: string;
  setSelectionHighlight: (c: string) => void;
  tableRowHighlight: string;
  setTableRowHighlight: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>('auto');
  const [paletteName, setPaletteName] = useState<PaletteName>('industrial-blue');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectionHighlight, setSelectionHighlight] = useState('#1976D2');
  const [tableRowHighlight, setTableRowHighlight] = useState('#1565C020');

  const palette = PALETTES.find(p => p.name === paletteName)!;

  const isDark = colorMode === 'dark' || (colorMode === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ol-primary', palette.primary);
    root.style.setProperty('--ol-secondary', palette.secondary);
    root.style.setProperty('--ol-accent', palette.accent);
    root.style.setProperty('--ol-highlight', palette.highlight);
    root.style.setProperty('--ol-warning', palette.warning);
    root.style.setProperty('--ol-success', palette.success);
    root.style.setProperty('--ol-error', palette.error);
    root.style.setProperty('--ol-selection', selectionHighlight);
    root.style.setProperty('--ol-table-row', tableRowHighlight);
  }, [palette, selectionHighlight, tableRowHighlight]);

  const handleSetPalette = useCallback((name: PaletteName) => {
    setPaletteName(name);
    const p = PALETTES.find(x => x.name === name)!;
    setSelectionHighlight(p.highlight);
    setTableRowHighlight(p.primary + '20');
  }, []);

  return (
    <ThemeContext.Provider value={{
      colorMode,
      setColorMode,
      palette,
      setPalette: handleSetPalette,
      isDark,
      sidebarCollapsed,
      setSidebarCollapsed,
      mobileMenuOpen,
      setMobileMenuOpen,
      selectionHighlight,
      setSelectionHighlight,
      tableRowHighlight,
      setTableRowHighlight,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}