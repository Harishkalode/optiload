export default function Toggle({ checked, onChange, label }) { return <label className="toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={onChange} /></label> }
