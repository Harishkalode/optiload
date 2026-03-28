import { useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Eye, EyeOff, Loader2, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'motion/react';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type Mode = 'login' | 'signup';

export function Login() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const initialMode: Mode = location.pathname === '/create-account' ? 'signup' : 'login';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ org: '', name: '', email: '', password: '', confirm: '', remember: false });

  const bg = isDark ? '#060B10' : '#F1F5F9';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  const inputStyle: CSSProperties = {
    background: inputBg,
    border: `1px solid ${border}`,
    color: textPrimary,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let redirectPath = '/dashboard';
      if (mode === 'login') {
        redirectPath = await login(form.email, form.password);
      } else {
        if (form.password !== form.confirm) {
          throw new Error('Passwords do not match');
        }
        redirectPath = await register({
          full_name: form.name,
          email: form.email,
          password: form.password,
          organization_name: form.org,
        });
      }
      navigate(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: bg, fontFamily: 'Inter, sans-serif' }}>
      <div className="hidden lg:flex flex-col justify-between p-8 xl:p-12 flex-1" style={{ background: `linear-gradient(135deg, #080D13 0%, #0D1A2E 100%)` }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '36px', color: '#F1F5F9', lineHeight: 1.2 }}>
            Precision load optimization at industrial scale
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12 w-full lg:max-w-[480px] flex-shrink-0">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <div className="flex rounded-xl p-1 mb-8" style={{ background: isDark ? '#060B10' : '#F1F5F9' }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} className="flex-1 py-2 rounded-lg" style={{ fontSize: '13px', fontWeight: 600, background: mode === m ? cardBg : 'transparent', color: mode === m ? textPrimary : text }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" required />
                <input style={inputStyle} value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} placeholder="Organization Name" required />
              </>
            )}
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Work Email" required />
            <div className="relative">
              <input style={inputStyle} type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: text }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === 'signup' && <input style={inputStyle} type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Confirm Password" required />}
            {mode === 'signup' && (
              <p className="text-xs" style={{ color: text, lineHeight: 1.5 }}>
                Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.
              </p>
            )}

            {mode === 'login' && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.remember} onChange={e => setForm({ ...form, remember: e.target.checked })} />
                <span style={{ fontSize: '13px', color: text }}>Remember me for 30 days</span>
              </label>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl py-3" style={{ background: palette.primary, color: '#ffffff' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === 'login' ? 'Sign In to OptiLoad' : 'Create Organization'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-6 pt-5" style={{ borderTop: `1px solid ${border}` }}>
            <Shield size={14} style={{ color: text }} />
            <span style={{ fontSize: '11px', color: text }}>Enterprise-grade security</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
