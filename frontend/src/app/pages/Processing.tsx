import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { X, Minimize2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OLButton } from '../components/ui/OLButton';
import { OLCard } from '../components/ui/OLCard';

const LOG_ENTRIES = [
  { t: 500, msg: 'Initializing optimization engine v3.2.1...', type: 'info' },
  { t: 1200, msg: 'Loading vehicle constraints for 3 vehicles...', type: 'info' },
  { t: 1800, msg: 'Processing 5 load configurations...', type: 'info' },
  { t: 2400, msg: 'Running BinPack-3D algorithm...', type: 'info' },
  { t: 3200, msg: 'Weight distribution analysis: PASS', type: 'success' },
  { t: 4000, msg: 'Fragility constraint check: PASS', type: 'success' },
  { t: 4800, msg: 'Axle load distribution: WARNING (Axle 3: 98.2% capacity)', type: 'warning' },
  { t: 5600, msg: 'Applying rotation optimization...', type: 'info' },
  { t: 6400, msg: 'Re-evaluating placement strategy...', type: 'info' },
  { t: 7200, msg: 'Priority ordering applied: 6 loads sorted', type: 'success' },
  { t: 8000, msg: 'Final constraint validation: PASS', type: 'success' },
  { t: 8800, msg: 'Generating 3D placement report...', type: 'info' },
  { t: 9400, msg: 'Optimization complete. Efficiency: 91.2%', type: 'success' },
];

export function Processing() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<typeof LOG_ENTRIES>([]);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setElapsed(Math.floor(elapsed / 1000));
      const pct = Math.min((elapsed / 10000) * 100, 100);
      setProgress(pct);
      const newLogs = LOG_ENTRIES.filter(l => l.t <= elapsed);
      setLogs(newLogs);
      if (elapsed >= 10000) {
        clearInterval(interval);
        setDone(true);
        setTimeout(() => navigate('/jobs/results'), 1500);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';

  const logColor: Record<string, string> = { info: '#94A3B8', success: '#10B981', warning: '#F59E0B', error: '#EF4444' };

  return (
    <div className="flex items-center justify-center p-6 min-h-full">
      <div className="w-full max-w-2xl">
        <OLCard padding="40px">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {done ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                  <div className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: '#10B98120', border: '2px solid #10B981' }}>
                    <CheckCircle2 size={32} style={{ color: '#10B981' }} />
                  </div>
                </motion.div>
              ) : (
                <div className="relative" style={{ width: 64, height: 64 }}>
                  <svg className="absolute inset-0" width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke={isDark ? '#1E2A38' : '#E2E8F0'} strokeWidth="4" />
                    <motion.circle
                      cx="32" cy="32" r="28"
                      fill="none" stroke={palette.primary} strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 * (1 - progress / 100)}
                      transform="rotate(-90 32 32)"
                      transition={{ duration: 0.1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: palette.accent }}>
                    {Math.round(progress)}%
                  </div>
                </div>
              )}
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: textPrimary, marginBottom: 6 }}>
              {done ? 'Optimization Complete' : 'Running Optimization'}
            </h2>
            <p style={{ fontSize: '13px', color: text }}>
              {done ? 'Redirecting to results...' : `Job OPT-2892 · ${Math.max(0, 10 - elapsed)}s remaining`}
            </p>
          </div>

          {/* Progress bar */}
          {!done && (
            <div className="mb-6">
              <div className="rounded-full overflow-hidden" style={{ height: 8, background: isDark ? '#1E2A38' : '#E2E8F0' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})`, width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span style={{ fontSize: '11px', color: text }}>Elapsed: {elapsed}s</span>
                <span style={{ fontSize: '11px', color: text }}>~10s total</span>
              </div>
            </div>
          )}

          {/* Live Logs */}
          <OLCard padding="0" style={{ marginBottom: 20 }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Live Log</span>
              <div className="flex items-center gap-1.5" style={{ fontSize: '11px', color: text }}>
                <motion.div className="rounded-full" style={{ width: 6, height: 6, background: '#10B981' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                Live
              </div>
            </div>
            <div className="p-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: 220, background: isDark ? '#080D13' : '#F8FAFC' }}>
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2">
                  <span style={{ fontSize: '11px', color: '#4A5568', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{String(Math.floor(log.t / 1000)).padStart(2, '0')}s</span>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: logColor[log.type] }}>{log.msg}</span>
                </motion.div>
              ))}
              {!done && logs.length > 0 && (
                <div className="flex items-center gap-1" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: text }}>
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>_</motion.span>
                </div>
              )}
            </div>
          </OLCard>

          {/* Actions */}
          {!done && (
            <div className="flex justify-center gap-3">
              <OLButton variant="ghost" size="sm" icon={<Minimize2 size={14} />} onClick={() => navigate('/')}>Minimize to Background</OLButton>
              <OLButton variant="danger" size="sm" icon={<X size={14} />} onClick={() => navigate('/jobs')}>Cancel Job</OLButton>
            </div>
          )}
        </OLCard>
      </div>
    </div>
  );
}
