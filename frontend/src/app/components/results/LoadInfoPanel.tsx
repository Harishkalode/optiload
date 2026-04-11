import React from 'react';

export interface LoadInfo {
  id: string;
  name: string;
  weight: number;
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  z: number;
  color: string;
  fragile: boolean;
  stackable: boolean;
  stabilityRisk?: number;
}

interface LoadInfoPanelProps {
  load: LoadInfo | null;
  isDark: boolean;
  onClose: () => void;
}

export function LoadInfoPanel({ load, isDark, onClose }: LoadInfoPanelProps) {
  if (!load) return null;

  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';

  const riskColor = (load.stabilityRisk ?? 0) < 30 ? '#10B981' : (load.stabilityRisk ?? 0) < 60 ? '#F59E0B' : '#EF4444';
  const riskLabel = (load.stabilityRisk ?? 0) < 30 ? 'Stable' : (load.stabilityRisk ?? 0) < 60 ? 'Moderate' : 'Unstable';

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: 16, minWidth: 220 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: load.color }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{load.name}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', padding: 4 }}>
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
        <div>
          <div style={{ color: muted, fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Weight</div>
          <div style={{ color: text, fontWeight: 600 }}>{load.weight} kg</div>
        </div>
        <div>
          <div style={{ color: muted, fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Stability</div>
          <div style={{ color: riskColor, fontWeight: 600 }}>{riskLabel}</div>
        </div>
        <div>
          <div style={{ color: muted, fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Dimensions</div>
          <div style={{ color: text, fontWeight: 500 }}>{load.w.toFixed(2)}×{load.h.toFixed(2)}×{load.d.toFixed(2)}m</div>
        </div>
        <div>
          <div style={{ color: muted, fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Position</div>
          <div style={{ color: text, fontWeight: 500 }}>({load.x.toFixed(2)}, {load.y.toFixed(2)}, {load.z.toFixed(2)})</div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
        {load.fragile && (
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
            FRAGILE
          </span>
        )}
        {!load.stackable && (
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>
            NO STACK
          </span>
        )}
      </div>

      {(load.stabilityRisk ?? 0) >= 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: isDark ? '#334155' : '#E2E8F0', overflow: 'hidden' }}>
            <div
              style={{ height: '100%', width: `${Math.min(100, load.stabilityRisk ?? 0)}%`, background: riskColor, borderRadius: 2, transition: 'width 0.3s' }}
            />
          </div>
          <div style={{ fontSize: 9, color: muted, marginTop: 2, textAlign: 'right' }}>
            Risk: {load.stabilityRisk ?? 0}/100
          </div>
        </div>
      )}
    </div>
  );
}
