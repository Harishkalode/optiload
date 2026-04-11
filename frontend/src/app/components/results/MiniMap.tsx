import React, { useMemo } from 'react';

export interface MiniMapLoad {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  name: string;
  weight: number;
}

interface MiniMapProps {
  loads: MiniMapLoad[];
  vehicleLength: number;
  vehicleWidth: number;
  selectedLoad: string | null;
  onSelectLoad: (id: string | null) => void;
  isDark: boolean;
}

export function MiniMap({ loads, vehicleLength, vehicleWidth, selectedLoad, onSelectLoad, isDark }: MiniMapProps) {
  const padding = 24;
  const width = 200;
  const height = (vehicleWidth / vehicleLength) * width;
  const scaleX = (width - padding * 2) / vehicleLength;
  const scaleZ = (height - padding * 2) / vehicleWidth;

  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';

  const stats = useMemo(() => {
    const totalWeight = loads.reduce((s, l) => s + l.weight, 0);
    const totalVol = loads.reduce((s, l) => s + l.w * l.d * (l.w > 0 ? 1 : 0), 0);
    const vehicleVol = vehicleLength * vehicleWidth;
    return { count: loads.length, totalWeight, utilization: vehicleVol > 0 ? (totalVol / vehicleVol) * 100 : 0 };
  }, [loads, vehicleLength, vehicleWidth]);

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Top View
        </span>
        <span style={{ fontSize: 10, color: text }}>
          {stats.count} loads · {stats.totalWeight.toFixed(0)}kg · {stats.utilization.toFixed(1)}%
        </span>
      </div>
      <svg
        width={width}
        height={height}
        style={{ display: 'block', margin: '0 auto', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: 4 }}
      >
        {/* Vehicle outline */}
        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          fill="none"
          stroke={border}
          strokeWidth={1}
          rx={2}
        />
        {/* Center line */}
        <line
          x1={padding + (width - padding * 2) / 2}
          y1={padding}
          x2={padding + (width - padding * 2) / 2}
          y2={height - padding}
          stroke={border}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
        {/* Loads */}
        {loads.map(load => {
          const x = padding + load.x * scaleX;
          const y = padding + load.z * scaleZ;
          const w = load.w * scaleX;
          const h = load.d * scaleZ;
          const isSelected = selectedLoad === load.id;
          return (
            <g key={load.id} onClick={() => onSelectLoad(isSelected ? null : load.id)} style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={y}
                width={Math.max(w, 2)}
                height={Math.max(h, 2)}
                fill={load.color}
                stroke={isSelected ? '#FFFFFF' : 'transparent'}
                strokeWidth={isSelected ? 2 : 0}
                rx={1}
                opacity={0.85}
              />
              {w > 8 && h > 6 && (
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 3}
                  textAnchor="middle"
                  fontSize={6}
                  fill="#FFFFFF"
                  fontWeight={600}
                >
                  {load.weight}kg
                </text>
              )}
            </g>
          );
        })}
        {/* Dimension labels */}
        <text x={width / 2} y={height - 4} textAnchor="middle" fontSize={7} fill={text}>
          {vehicleLength.toFixed(1)}m
        </text>
        <text x={4} y={height / 2} textAnchor="middle" fontSize={7} fill={text} transform={`rotate(-90, 4, ${height / 2})`}>
          {vehicleWidth.toFixed(1)}m
        </text>
      </svg>
    </div>
  );
}
