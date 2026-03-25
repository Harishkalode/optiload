import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'

export default function VehiclesPage() {
  return (
    <>
      <Card title="Vehicle List" action={<div className='row'><Button variant='secondary'>Import</Button><Button variant='secondary'>Export</Button><Button>Add Vehicle</Button></div>}>
        <div className='row filters'><input placeholder='Search vehicle' /><select><option>Type</option></select><select><option>Capacity</option></select><select><option>Status</option></select></div>
        <Table columns={['', 'Vehicle', 'Type', 'Dimensions', 'Max Weight', 'Status', 'Actions']} rows={[[<input type='checkbox' />, 'Railcar-22A', 'Railcar', '16x3x3m', '72,000kg', <Badge tone='success'>Active</Badge>, '👁 ✎ ⧉ 🗄 🗑']]} />
        <div className='bulk-bar'><Button variant='ghost'>Archive selected</Button><Button variant='ghost'>Delete selected</Button><Button variant='ghost'>Export selected</Button></div>
      </Card>
      <div className='split-2'><Card title='Add/Edit Vehicle'><div className='form-grid cols2'><input placeholder='Vehicle Name' /><input placeholder='Type' /><input placeholder='Length' /><input placeholder='Width' /><input placeholder='Height' /><input placeholder='Weight Limit' /><input placeholder='Axle Row' /><label className='toggle'><span>Special Constraints</span><input type='checkbox' /></label></div><div className='sticky-bar'>Auto-save active <Button>Save</Button></div></Card><Card title='Vehicle Detail'><div className='chart'>Utilization chart</div><ul><li>OPT-230</li><li>OPT-224</li></ul></Card></div>
    </>
  )
}
