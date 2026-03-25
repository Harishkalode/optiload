import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'

export default function LoadsPage() {
  return (
    <>
      <Card title='Load List' action={<Button>Add Load</Button>}>
        <div className='row filters'><button className='seg on'>Table</button><button className='seg'>Grid</button><select><option>Customer</option></select><select><option>Priority</option></select><select><option>Status</option></select></div>
        <Table columns={['Load', 'Customer', 'Priority', 'Status', 'Actions']} rows={[['LD-774', 'Atlas Steel', 86, <Badge tone='info'>Pending</Badge>, '👁 ✎ ⧉ 🗄 🗑']]} />
      </Card>
      <Card title='Add/Edit Load'><div className='form-grid cols3'><input placeholder='Length' /><input placeholder='Width' /><input placeholder='Height' /><label className='toggle'><span>Fragility</span><input type='checkbox' /></label><label className='toggle'><span>Rotation Allowed</span><input type='checkbox' defaultChecked /></label><input type='range' /><input placeholder='Weight' /><input placeholder='Custom constraint' /></div></Card>
    </>
  )
}
