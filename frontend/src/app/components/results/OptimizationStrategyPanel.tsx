import { useState } from 'react';
import { Target, Activity, Shield, DollarSign, Leaf, Gauge, Sliders } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'motion/react';

export type OptimizationObjective = 
  | 'space' 
  | 'axle-stress' 
  | 'cg-variance' 
  | 'endwall-force' 
  | 'cost' 
  | 'co2' 
  | 'advanced';

export interface OptimizationWeights {
  efficiency: number;
  stability: number;
  compliance: number;
  cost: number;
  speed: number;
}

interface Props {
  objective: OptimizationObjective;
  weights: OptimizationWeights;
  onObjectiveChange: (obj: OptimizationObjective) => void;
  onWeightsChange: (weights: OptimizationWeights) => void;
}

const OBJECTIVES = [
  { id: 'space' as const, icon: Target, label: 'Maximize Space Utilization', desc: 'Pack more loads per car' },
  { id: 'axle-stress' as const, icon: Activity, label: 'Minimize Axle Stress', desc: 'Balance truck loads evenly' },
  { id: 'cg-variance' as const, icon: Gauge, label: 'Minimize CG Variance', desc: 'Keep center-of-gravity stable' },
  { id: 'endwall-force' as const, icon: Shield, label: 'Minimize Endwall Force', desc: 'Reduce braking impact' },
  { id: 'cost' as const, icon: DollarSign, label: 'Minimize Cost', desc: 'Optimize for shipping cost' },
  { id: 'co2' as const, icon: Leaf, label: 'Minimize CO₂ Impact', desc: 'Reduce carbon footprint' },
];

export function OptimizationStrategyPanel({ objective, weights, onObjectiveChange, onWeightsChange }: Props) {
  const { isDark, palette } = useTheme();
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Optimization Strategy
      </div>

      {/* Objective Selection */}
      <div className="space-y-2">
        {OBJECTIVES.map(obj => {
          const Icon = obj.icon;
          const isSelected = objective === obj.id;
          
          return (
            <button
              key={obj.id}
              onClick={() => onObjectiveChange(obj.id)}
              className="w-full text-left p-3 rounded-lg transition-all duration-200"
              style={{
                background: isSelected ? `${palette.primary}15` : cardBg,
                border: `1px solid ${isSelected ? palette.primary : border}`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: isSelected ? palette.primary : `${palette.primary}20`,
                    color: isSelected ? '#ffffff' : palette.primary,
                  }}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 2 }}>
                    {obj.label}
                  </div>
                  <div style={{ fontSize: '10px', color: text, lineHeight: '1.4' }}>
                    {obj.desc}
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: palette.primary,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}

        {/* Advanced Mode Toggle */}
        <button
          onClick={() => onObjectiveChange('advanced')}
          className="w-full text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: objective === 'advanced' ? `${palette.accent}15` : cardBg,
            border: `1px solid ${objective === 'advanced' ? palette.accent : border}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                background: objective === 'advanced' ? palette.accent : `${palette.accent}20`,
                color: objective === 'advanced' ? '#ffffff' : palette.accent,
              }}
            >
              <Sliders size={16} />
            </div>
            <div className="flex-1">
              <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 2 }}>
                Advanced (Weighted)
              </div>
              <div style={{ fontSize: '10px', color: text }}>
                Customize optimization priorities
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Advanced Weight Sliders */}
      {objective === 'advanced' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-xl space-y-4"
          style={{ background: cardBg, border: `1px solid ${border}` }}
        >
          {[
            { key: 'efficiency' as const, label: 'Efficiency', color: palette.primary },
            { key: 'stability' as const, label: 'Stability', color: palette.success },
            { key: 'compliance' as const, label: 'Compliance Margin', color: palette.accent },
            { key: 'cost' as const, label: 'Cost', color: '#F59E0B' },
            { key: 'speed' as const, label: 'Loading Speed', color: palette.secondary },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '11px', color: text, fontWeight: 600 }}>
                  {label}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                  {weights[key]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights[key]}
                onChange={e => onWeightsChange({ ...weights, [key]: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: color }}
              />
            </div>
          ))}
          
          <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: '10px', color: text }}>
              Total weight distribution affects optimization priorities. Higher values = more emphasis.
            </div>
          </div>
        </motion.div>
      )}

      {/* Score Preview */}
      <div className="p-3 rounded-lg" style={{ background: `${palette.primary}08`, border: `1px solid ${palette.primary}30` }}>
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: palette.primary }} />
          <div style={{ fontSize: '11px', color: text }}>
            Strategy will adjust scoring weights in real-time optimization
          </div>
        </div>
      </div>
    </div>
  );
}
