export default function Select({ options }) { return <select>{options.map((o) => <option key={o}>{o}</option>)}</select> }
