import { useState } from 'react'
import { Button, Card } from '../components/ui'

export default function AuthPage({ onAuthenticated }) {
  const [tab, setTab] = useState('login')
  const [showPwd, setShowPwd] = useState(false)

  return (
    <div className="auth-wrap">
      <Card>
        <div className="auth-header"><div className="symbol">⟗</div><h1>OptiLoad</h1></div>
        <div className="tabs">
          <button className={tab === 'login' ? 'on' : ''} onClick={() => setTab('login')}>Login</button>
          <button className={tab === 'signup' ? 'on' : ''} onClick={() => setTab('signup')}>Signup</button>
        </div>
        {tab === 'login' ? (
          <form className="form-grid" onSubmit={(e) => { e.preventDefault(); onAuthenticated() }}>
            <input placeholder="Work email" type="email" required />
            <div className="pwd-row"><input placeholder="Password" type={showPwd ? 'text' : 'password'} required /><button type="button" onClick={() => setShowPwd(!showPwd)}>👁</button></div>
            <label><input type="checkbox" /> Remember me</label>
            <a href="#">Forgot password?</a>
            <Button>Login</Button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={(e) => { e.preventDefault(); onAuthenticated() }}>
            <input placeholder="Organization Name" required />
            <input placeholder="Work Email" type="email" required />
            <input placeholder="Password" type="password" required />
            <input placeholder="Confirm Password" type="password" required />
            <input placeholder="Invite Code (optional)" />
            <small>By continuing, you agree to OptiLoad enterprise terms.</small>
            <Button>Create Organization</Button>
          </form>
        )}
      </Card>
    </div>
  )
}
