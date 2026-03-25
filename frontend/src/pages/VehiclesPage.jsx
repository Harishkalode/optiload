import { Button, Card, Badge } from '../components/ui'

export default function VehiclesPage() {
  return (
    <>
      <Card title="Vehicle Management" right={<div className="row"><Button variant="secondary">Import</Button><Button variant="secondary">Export</Button><Button>Add Vehicle</Button></div>}>
        <div className="row filters"><input placeholder="Search vehicle" /><select><option>Type</option></select><select><option>Capacity</option></select><select><option>Status</option></select></div>
        <table className="table"><thead><tr><th><input type="checkbox" /></th><th>Name</th><th>Type</th><th>Dimensions</th><th>Max Weight</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody><tr><td><input type="checkbox" /></td><td>Railcar-22A</td><td>Railcar</td><td>16x3x3m</td><td>72,000kg</td><td><Badge tone="success">Active</Badge></td><td>👁 ✎ ⧉ 🗄 🗑</td></tr></tbody></table>
        <div className="row"><Button variant="ghost">Archive selected</Button><Button variant="ghost">Delete selected</Button><Button variant="ghost">Export selected</Button></div>
      </Card>
      <div className="split-2">
        <Card title="Add / Edit Vehicle"><div className="form-grid cols2"><input placeholder="Vehicle Name" /><input placeholder="Type" /><input placeholder="Length" /><input placeholder="Width" /><input placeholder="Height" /><input placeholder="Max Weight" /><input placeholder="Axle Config" /><label className="toggle">Special Constraint <input type="checkbox" /></label></div><div className="sticky-bar">Auto-save draft • <Button>Save Vehicle</Button></div></Card>
        <Card title="Vehicle Detail"><p>Summary + constraints overview</p><div className="chart">Utilization chart</div><ul><li>Assigned OPT-870</li><li>Assigned OPT-871</li></ul></Card>
      </div>
    </>
  )
}
