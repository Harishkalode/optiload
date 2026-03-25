import { Button, Card, Stepper, Badge } from '../components/ui'

export default function OptimizationPage() {
  return (
    <>
      <Card title="Optimization Wizard"><Stepper steps={["Select Vehicles", "Select Loads", "Configure Constraints"]} active={1} /></Card>
      <div className="split-2">
        <Card title="Step 1/2 Selection"><table className="table"><tbody><tr><td><input type="checkbox" /></td><td>Railcar-22A</td><td>Capacity 72T</td></tr><tr><td><input type="checkbox" /></td><td>Load LD-4452</td><td><Badge tone="warning">Conflict warning</Badge></td></tr></tbody></table></Card>
        <Card title="Constraint Configuration"><label className="toggle">Weight distribution <input type="checkbox" checked readOnly/></label><label className="toggle">Axle pressure <input type="checkbox" checked readOnly/></label><label className="toggle">Stack limit <input type="checkbox"/></label><input type="range" min="0" max="100" /><Badge tone="error">Validation: Overweight on axle group B</Badge></Card>
      </div>
      <Card title="Processing & Results Preview" right={<Button loading>Run Optimization</Button>}>
        <div className="progress"><div /></div>
        <p>ETA: 02m 14s</p>
        <div className="logs">Initializing solver...\nRunning matrix fit...\nApplying constraints...</div>
      </Card>
      <div className="results">
        <Card title="3D Railcar View (60%)"><div className="panel3d">Interactive 3D container • camera • hover tooltips • selection highlight</div></Card>
        <Card title="Result Insights (40%)"><p>Utilization 93%</p><div className="chart">Weight distribution graph</div><div className="chart">Axle load graph</div><Badge tone="warning">2 minor violations</Badge></Card>
      </div>
      <Card><div className="row-end"><Button>Export Plan</Button><Button variant="secondary">Save Template</Button><Button variant="secondary">Share Link</Button><Button variant="ghost">Re-run</Button><Button variant="ghost">Compare Previous</Button></div></Card>
    </>
  )
}
