import { useAuth } from '../contexts/AuthContext';
import { useState, CSSProperties, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Loader2, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

type Mode = 'login' | 'signup';

export function Login() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    org: '', 
    email: '', 
    password: '', 
    confirm: '', 
    invite: '', 
    remember: false,
  });

  const bg = isDark ? '#060B10' : '#F1F5F9';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  const inputStyle: CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: textPrimary,
    borderRadius: 10, padding: '10px 14px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
    outline: 'none', width: '100%', transition: 'border-color 0.15s',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      await new Promise(r => setTimeout(r, 400));
      const stored = localStorage.getItem('optiload_user');
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed?.role === 'Super Admin') {
        navigate('/super-admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-8 xl:p-12 flex-1" style={{ background: `linear-gradient(135deg, #080D13 0%, #0D1A2E 100%)` }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: palette.primary }}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="12" width="16" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="4" y="8" width="12" height="3" rx="1.5" fill="white" opacity="0.7"/>
              <rect x="6" y="4" width="8" height="3" rx="1.5" fill="white" opacity="0.5"/>
              <circle cx="5" cy="16.5" r="1.5" fill="white"/>
              <circle cx="15" cy="16.5" r="1.5" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: '#F1F5F9', letterSpacing: '-0.02em' }}>OptiLoad</div>
            <div style={{ fontSize: '11px', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rail Logistics Platform</div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '36px', color: '#F1F5F9', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Precision load<br />optimization at<br /><span style={{ color: palette.accent }}>industrial scale</span>
          </div>
          <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.7, maxWidth: 380 }}>
            OptiLoad helps rail operators maximize fleet utilization and reduce logistics costs through AI-driven 3D load optimization.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '91.2%', label: 'Avg. Load Efficiency' },
            { value: '2,400+', label: 'Jobs Optimized' },
            { value: '$3.2M', label: 'Cost Savings' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: palette.accent }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12 w-full lg:max-w-[480px] flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full rounded-2xl overflow-hidden p-6 sm:p-8"
          style={{ 
            background: cardBg, 
            border: `1px solid ${border}`, 
            boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.5)' : '0 24px 64px rgba(0,0,0,0.1)', 
            maxWidth: '100%' 
          }}
        >
          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: isDark ? '#060B10' : '#F1F5F9' }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} className="flex-1 py-2 rounded-lg transition-all"
                style={{ fontSize: '13px', fontWeight: 600, background: mode === m ? cardBg : 'transparent', color: mode === m ? textPrimary : text, boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.15)' : 'none' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Organization Name</label>
                <input style={inputStyle} value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} placeholder="RailCorp Inc." required
                  onFocus={e => (e.target.style.borderColor = palette.primary)}
                  onBlur={e => (e.target.style.borderColor = border)} />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Work Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required
                onFocus={e => (e.target.style.borderColor = palette.primary)}
                onBlur={e => (e.target.style.borderColor = border)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>Password</label>
                {mode === 'login' && <button type="button" style={{ fontSize: '12px', color: palette.accent }}>Forgot password?</button>}
              </div>
              <div className="relative">
                <input style={inputStyle} type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••••" required
                  onFocus={e => (e.target.style.borderColor = palette.primary)}
                  onBlur={e => (e.target.style.borderColor = border)} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: text }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Confirm Password</label>
                  <input style={inputStyle} type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••••"
                    onFocus={e => (e.target.style.borderColor = palette.primary)}
                    onBlur={e => (e.target.style.borderColor = border)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Invite Code <span style={{ color: text, fontWeight: 400 }}>(optional)</span></label>
                  <input style={inputStyle} value={form.invite} onChange={e => setForm({ ...form, invite: e.target.value })} placeholder="INVITE-XXXX"
                    onFocus={e => (e.target.style.borderColor = palette.primary)}
                    onBlur={e => (e.target.style.borderColor = border)} />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.remember} onChange={e => setForm({ ...form, remember: e.target.checked })} style={{ accentColor: palette.primary, width: 14, height: 14 }} />
                <span style={{ fontSize: '13px', color: text }}>Remember me for 30 days</span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 transition-all"
              style={{
                background: loading ? palette.primary + 'AA' : palette.primary,
                color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8,
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to OptiLoad' : 'Create Organization'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {mode === 'signup' && (
            <p style={{ fontSize: '11px', color: text, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              By creating an account, you agree to our{' '}
              <a href="#" style={{ color: palette.accent }}>Terms of Service</a> and{' '}
              <a href="#" style={{ color: palette.accent }}>Privacy Policy</a>.
            </p>
          )}

          <div className="flex items-center gap-2 mt-6 pt-5" style={{ borderTop: `1px solid ${border}` }}>
            <Shield size={14} style={{ color: text }} />
            <span style={{ fontSize: '11px', color: text }}>Enterprise-grade security · SOC 2 Type II · GDPR compliant</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}