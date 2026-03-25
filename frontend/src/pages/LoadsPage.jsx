import { Button, Card, Badge } from '../components/ui'

export default function LoadsPage() {
  return (
    <>
      <Card title="Load Management" right={<Button>Add Load</Button>}>
        <div className="row filters"><button className="seg on">Table</button><button className="seg">Grid</button><select><option>Customer</option></select><select><option>Priority</option></select><select><option>Status</option></select></div>
        <table className="table"><thead><tr><th>Load</th><th>Customer</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody><tr><td>LD-4452</td><td>Atlas Steel</td><td>88</td><td><Badge tone="info">Pending</Badge></td><td>👁 ✎ ⧉ 🗄 🗑</td></tr></tbody></table>
      </Card>
      <Card title="Add / Edit Load">
        <div className="form-grid cols3"><input placeholder="Length" /><input placeholder="Width" /><input placeholder="Height" /><label className="toggle">Fragility <input type="checkbox" /></label><label className="toggle">Rotation Allowed <input type="checkbox" checked readOnly /></label><input type="range" min="1" max="100" /><input placeholder="Weight" /><input placeholder="Custom constraint" /></div>
      </Card>
    </>
  )
}
