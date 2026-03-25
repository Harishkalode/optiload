export default function TopNavbar({ title, onThemeOpen }) {
  return (
    <header className="topbar">
      <div><small>Home / {title}</small><h2>{title}</h2></div>
      <div className="search"><span>⌕</span><input placeholder="Search jobs, vehicles, loads, templates" /><kbd>⌘K</kbd></div>
      <div className="top-actions"><button className="icon-btn">🔔<sup>4</sup></button><button className="icon-btn" onClick={onThemeOpen}>◐</button><select><option>Prod</option><option>Test</option></select><button className="avatar">OL</button></div>
    </header>
  )
}
