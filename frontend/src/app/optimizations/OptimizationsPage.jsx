import { useState } from 'react'
import Card from '../../components/ui/Card'
import Stepper from '../../components/ui/Stepper'
import Button from '../../components/ui/Button'
import Toggle from '../../components/ui/Toggle'
import RailcarScene from '../../components/3d/RailcarScene'

export default function OptimizationsPage() {
  const [showViolations, setShowViolations] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  return (
    <>
      <Card title='Optimization Workflow'><Stepper steps={['Select Vehicles', 'Select Loads', 'Constraint Configuration']} active={2} /></Card>
      <div className='split-2'><Card title='Selection'><table className='table'><tbody><tr><td><input type='checkbox' /></td><td>Railcar-22A</td><td>72T</td></tr><tr><td><input type='checkbox' /></td><td>LD-774</td><td>warning</td></tr></tbody></table></Card><Card title='Constraints'><Toggle label='Weight distribution rule' checked onChange={() => {}} /><Toggle label='Axle pressure rule' checked onChange={() => {}} /><Toggle label='Stack limit rule' checked={false} onChange={() => {}} /><Toggle label='Temperature handling' checked={false} onChange={() => {}} /><input type='range' /></Card></div>
      <Card title='Processing'><div className='progress'><div /></div><p>Estimated remaining time 01m 28s</p><div className='logs'>solver init\npacking loads\nvalidating axle pressure</div><div className='row'><Button variant='danger'>Cancel job</Button><Button variant='secondary'>Minimize to background</Button><Button loading>Run Optimization</Button></div></Card>
      <div className='split-2-3d'><Card title='3D Railcar View'><RailcarScene showViolations={showViolations} compareMode={compareMode} /></Card><Card title='Result Panel'><p>Utilization 94%</p><div className='chart'>Weight distribution</div><div className='chart'>Axle pressure</div><label className='toggle'><span>Show Violations</span><input type='checkbox' checked={showViolations} onChange={(e) => setShowViolations(e.target.checked)} /></label><label className='toggle'><span>Compare with Previous</span><input type='checkbox' checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} /></label></Card></div>
      <Card><div className='row-end'><Button>Export plan</Button><Button variant='secondary'>Save as template</Button><Button variant='secondary'>Share link</Button><Button variant='ghost'>Re-run</Button><Button variant='ghost'>Compare previous</Button></div></Card>
    </>
  )
}
