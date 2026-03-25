const groups = [{ title: 'Core', items: ['Dashboard', 'Optimization Jobs', 'Vehicles', 'Loads'] }, { title: 'Management', items: ['Templates', 'Reports', 'Users', 'Settings'] }]
const icons = { Dashboard: '▦', 'Optimization Jobs': '⬢', Vehicles: '⛟', Loads: '▤', Templates: '⧉', Reports: '▥', Users: '👥', Settings: '⚙' }

export default function Sidebar({ active, onSelect, collapsed, onCollapse }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div>
        <div className="logo"><div className="symbol">⟗</div>{!collapsed && <div><strong>OptiLoad</strong><small>Mission Control</small></div>}</div>
        {groups.map((g) => (
          <div key={g.title} className="nav-group">
            {!collapsed && <small className="group-label">{g.title}</small>}
            {g.items.map((label) => <button key={label} className={`nav-btn ${active === label ? 'active' : ''}`} onClick={() => onSelect(label)} title={collapsed ? label : ''}><span>{icons[label]}</span>{!collapsed && label}</button>)}
          </div>
        ))}
      </div>
      <div className="sidebar-foot">
        {!collapsed && <select className="org-switch"><option>OptiLoad Global</option><option>West Rail Ops</option></select>}
        {!collapsed && <small>v1.0.0</small>}
        <button className="icon-btn" onClick={onCollapse}>{collapsed ? '»' : '«'}</button>
      </div>
    </aside>
  )
}
