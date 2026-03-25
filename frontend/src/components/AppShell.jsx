import { useState } from 'react'

const navItems = [
  ['grid', 'Dashboard'],
  ['cube', 'Optimization Jobs'],
  ['truck', 'Vehicles'],
  ['boxes', 'Loads'],
  ['layers', 'Templates'],
  ['chart', 'Reports'],
  ['users', 'Users'],
  ['gear', 'Settings']
]

const iconMap = {
  grid: '▦', cube: '⬢', truck: '⛟', boxes: '▤', layers: '⧉', chart: '▥', users: '👥', gear: '⚙'
}

export default function AppShell({ active, onChange, headerTitle, children, onOpenTheme }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="shell">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div>
          <div className="logo">
            <div className="symbol">⟗</div>
            {!collapsed && <div><strong>OptiLoad</strong><small>Rail Optimization OS</small></div>}
          </div>
          <nav>
            {navItems.map(([k, label]) => (
              <button key={label} className={`nav-btn ${active === label ? 'active' : ''}`} onClick={() => onChange(label)} title={collapsed ? label : ''}>
                <span>{iconMap[k]}</span>{!collapsed && label}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-foot">
          {!collapsed && <select className="org-switch"><option>Demo Rail Ops</option><option>North Corridor Freight</option></select>}
          {!collapsed && <small>v1.0.0</small>}
          <button className="icon-btn" onClick={() => setCollapsed(!collapsed)}>{collapsed ? '»' : '«'}</button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <small>Home / {headerTitle}</small>
            <h2>{headerTitle}</h2>
          </div>
          <div className="search"><span>⌕</span><input placeholder="Search jobs, vehicles, loads, templates" /><kbd>⌘K</kbd></div>
          <div className="top-actions">
            <button className="icon-btn">🔔<sup>3</sup></button>
            <button className="icon-btn" onClick={onOpenTheme}>◐</button>
            <select><option>Prod</option><option>Test</option></select>
            <button className="avatar">OR</button>
          </div>
        </header>
        <main className="main-grid">{children}</main>
      </div>
    </div>
  )
}
