import { useState } from 'react'
import Card from '../../components/ui/Card'
import Tabs from '../../components/ui/Tabs'
import Button from '../../components/ui/Button'

export default function SettingsPage({ onThemeOpen }) {
  const [tab, setTab] = useState('Users')
  return <><Card title='Admin & Settings'><Tabs items={['Users', 'Roles & Permissions', 'Audit Logs', 'API Keys']} active={tab} onChange={setTab} /><p>{tab} management workspace with enterprise controls.</p><Button onClick={onThemeOpen}>Open Theme Engine</Button></Card></>
}
