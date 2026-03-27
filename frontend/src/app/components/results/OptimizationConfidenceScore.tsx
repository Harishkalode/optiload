import { useState } from 'react';
import { Gauge, TrendingUp, Shield, Activity, AlertTriangle, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

export interface ConfidenceMetrics {
  overall: number; // 0-100
  stabilityMargin: number; // 0-100
  cgSafetyMargin: number; // 0-100
  axleMargin: number; // 0-100
  shockTolerance: number; // 0-100
  patternReliability: number; // 0-100
}

interface Props {
  metrics: ConfidenceMetrics;
  showDetails?: boolean;
}

export function OptimizationConfidenceScore({ metrics, showDetails = false }: Props) {
  const { isDark, palette } = useTheme();
  const [expanded, setExpanded] = useState(showDetails);
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return palette.success;
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const confidenceColor = getConfidenceColor(metrics.overall);

  const subMetrics = [
    { key: 'stabilityMargin', label: 'Stability Margin', icon: Activity, value: metrics.stabilityMargin },
    { key: 'cgSafetyMargin', label: 'CG Safety Margin', icon: Shield, value: metrics.cgSafetyMargin },
    { key: 'axleMargin', label: 'Axle Load Margin', icon: TrendingUp, value: metrics.axleMargin },
    { key: 'shockTolerance', label: 'Shock Tolerance', icon: AlertTriangle, value: metrics.shockTolerance },
    { key: 'patternReliability', label: 'Pattern Reliability', icon: Info, value: metrics.patternReliability },
  ];

  return (
    <div className="space-y-3">
      {/* Main Confidence Badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 rounded-xl transition-all duration-200"
        style={{
          background: `${confidenceColor}15`,
          border: `2px solid ${confidenceColor}`,
          cursor: 'pointer',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Radial Gauge */}
          <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isDark ? '#1E2A38' : '#E2E8F0'}
                strokeWidth="10"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={confidenceColor}
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * metrics.overall) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  strokeDasharray: '264',
                  filter: `drop-shadow(0 0 6px ${confidenceColor}80)`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gauge size={20} style={{ color: confidenceColor }} />
            </div>
          </div>

          <div className="flex-1 text-left">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
              Optimization Confidence
            </div>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: '28px', fontWeight: 700, color: confidenceColor, lineHeight: 1 }}>
                {metrics.overall}%
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: text }}>
                {getConfidenceLabel(metrics.overall)}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Breakdown Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl space-y-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
                Confidence Breakdown
              </div>

              {subMetrics.map(({ key, label, icon: Icon, value }, index) => {
                const metricColor = getConfidenceColor(value);
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: metricColor }} />
                        <span style={{ fontSize: '11px', color: text, fontWeight: 500 }}>
                          {label}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: metricColor }}>
                        {value}%
                      </span>
                    </div>
                    
                    <div className="rounded-full overflow-hidden" style={{ background: isDark ? '#060B10' : '#F1F5F9', height: 4 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: metricColor,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}

              <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${border}` }}>
                <div style={{ fontSize: '10px', color: text, lineHeight: '1.5' }}>
                  Confidence score is calculated from constraint margins, load distribution variance, and AAR compliance factors.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
