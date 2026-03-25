import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'

const kpis = [
  ['Active Jobs', '56', '+5.1%'],
  ['Fleet Utilization', '89%', '+2.4%'],
  ['Load Efficiency', '92%', '+1.3%'],
  ['Cost Reduction', '15.4%', '+0.7%'],
  ['Constraint Alerts', '3', '-2'],
  ['Active Warehouses', '14', '+1']
]

export default function DashboardPage() {
  return (
    <>
      <div className="kpi-grid">{kpis.map(([k, v, d]) => <Card key={k}><small>{k}</small><h2>{v}</h2><p>{d}</p><div className="spark" /></Card>)}</div>
      <div className="split-2"><Card title="Activity Timeline"><ul className="timeline"><li><Badge tone="success">Completed</Badge> OPT-233 by M. Rao</li><li><Badge tone="warning">Running</Badge> OPT-234 by J. Kim</li><li><Badge tone="info">Queued</Badge> OPT-235 by A. Singh</li></ul></Card><Card title="Utilization Trend"><div className="chart">trend</div></Card></div>
      <Card title="Recent Jobs"><Table columns={['Job ID', 'Vehicle Count', 'Load Count', 'Utilization', 'Status', 'Created By', 'Date', 'Actions']} rows={[[ 'OPT-234', 8, 61, '94%', <Badge tone='warning'>Running</Badge>, 'J. Kim', '2026-03-25', '👁 ⧉ ⬇ 🗑' ]]} /></Card>
    </>
  )
}
