import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'motion/react';

export interface ComplianceCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  value?: string;
  limit?: string;
}

interface Props {
  checks: ComplianceCheck[];
}

export function ComplianceChecklistPanel({ checks }: Props) {
  const { isDark, palette } = useTheme();
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  const passCount = checks.filter(c => c.status === 'pass').length;
  const totalCount = checks.length;
  const compliancePercent = Math.round((passCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Compliance Checklist
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: palette.primary }}>
          {passCount}/{totalCount}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-full overflow-hidden" style={{ background: isDark ? '#060B10' : '#F1F5F9', height: 6 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${compliancePercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: compliancePercent === 100 
              ? palette.success 
              : compliancePercent >= 70 
              ? '#F59E0B' 
              : '#EF4444',
            borderRadius: 999,
          }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checks.map((check, index) => {
          const Icon = check.status === 'pass' 
            ? CheckCircle2 
            : check.status === 'warning' 
            ? AlertTriangle 
            : Circle;
          
          const color = check.status === 'pass' 
            ? palette.success 
            : check.status === 'warning' 
            ? '#F59E0B' 
            : '#EF4444';

          return (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{
                background: check.status === 'pass' ? `${palette.success}08` : cardBg,
                border: `1px solid ${check.status === 'pass' ? `${palette.success}30` : border}`,
              }}
            >
              <Icon
                size={16}
                style={{ color, flexShrink: 0, marginTop: 1 }}
                strokeWidth={check.status === 'pass' ? 2.5 : 2}
              />
              
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 2 }}>
                  {check.label}
                </div>
                
                {(check.value || check.limit) && (
                  <div className="flex items-center gap-2" style={{ fontSize: '10px', color: text }}>
                    {check.value && (
                      <span style={{ fontWeight: 600, color: color }}>
                        {check.value}
                      </span>
                    )}
                    {check.limit && (
                      <span>
                        (limit: {check.limit})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall Status */}
      <div 
        className="p-3 rounded-lg text-center"
        style={{
          background: compliancePercent === 100 
            ? `${palette.success}15` 
            : compliancePercent >= 70 
            ? '#F59E0B15' 
            : '#EF444415',
          border: `1px solid ${
            compliancePercent === 100 
              ? `${palette.success}30` 
              : compliancePercent >= 70 
              ? '#F59E0B30' 
              : '#EF444430'
          }`,
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: 4 }}>
          {compliancePercent}%
        </div>
        <div style={{ fontSize: '10px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {compliancePercent === 100 
            ? 'Fully Compliant' 
            : compliancePercent >= 70 
            ? 'Minor Warnings' 
            : 'Action Required'}
        </div>
      </div>
    </div>
  );
}
