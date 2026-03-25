import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { modeTokens, palettes } from '../design/theme'

const ThemeContext = createContext(null)

const defaultCustom = {
  selection: '#2D5BFF',
  tableRow: '#1B2A4A',
  object3d: '#2D5BFF',
  sidebarActive: '#2D5BFF'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark')
  const [paletteKey, setPaletteKey] = useState('industrialBlue')
  const [custom, setCustom] = useState(defaultCustom)

  useEffect(() => {
    const actual = mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode
    const palette = palettes[paletteKey]
    const tokens = modeTokens[actual]
    const root = document.documentElement

    const merged = {
      ...tokens,
      ...palette,
      selection: custom.selection,
      tableRow: custom.tableRow,
      object3d: custom.object3d,
      sidebarActive: custom.sidebarActive
    }

    Object.entries(merged).forEach(([k, v]) => root.style.setProperty(`--${k}`, v))
    root.setAttribute('data-theme', actual)
  }, [mode, paletteKey, custom])

  const value = useMemo(() => ({
    mode,
    setMode,
    paletteKey,
    setPaletteKey,
    custom,
    setCustom,
    resetCustom: () => setCustom(defaultCustom),
    palettes
  }), [mode, paletteKey, custom])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
