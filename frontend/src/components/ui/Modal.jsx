export default function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return <div className="overlay" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="card-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>✕</button></div>{children}</div></div>
}
