import { useMemo, useState } from 'react'
import AppShell from './app/layout/AppShell'
import AuthPage from './app/auth/AuthPage'
import DashboardPage from './app/dashboard/DashboardPage'
import VehiclesPage from './app/vehicles/VehiclesPage'
import LoadsPage from './app/loads/LoadsPage'
import OptimizationsPage from './app/optimizations/OptimizationsPage'
import TemplatesPage from './app/templates/TemplatesPage'
import ReportsPage from './app/reports/ReportsPage'
import UsersPage from './app/users/UsersPage'
import SettingsPage from './app/settings/SettingsPage'
import Modal from './components/ui/Modal'
import Button from './components/ui/Button'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'

function ThemeEngineModal({ open, onClose }) {
  const { mode, setMode, paletteKey, setPaletteKey, overrideHighlight, setOverrideHighlight, palettes } = useTheme()
  return (
    <Modal open={open} title='Theme Engine' onClose={onClose}>
      <div className='form-grid cols2'>
        <label>Mode<select value={mode} onChange={(e) => setMode(e.target.value)}><option value='light'>Light</option><option value='dark'>Dark</option><option value='auto'>Auto</option></select></label>
        <label>Palette<select value={paletteKey} onChange={(e) => setPaletteKey(e.target.value)}>{Object.keys(palettes).map((p) => <option key={p}>{p}</option>)}</select></label>
      </div>
      <label>Highlight override<div className='color-row'><input type='color' value={overrideHighlight || '#3B82F6'} onChange={(e) => setOverrideHighlight(e.target.value)} /><input value={overrideHighlight} onChange={(e) => setOverrideHighlight(e.target.value)} placeholder='#3B82F6' /></div></label>
      <div className='row-end'><Button variant='ghost' onClick={() => setOverrideHighlight('')}>Reset</Button><Button onClick={onClose}>Apply</Button></div>
    </Modal>
  )
}

function AppContent() {
  const [authed, setAuthed] = useState(false)
  const [active, setActive] = useState('Dashboard')
  const [themeOpen, setThemeOpen] = useState(false)

  const page = useMemo(() => {
    const map = {
      Dashboard: <DashboardPage />,
      'Optimization Jobs': <OptimizationsPage />,
      Vehicles: <VehiclesPage />,
      Loads: <LoadsPage />,
      Templates: <TemplatesPage />,
      Reports: <ReportsPage />,
      Users: <UsersPage />,
      Settings: <SettingsPage onThemeOpen={() => setThemeOpen(true)} />
    }
    return map[active] || <DashboardPage />
  }, [active])

  if (!authed) return <AuthPage onAuthenticated={() => setAuthed(true)} />

  return (
    <>
      <AppShell active={active} onSelect={setActive} onThemeOpen={() => setThemeOpen(true)}>
        {page}
      </AppShell>
      <ThemeEngineModal open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  )
}

export default function App() {
  return <ThemeProvider><AppContent /></ThemeProvider>
}
