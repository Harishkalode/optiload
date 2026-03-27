import { Info, AlertCircle, CheckCircle2, XCircle, TrendingDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'motion/react';

export interface LoadExplanation {
  loadId: string;
  loadName: string;
  placementReason: string;
  constraints: string[];
  rejectedPositions: Array<{
    position: string;
    reason: string;
    scoreDelta: number;
  }>;
  currentScore: number;
  alternativeScore?: number;
}

interface Props {
  explanation: LoadExplanation | null;
  onShowAlternate?: () => void;
}

export function ExplainabilityPanel({ explanation, onShowAlternate }: Props) {
  const { isDark, palette } = useTheme();
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  if (!explanation) {
    return (
      <div className="p-6 rounded-xl text-center" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <Info size={32} style={{ color: text, margin: '0 auto 12px' }} />
        <div style={{ fontSize: '12px', color: text, lineHeight: '1.6' }}>
          Select a load to see placement explanation and optimization reasoning
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Load Explanation
      </div>

      {/* Load Header */}
      <div className="p-4 rounded-xl" style={{ background: `${palette.primary}15`, border: `1px solid ${palette.primary}30` }}>
        <div style={{ fontSize: '10px', color: text, marginBottom: 4 }}>Selected Load</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
          {explanation.loadName}
        </div>
        <div style={{ fontSize: '10px', color: text, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
          {explanation.loadId}
        </div>
      </div>

      {/* Placement Reason */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="flex items-start gap-2 mb-3">
          <CheckCircle2 size={16} style={{ color: palette.success, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: textPrimary, marginBottom: 4 }}>
              Why Placed Here
            </div>
            <div style={{ fontSize: '11px', color: text, lineHeight: '1.6' }}>
              {explanation.placementReason}
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${border}` }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: text, marginBottom: 6, textTransform: 'uppercase' }}>
            Active Constraints
          </div>
          <div className="space-y-1.5">
            {explanation.constraints.map((constraint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2"
              >
                <div style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: '50%', 
                  background: palette.accent,
                  marginTop: 5,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '10px', color: text, lineHeight: '1.5' }}>
                  {constraint}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Rejected Positions */}
      {explanation.rejectedPositions.length > 0 && (
        <div className="p-4 rounded-xl space-y-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-2">
            <XCircle size={14} style={{ color: '#EF4444' }} />
            <div style={{ fontSize: '11px', fontWeight: 600, color: textPrimary }}>
              Rejected Alternative Positions
            </div>
          </div>

          <div className="space-y-2">
            {explanation.rejectedPositions.slice(0, 3).map((rejected, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg"
                style={{ background: inputBg, border: `1px solid ${border}` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div style={{ fontSize: '11px', fontWeight: 600, color: textPrimary }}>
                    {rejected.position}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown size={10} style={{ color: '#EF4444' }} />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>
                      -{rejected.scoreDelta.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: text, lineHeight: '1.5' }}>
                  {rejected.reason}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Score Impact */}
      <div className="p-4 rounded-xl" style={{ background: `${palette.accent}08`, border: `1px solid ${palette.accent}30` }}>
        <div style={{ fontSize: '10px', color: text, marginBottom: 8 }}>Current Position Score</div>
        <div className="flex items-baseline gap-2 mb-3">
          <span style={{ fontSize: '24px', fontWeight: 700, color: palette.accent }}>
            {explanation.currentScore.toFixed(1)}
          </span>
          <span style={{ fontSize: '11px', color: text }}>/ 100</span>
        </div>
        
        {explanation.alternativeScore !== undefined && (
          <div style={{ fontSize: '10px', color: text, lineHeight: '1.5' }}>
            Moving this load would reduce overall score to{' '}
            <strong style={{ color: '#EF4444' }}>
              {explanation.alternativeScore.toFixed(1)}
            </strong>
          </div>
        )}
      </div>

      {/* Show Alternate Button */}
      {onShowAlternate && (
        <button
          onClick={onShowAlternate}
          className="w-full py-3 px-4 rounded-lg transition-all font-semibold"
          style={{
            fontSize: '12px',
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
            color: '#ffffff',
            border: 'none',
          }}
        >
          Show Alternate Scenario
        </button>
      )}
    </div>
  );
}
