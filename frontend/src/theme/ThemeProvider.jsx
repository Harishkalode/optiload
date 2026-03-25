import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { neutralDark, neutralLight } from './tokens'
import { palettes } from './palettes'

const ThemeContext = createContext(null)

const semanticFor = (neutral, mode) => ({
  backgroundPrimary: neutral[900],
  backgroundSecondary: neutral[800],
  surface: neutral[700],
  border: neutral[600],
  textPrimary: mode === 'dark' ? '#FFFFFF' : '#0F1115',
  textSecondary: neutral[300],
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
})

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark')
  const [paletteKey, setPaletteKey] = useState('industrialBlue')
  const [overrideHighlight, setOverrideHighlight] = useState('')

  useEffect(() => {
    const actualMode = mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode

    const neutral = actualMode === 'dark' ? neutralDark : neutralLight
    const semantic = semanticFor(neutral, actualMode)
    const palette = palettes[paletteKey]
    const highlight = overrideHighlight || palette.highlight

    const root = document.documentElement
    Object.entries(neutral).forEach(([k, v]) => root.style.setProperty(`--neutral-${k}`, v))
    Object.entries(semantic).forEach(([k, v]) => root.style.setProperty(`--semantic-${k}`, v))
    root.style.setProperty('--color-primary', palette.primary)
    root.style.setProperty('--color-accent', palette.accent)
    root.style.setProperty('--color-highlight', highlight)
    root.setAttribute('data-theme', actualMode)
  }, [mode, paletteKey, overrideHighlight])

  const value = useMemo(() => ({
    mode,
    setMode,
    paletteKey,
    setPaletteKey,
    overrideHighlight,
    setOverrideHighlight,
    palettes
  }), [mode, paletteKey, overrideHighlight])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
