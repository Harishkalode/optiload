import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function AuthPage({ onAuthenticated }) {
  const [tab, setTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className='auth-wrap'>
      <Card>
        <div className='auth-header'><div className='symbol'>⟗</div><h1>OptiLoad</h1></div>
        <div className='tabs-inline'><button className={tab === 'login' ? 'on' : ''} onClick={() => setTab('login')}>Login</button><button className={tab === 'signup' ? 'on' : ''} onClick={() => setTab('signup')}>Signup</button></div>
        {tab === 'login' ? <form className='form-grid' onSubmit={(e) => { e.preventDefault(); onAuthenticated() }}><input placeholder='Email' type='email' required /><div className='pwd-row'><input placeholder='Password' type={showPassword ? 'text' : 'password'} required /><button type='button' className='icon-btn' onClick={() => setShowPassword(!showPassword)}>👁</button></div><label><input type='checkbox' /> Remember me</label><a href='#'>Forgot password?</a><Button>Login</Button></form>
          : <form className='form-grid' onSubmit={(e) => { e.preventDefault(); onAuthenticated() }}><input placeholder='Organization Name' /><input placeholder='Work Email' type='email' /><input placeholder='Password' type='password' /><input placeholder='Confirm Password' type='password' /><input placeholder='Invite Code (optional)' /><small>By continuing you agree to enterprise terms.</small><Button>Create Organization</Button></form>}
      </Card>
    </div>
  )
}
