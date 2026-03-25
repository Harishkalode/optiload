import { useMemo, useState } from 'react'
import api, { setAuthToken } from './api'

const defaultForm = { email: '', password: '' }

function App() {
  const [credentials, setCredentials] = useState(defaultForm)
  const [token, setToken] = useState('')
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  const role = useMemo(() => profile?.roles?.[0]?.name, [profile])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', credentials)
      setToken(data.access_token)
      setAuthToken(data.access_token)
      const me = await api.get('/users/me')
      setProfile(me.data)
      const userList = await api.get('/users')
      setUsers(userList.data)
    } catch {
      setError('Unable to login. Check credentials.')
    }
  }

  const handleLogout = () => {
    setToken('')
    setProfile(null)
    setUsers([])
    setAuthToken('')
  }

  return (
    <main className="container">
      <h1>Optiload User Management</h1>
      {!token ? (
        <form className="card" onSubmit={handleLogin}>
          <h2>Sign in</h2>
          <input placeholder="Email" type="email" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} />
          <input placeholder="Password" type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} />
          <button type="submit">Login</button>
          <p className="hint">Default superuser: owner@optiload.local / ChangeMe123!</p>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <section>
          <div className="toolbar">
            <div>
              <strong>{profile.full_name}</strong>
              <p>{profile.email} · role: {role}</p>
            </div>
            <button onClick={handleLogout}>Logout</button>
          </div>

          <div className="card">
            <h2>{role === 'superuser' ? 'Superuser Interface' : role === 'admin' ? 'Admin Interface' : 'Sub-admin Interface'}</h2>
            <p>
              {role === 'superuser' && 'You can oversee all users and tenant hierarchies.'}
              {role === 'admin' && 'You can manage your own organization and sub-admins.'}
              {role === 'sub-admin' && 'You can view users assigned under your admin scope.'}
            </p>
          </div>

          <div className="card">
            <h2>Users</h2>
            <table>
              <thead>
                <tr><th>ID</th><th>Email</th><th>Name</th><th>Role</th><th>Parent Admin</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.full_name}</td>
                    <td>{u.roles?.[0]?.name}</td>
                    <td>{u.parent_admin_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
