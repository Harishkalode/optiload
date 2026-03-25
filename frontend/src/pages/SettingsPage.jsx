import { Button, Card } from '../components/ui'

export default function SettingsPage({ onThemeOpen }) {
  return (
    <>
      <Card title="Admin & Settings">
        <div className="tabs-inline"><button className="on">Users</button><button>Roles & Permissions</button><button>Audit Logs</button><button>API Keys</button></div>
        <div className="split-2"><div><h4>User list</h4><p>Invite modal, role dropdown, status toggle, reset password.</p></div><div><h4>Permission matrix</h4><p>Checkbox grid per module + role.</p></div></div>
      </Card>
      <Card title="Theme Engine" right={<Button onClick={onThemeOpen}>Open Theme Settings</Button>}>
        <p>Configure mode (light/dark/auto), palette presets, and custom highlight colors for tables/sidebar/3D panel.</p>
      </Card>
    </>
  )
}
