import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { apiRequest } from '../services/http';

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
  { name: 'industrial-blue', label: 'Industrial Blue', primary: '#1565C0', secondary: '#0288D1', accent: '#00B0FF', highlight: '#1976D2', warning: '#F57C00', success: '#2E7D32', error: '#C62828' },
  { name: 'safety-orange', label: 'Safety Orange', primary: '#E65100', secondary: '#FF6D00', accent: '#FFD600', highlight: '#F4511E', warning: '#F57C00', success: '#2E7D32', error: '#C62828' },
  { name: 'graphite-teal', label: 'Graphite Teal', primary: '#00695C', secondary: '#00897B', accent: '#1DE9B6', highlight: '#00796B', warning: '#F57C00', success: '#2E7D32', error: '#C62828' },
  { name: 'steel-purple', label: 'Steel Purple', primary: '#4527A0', secondary: '#5E35B1', accent: '#7C4DFF', highlight: '#512DA8', warning: '#F57C00', success: '#2E7D32', error: '#C62828' },
  { name: 'rail-red', label: 'Rail Red', primary: '#B71C1C', secondary: '#C62828', accent: '#FF1744', highlight: '#D32F2F', warning: '#F57C00', success: '#2E7D32', error: '#B71C1C' },
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
  compactMode: boolean;
  setCompactMode: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'optiload_theme';

interface StoredTheme {
  colorMode: ColorMode;
  palette: PaletteName;
  sidebarCollapsed: boolean;
  selectionHighlight: string;
  tableRowHighlight: string;
  compactMode: boolean;
}

function loadDefaults(): StoredTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { colorMode: 'auto', palette: 'industrial-blue', sidebarCollapsed: false, selectionHighlight: '#1976D2', tableRowHighlight: '#1565C020', compactMode: false };
}

function saveToLocalStorage(theme: StoredTheme) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)); } catch { /* ignore */ }
}

async function loadFromDB(): Promise<StoredTheme | null> {
  try {
    const data = await apiRequest('/users/me/preferences');
    return {
      colorMode: data.color_mode || 'auto',
      palette: data.palette || 'industrial-blue',
      sidebarCollapsed: data.sidebar_collapsed || false,
      selectionHighlight: data.selection_highlight || '#1976D2',
      tableRowHighlight: data.table_row_highlight || '#1565C020',
      compactMode: data.compact_mode || false,
    };
  } catch { return null; }
}

async function saveToDB(theme: StoredTheme) {
  try {
    await apiRequest('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        color_mode: theme.colorMode,
        palette: theme.palette,
        sidebar_collapsed: theme.sidebarCollapsed,
        selection_highlight: theme.selectionHighlight,
        table_row_highlight: theme.tableRowHighlight,
        compact_mode: theme.compactMode,
      }),
    });
  } catch { /* fallback to localStorage */ }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const defaults = loadDefaults();
  const [colorMode, setColorMode] = useState<ColorMode>(defaults.colorMode);
  const [paletteName, setPaletteName] = useState<PaletteName>(defaults.palette);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaults.sidebarCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectionHighlight, setSelectionHighlight] = useState(defaults.selectionHighlight);
  const [tableRowHighlight, setTableRowHighlight] = useState(defaults.tableRowHighlight);
  const [compactMode, setCompactMode] = useState(defaults.compactMode);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load from DB on mount
  useEffect(() => {
    loadFromDB().then(dbTheme => {
      if (dbTheme) {
        setColorMode(dbTheme.colorMode);
        setPaletteName(dbTheme.palette);
        setSidebarCollapsed(dbTheme.sidebarCollapsed);
        setSelectionHighlight(dbTheme.selectionHighlight);
        setTableRowHighlight(dbTheme.tableRowHighlight);
        setCompactMode(dbTheme.compactMode);
      }
      setLoaded(true);
    });
  }, []);

  // Debounced save to DB + localStorage
  const themeRef = useRef<StoredTheme>({ colorMode, palette: paletteName, sidebarCollapsed, selectionHighlight, tableRowHighlight, compactMode });
  useEffect(() => { themeRef.current = { colorMode, palette: paletteName, sidebarCollapsed, selectionHighlight, tableRowHighlight, compactMode }; }, [colorMode, paletteName, sidebarCollapsed, selectionHighlight, tableRowHighlight, compactMode]);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const t = themeRef.current;
      saveToLocalStorage(t);
      if (loaded) saveToDB(t);
    }, 500);
  }, [loaded]);

  // Apply dark mode class
  const isDark = colorMode === 'dark' || (colorMode === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Apply CSS custom properties
  const palette = PALETTES.find(p => p.name === paletteName)!;
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

  // System preference listener for auto mode
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = () => { if (colorMode === 'auto') setColorMode('auto'); }; // Force re-render
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [colorMode]);

  // Save on every change
  useEffect(() => { debouncedSave(); }, [colorMode, paletteName, sidebarCollapsed, selectionHighlight, tableRowHighlight, compactMode, debouncedSave]);

  const handleSetPalette = useCallback((name: PaletteName) => {
    setPaletteName(name);
    const p = PALETTES.find(x => x.name === name)!;
    setSelectionHighlight(p.highlight);
    setTableRowHighlight(p.primary + '20');
  }, []);

  return (
    <ThemeContext.Provider value={{
      colorMode, setColorMode, palette, setPalette: handleSetPalette, isDark,
      sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen,
      selectionHighlight, setSelectionHighlight, tableRowHighlight, setTableRowHighlight,
      compactMode, setCompactMode,
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
