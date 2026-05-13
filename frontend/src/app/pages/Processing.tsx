import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { X, Minimize2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OLButton } from '../components/ui/OLButton';
import { OLCard } from '../components/ui/OLCard';
import { fetchOptimizationStatus } from '../services/domainApi';

type LogLine = { t: number; msg: string; type: 'info' | 'success' | 'warning' | 'error' };

export function Processing() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const jobId = params.get('id');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef(Date.now());
  const appendLog = (msg: string, type: LogLine['type'] = 'info') => {
    const t = Date.now() - startRef.current;
    setLogs(prev => [...prev, { t, msg, type }]);
  };

  useEffect(() => {
    if (!jobId) {
      setError('Missing job id. Open this page from a new optimization run.');
      return;
    }
    startRef.current = Date.now();
    appendLog(`Job #${jobId} — polling GET /optimization/{id}/status`, 'info');

    let cancelled = false;
    let attempts = 0;
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);

    let last: string | null = null;
    const poll = async () => {
      while (!cancelled && attempts < 40) {
        attempts += 1;
        try {
          const st = await fetchOptimizationStatus(Number(jobId));
          setProgress(p => Math.min(95, p + 10));
          if (st.status !== last) {
            appendLog(`Status: ${st.status}`, st.status === 'failed' ? 'error' : 'info');
            last = st.status;
          }
          if (st.status === 'completed') {
            setProgress(100);
            setDone(true);
            cancelled = true;
            setTimeout(() => navigate(`/jobs/results?id=${jobId}`), 900);
            break;
          }
          if (st.status === 'failed') {
            setDone(true);
            cancelled = true;
            setTimeout(() => navigate(`/jobs/results?id=${jobId}`), 900);
            break;
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Poll failed');
          cancelled = true;
          break;
        }
        await new Promise(r => setTimeout(r, 450));
      }
      if (!cancelled && attempts >= 40) {
        setError('Timed out waiting for job status');
      }
    };

    void poll();
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [jobId, navigate]);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const logColor: Record<string, string> = { info: '#94A3B8', success: '#10B981', warning: '#F59E0B', error: '#EF4444' };

  if (!jobId || error) {
    return (
      <div className="flex items-center justify-center p-6 min-h-full">
        <OLCard padding="32px" style={{ maxWidth: 420 }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: '#EF4444' }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 600, color: textPrimary }}>Processing unavailable</span>
          </div>
          <p style={{ fontSize: 13, color: text }}>{error || 'Invalid link.'}</p>
          <OLButton variant="primary" className="mt-4" onClick={() => navigate('/jobs')}>
            Back to jobs
          </OLButton>
        </OLCard>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6 min-h-full">
      <div className="w-full max-w-2xl">
        <OLCard padding="40px">
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
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke={palette.primary}
                      strokeWidth="4"
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
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: textPrimary, marginBottom: 6 }}>{done ? 'Optimization complete' : 'Running optimization'}</h2>
            <p style={{ fontSize: '13px', color: text }}>{done ? 'Opening results…' : `Job #${jobId} · ${elapsed}s elapsed`}</p>
          </div>

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
                <span style={{ fontSize: '11px', color: text }}>Live status</span>
              </div>
            </div>
          )}

          <OLCard padding="0" style={{ marginBottom: 20 }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Server log</span>
              <div className="flex items-center gap-1.5" style={{ fontSize: '11px', color: text }}>
                {!done && <motion.div className="rounded-full" style={{ width: 6, height: 6, background: '#10B981' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />}
                {done ? 'Done' : 'Polling'}
              </div>
            </div>
            <div className="p-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: 220, background: isDark ? '#080D13' : '#F8FAFC' }}>
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2">
                  <Clock size={11} style={{ color: '#4A5568', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: logColor[log.type] }}>{log.msg}</span>
                </motion.div>
              ))}
              {!done && logs.length > 0 && (
                <div className="flex items-center gap-1" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: text }}>
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                    _
                  </motion.span>
                </div>
              )}
            </div>
          </OLCard>

          {!done && (
            <div className="flex justify-center gap-3">
              <OLButton variant="ghost" size="sm" icon={<Minimize2 size={14} />} onClick={() => navigate('/')}>
                Background
              </OLButton>
              <OLButton variant="danger" size="sm" icon={<X size={14} />} onClick={() => navigate('/jobs')}>
                Leave
              </OLButton>
            </div>
          )}
        </OLCard>
      </div>
    </div>
  );
}
