export default function Drawer({ open, title, onClose, children }) {
  return <div className={`drawer-wrap ${open ? 'open' : ''}`}><div className="drawer-overlay" onClick={onClose} /><aside className="drawer"><div className="card-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>✕</button></div>{children}</aside></div>
}
