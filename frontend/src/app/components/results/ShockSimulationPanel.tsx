import { useState } from 'react';
import { Activity, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'motion/react';

export interface ShockSimulationConfig {
  shockMultiplier: number; // 1.0 - 2.0
  emergencyBrake: boolean;
  curveSimulation: boolean;
}

export interface StressMetrics {
  axleStress: number[];  // Stress per truck (0-100)
  endwallForce: number;  // lbs
  cgShift: { x: number; z: number }; // inches
  stressMargin: number;  // percentage
}

interface Props {
  config: ShockSimulationConfig;
  metrics: StressMetrics;
  onConfigChange: (config: ShockSimulationConfig) => void;
}

export function ShockSimulationPanel({ config, metrics, onConfigChange }: Props) {
  const { isDark, palette } = useTheme();
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  const getStressColor = (stress: number) => {
    if (stress < 70) return palette.success;
    if (stress < 85) return '#F59E0B';
    return '#EF4444';
  };

  const maxStress = Math.max(...metrics.axleStress);

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Shock & Stress Simulation
      </div>

      {/* Simulation Controls */}
      <div className="p-4 rounded-xl space-y-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
        {/* Shock Multiplier */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '11px', color: text, fontWeight: 600 }}>
              Shock Multiplier
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: palette.accent }}>
              {config.shockMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.1"
            value={config.shockMultiplier}
            onChange={e => onConfigChange({ ...config, shockMultiplier: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: palette.accent }}
          />
          <div className="flex justify-between mt-1" style={{ fontSize: '9px', color: text }}>
            <span>Normal (1.0x)</span>
            <span>Severe (2.0x)</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <button
            onClick={() => onConfigChange({ ...config, emergencyBrake: !config.emergencyBrake })}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
            style={{
              background: config.emergencyBrake ? `${palette.primary}15` : inputBg,
              border: `1px solid ${config.emergencyBrake ? palette.primary : border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: config.emergencyBrake ? palette.primary : text }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
                Emergency Brake
              </span>
            </div>
            <div
              className="rounded-full transition-all"
              style={{
                width: 40,
                height: 20,
                background: config.emergencyBrake ? palette.primary : border,
                position: 'relative',
              }}
            >
              <motion.div
                animate={{ x: config.emergencyBrake ? 22 : 2 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
            </div>
          </button>

          <button
            onClick={() => onConfigChange({ ...config, curveSimulation: !config.curveSimulation })}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
            style={{
              background: config.curveSimulation ? `${palette.secondary}15` : inputBg,
              border: `1px solid ${config.curveSimulation ? palette.secondary : border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: config.curveSimulation ? palette.secondary : text }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
                Curve Stress
              </span>
            </div>
            <div
              className="rounded-full transition-all"
              style={{
                width: 40,
                height: 20,
                background: config.curveSimulation ? palette.secondary : border,
                position: 'relative',
              }}
            >
              <motion.div
                animate={{ x: config.curveSimulation ? 22 : 2 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Stress Metrics */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
          Live Stress Analysis
        </div>

        {/* Axle Stress Bars */}
        <div>
          <div style={{ fontSize: '10px', color: text, marginBottom: 8 }}>Axle Stress Distribution</div>
          <div className="space-y-2">
            {metrics.axleStress.map((stress, index) => {
              const stressColor = getStressColor(stress);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: '10px', color: text }}>
                      Truck {index + 1}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: stressColor }}>
                      {stress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ background: inputBg, height: 6 }}>
                    <motion.div
                      animate={{ width: `${stress}%` }}
                      transition={{ duration: 0.3 }}
                      style={{
                        height: '100%',
                        background: stressColor,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Endwall Force */}
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: inputBg }}>
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: palette.accent }} />
            <span style={{ fontSize: '11px', color: text }}>Endwall Force</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>
            {metrics.endwallForce.toLocaleString()} lbs
          </span>
        </div>

        {/* CG Shift */}
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: inputBg }}>
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: palette.primary }} />
            <span style={{ fontSize: '11px', color: text }}>CG Shift</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: textPrimary }}>
            X: {metrics.cgShift.x.toFixed(1)}" Z: {metrics.cgShift.z.toFixed(1)}"
          </span>
        </div>

        {/* Stress Margin */}
        <div 
          className="p-3 rounded-lg flex items-center justify-between"
          style={{
            background: getStressColor(100 - metrics.stressMargin) + '15',
            border: `1px solid ${getStressColor(100 - metrics.stressMargin)}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: getStressColor(100 - metrics.stressMargin) }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: text }}>
              Stress Margin
            </span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: getStressColor(100 - metrics.stressMargin) }}>
            {metrics.stressMargin.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
