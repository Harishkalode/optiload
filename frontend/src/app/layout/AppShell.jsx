import { useState } from 'react'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'

export default function AppShell({ active, onSelect, onThemeOpen, children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="shell">
      <Sidebar active={active} onSelect={onSelect} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
      <div className="workspace">
        <TopNavbar title={active} onThemeOpen={onThemeOpen} />
        <main className="main-grid grid-12">{children}</main>
      </div>
    </div>
  )
}
