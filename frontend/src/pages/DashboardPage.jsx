import { useState } from 'react'
import { Badge, Button, Card, Modal } from '../components/ui'

const kpis = [
  ['Active Jobs', '42', '+8.2%', '↗'],
  ['Fleet Utilization', '88%', '+3.4%', '↗'],
  ['Load Efficiency', '91%', '+1.1%', '↗'],
  ['Cost Reduction', '14.6%', '+0.8%', '↗'],
  ['Constraint Alerts', '5', '-2', '↘'],
  ['Active Warehouses', '12', '+1', '↗']
]

export default function DashboardPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <div className="kpi-grid">
        {kpis.map(([label, value, delta, trend]) => <Card key={label}><small>{label}</small><h2>{value}</h2><p>{trend} {delta}</p><div className="spark" /></Card>)}
      </div>
      <div className="split-2">
        <Card title="Activity Timeline">
          <ul className="timeline">
            <li><Badge tone="success">Completed</Badge> Job #OPT-874 by Ava Chen · 09:44</li>
            <li><Badge tone="warning">Running</Badge> Job #OPT-875 by Omar Reid · 10:02</li>
            <li><Badge tone="info">Queued</Badge> Job #OPT-876 by I. Patel · 10:06</li>
          </ul>
        </Card>
        <Card title="Mini Utilization Trend"><div className="chart">Performance trend canvas</div></Card>
      </div>
      <Card title="Recent Jobs">
        <table className="table">
          <thead><tr><th>Job ID</th><th>Vehicles</th><th>Loads</th><th>Utilization</th><th>Status</th><th>Created By</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            <tr><td>OPT-875</td><td>9</td><td>64</td><td>92%</td><td><Badge tone="warning">Running</Badge></td><td>Omar</td><td>2026-03-25</td><td>👁 📄 ⬇ 🗑 <button className="link" onClick={() => setConfirmOpen(true)}>Delete</button></td></tr>
          </tbody>
        </table>
      </Card>
      <Modal open={confirmOpen} title="Confirm Delete" onClose={() => setConfirmOpen(false)}>
        <p>This action is permanent. Remove optimization job OPT-875?</p>
        <div className="row-end"><Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button variant="danger">Delete</Button></div>
      </Modal>
    </>
  )
}
