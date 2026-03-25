export default function Button({ variant = 'primary', size = 'md', loading = false, children, ...props }) {
  return (
    <button className={`btn ${variant} ${size}`} disabled={loading || props.disabled} {...props}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}
