export function Button({ variant = 'primary', loading = false, children, ...props }) {
  return <button className={`btn ${variant}`} disabled={loading || props.disabled} {...props}>{loading ? 'Loading...' : children}</button>
}

export function Badge({ tone = 'info', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function Card({ title, right, children }) {
  return (
    <section className="card">
      {(title || right) && <header className="card-head"><h3>{title}</h3>{right}</header>}
      {children}
    </section>
  )
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  )
}

export function Stepper({ steps, active }) {
  return <div className="stepper">{steps.map((s, i) => <div key={s} className={`step ${i <= active ? 'on' : ''}`}>{i + 1}. {s}</div>)}</div>
}
