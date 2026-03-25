export default function Toast({ message, tone = 'info' }) { return <div className={`toast ${tone}`}>{message}</div> }
