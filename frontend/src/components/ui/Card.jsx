export default function Card({ title, action, children }) {
  return <section className="card">{(title || action) && <header className="card-head"><h3>{title}</h3>{action}</header>}{children}</section>
}
