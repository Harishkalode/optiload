import React, { useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Load3D } from './Scene3D';
import type { EngineOutput } from '../../engine/AAREngine';
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip as RCTooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  ChevronDown, ChevronUp, Pin, Edit3, Copy, Trash2,
  AlertTriangle, CheckCircle2, Info, Clock, TrendingUp,
  Package, ArrowRight, Download, Save,
  HelpCircle, BarChart2, ShieldAlert, ShieldCheck, ShieldX,
  Anchor, Wrench, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RightPanelProps {
  loads: Load3D[];
  selectedLoad: string | null;
  cogPosition: { x: number; y: number; z: number };
  axleData: { name: string; load: number; limit: number }[];
  efficiency: number;
  stabilityIdx: number;
  engineResult: EngineOutput;
  trendData: { t: string; v: number }[];
  onEditLoad: (id: string) => void;
  onDuplicateLoad: (id: string) => void;
  onRemoveLoad: (id: string) => void;
}

// ── COLLAPSIBLE SECTION ──────────────────────────────────────────────────────
function Section({ title, badge, defaultOpen = true, helpTip, children }: {
  title: string; badge?: React.ReactNode; defaultOpen?: boolean;
  helpTip?: string; children: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const bd = isDark ? '#1E2A38' : '#E2E8F0';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const tx = isDark ? '#64748B' : '#94A3B8';
  return (
    <div style={{ borderBottom: `1px solid ${bd}` }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left"
        style={{ fontSize: 12, fontWeight: 600, color: txP, fontFamily: 'Space Grotesk,sans-serif' }}
        onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(30,42,56,0.4)' : 'rgba(241,245,249,0.7)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <span className="flex items-center gap-2">
          {title}
          {badge}
          {helpTip && (
            <span title={helpTip} style={{ color: tx }}>
              <HelpCircle size={11} style={{ color: tx }} />
            </span>
          )}
        </span>
        {open ? <ChevronUp size={13} style={{ color: tx }} /> : <ChevronDown size={13} style={{ color: tx }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SVG ARC GAUGE ────────────────────────────────────────────────────────────
function ArcGauge({ value, max = 100, label, unit = '%', size = 130 }: {
  value: number; max?: number; label: string; unit?: string; size?: number;
}) {
  const { isDark } = useTheme();
  const pct = Math.min(value / max, 1);
  const r = 46, SW = 10, cx = size / 2, cy = size * 0.55;
  const C = 2 * Math.PI * r;
  const arc = C * 0.75;
  const filled = arc * pct;
  const trackColor = isDark ? '#1E2A38' : '#E2E8F0';
  const color = pct > 0.9 ? '#EF4444' : pct > 0.75 ? '#F59E0B' : '#10B981';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const tx = isDark ? '#64748B' : '#94A3B8';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={SW}
        strokeLinecap="round" strokeDasharray={`${arc} ${C}`}
        style={{ transform: `rotate(135deg)`, transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={SW}
        strokeLinecap="round" strokeDasharray={`${filled} ${C}`}
        style={{ transform: `rotate(135deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.6s ease' }} />
      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map(tick => {
        const tickPct = tick / 100;
        const angle = (135 + tickPct * 270) * Math.PI / 180;
        const innerR = r - SW / 2 - 3, outerR = r + SW / 2 + 3;
        return (
          <line key={tick}
            x1={cx + innerR * Math.cos(angle)} y1={cy + innerR * Math.sin(angle)}
            x2={cx + outerR * Math.cos(angle)} y2={cy + outerR * Math.sin(angle)}
            stroke={trackColor} strokeWidth={1.5} />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
        fill={txP} style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif' }}>
        {value}{unit}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle"
        fill={tx} style={{ fontSize: 9.5, fontFamily: 'Inter,sans-serif' }}>{label}</text>
      {/* Color band at bottom */}
      <text x={cx - 34} y={cy + r + 10} textAnchor="middle"
        fill={tx} style={{ fontSize: 8, fontFamily: 'JetBrains Mono,monospace' }}>0</text>
      <text x={cx + 34} y={cy + r + 10} textAnchor="middle"
        fill={tx} style={{ fontSize: 8, fontFamily: 'JetBrains Mono,monospace' }}>{max}</text>
    </svg>
  );
}

// ── DONUT GAUGE ──────────────────────────────────────────────────────────────
function DonutGauge({ value, label, size = 90 }: { value: number; label: string; size?: number }) {
  const { isDark } = useTheme();
  const r = 34, SW = 8, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  const filled = (value / 100) * C;
  const color = value > 80 ? '#10B981' : value > 60 ? '#F59E0B' : '#EF4444';
  const trackColor = isDark ? '#1E2A38' : '#E2E8F0';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const tx = isDark ? '#64748B' : '#94A3B8';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={SW} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={SW}
        strokeLinecap="round" strokeDasharray={`${filled} ${C}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.5s ease' }} />
      <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle"
        fill={color} style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif' }}>{value}</text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        fill={tx} style={{ fontSize: 8, fontFamily: 'Inter,sans-serif' }}>{label}</text>
    </svg>
  );
}

// ── WEIGHT DISTRIBUTION MINI-HEATMAP ────────────────────────────────────────
function WeightHeatmap({ loads, isDark, palette }: { loads: Load3D[]; isDark: boolean; palette: any }) {
  const GX = 10, GZ = 4;
  const cL = 20 / GX, cW = 3.2 / GZ;
  const grid: number[][] = Array.from({ length: GZ }, () => Array(GX).fill(0));
  let maxP = 0;
  loads.forEach(l => {
    for (let gx = 0; gx < GX; gx++) for (let gz = 0; gz < GZ; gz++) {
      const cx = gx * cL, cz = gz * cW;
      const ox = Math.min(l.x + l.w, cx + cL) - Math.max(l.x, cx);
      const oz = Math.min(l.z + l.d, cz + cW) - Math.max(l.z, cz);
      if (ox > 0 && oz > 0) { const pv = l.weight / (l.w * l.d) * (ox * oz) / (cL * cW); grid[gz][gx] += pv; maxP = Math.max(maxP, grid[gz][gx]); }
    }
  });
  const bd = isDark ? '#1E2A38' : '#E2E8F0';
  const CH = 14, CW = 22;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GX},${CW}px)`, gap: 1 }}>
        {Array.from({ length: GZ }, (_, gz) =>
          Array.from({ length: GX }, (_, gx) => {
            const pv = maxP > 0 ? grid[gz][gx] / maxP : 0;
            const r = pv < 0.5 ? ~~(pv * 2 * 239) : 239;
            const g = pv < 0.5 ? ~~(185 + pv * 2 * (68 - 185)) : ~~(68 * (1 - (pv - 0.5) * 2));
            const bl = pv < 0.5 ? ~~(129 * (1 - pv * 2)) : 0;
            const color = pv > 0 ? `rgba(${r},${g},${bl},${0.3 + pv * 0.7})` : (isDark ? '#0F1824' : '#F0F4FA');
            return (
              <div key={`${gz}-${gx}`} title={`${gx * 2}–${(gx + 1) * 2}m · Zone ${gz + 1}: ${(grid[gz][gx] / 1000).toFixed(1)}t/m²`}
                style={{ width: CW, height: CH, background: color, border: `0.5px solid ${bd}`, borderRadius: 2, cursor: 'default' }} />
            );
          })
        )}
      </div>
      <div className="flex justify-between mt-1.5">
        {['0m', '4m', '8m', '12m', '16m', '20m'].map(l => (
          <span key={l} style={{ fontSize: 8, color: isDark ? '#475569' : '#94A3B8', fontFamily: 'JetBrains Mono,monospace' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ── TIMELINE ─────────────────────────────────────────────────────────────────
const TIMELINE_ITEMS = [
  { time: '14:32:01', label: 'Job submitted', sub: 'OPT-2892 queued', status: 'done' },
  { time: '14:32:04', label: 'Pre-processing', sub: 'Validated 10 loads, 4 axle constraints', status: 'done' },
  { time: '14:32:08', label: 'Initial placement', sub: 'Bin-packing v3 — pass 1 of 3', status: 'done' },
  { time: '14:32:19', label: 'Constraint check', sub: '1 axle warning, 1 hazmat flag', status: 'done' },
  { time: '14:32:31', label: 'CoG balancing', sub: 'Shifted L-0443 by +0.3m', status: 'done' },
  { time: '14:32:41', label: 'Final validation', sub: 'All fragility + rotation rules satisfied', status: 'done' },
  { time: '14:32:44', label: 'Complete ✓', sub: 'Score 91.2%  ·  9.4 s total', status: 'current' },
];

// ── COMPARISON DELTA CHART ────────────────────────────────────────────────────
const COMPARISON_DATA = [
  { name: 'Efficiency', baseline: 82, current: 91 },
  { name: 'Balance', baseline: 74, current: 88 },
  { name: 'Cost Save', baseline: 63, current: 79 },
  { name: 'Violations', baseline: 5, current: 2 },
];

// ── MAIN RIGHT PANEL ─────────────────────────────────────────────────────────
export function RightPanel({
  loads, selectedLoad, cogPosition, axleData, efficiency,
  stabilityIdx, engineResult, trendData, onEditLoad, onDuplicateLoad, onRemoveLoad,
}: RightPanelProps) {
  const { isDark, palette } = useTheme();
  const [pinnedLoad, setPinnedLoad] = useState(false);

  const bd = isDark ? '#1E2A38' : '#E2E8F0';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const tx = isDark ? '#64748B' : '#94A3B8';
  const panelBg = isDark ? '#0A1018' : '#FFFFFF';
  const rowHov = isDark ? '#0D1520' : '#F8FAFC';

  const selLoad = loads.find(l => l.id === selectedLoad);
  const totalWeight = loads.reduce((a, l) => a + l.weight, 0);
  const volUsed = loads.reduce((a, l) => a + l.volume, 0);
  const volTotal = 20 * 3.2 * 2.4; // approximate total volume in m³

  const customTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: isDark ? '#1E2A38' : '#fff', border: `1px solid ${bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>
        <div style={{ color: txP, fontWeight: 600 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()} {p.name.includes('load') ? 'kg' : ''}</div>
        ))}
      </div>
    );
  }, [isDark, bd, txP]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: panelBg, borderLeft: `1px solid ${bd}` }}>
      {/* Sticky header */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${bd}`, background: panelBg }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: txP, fontFamily: 'Space Grotesk,sans-serif' }}>Analytics</div>
          <div style={{ fontSize: 10.5, color: tx }}>OPT-2892 · Live results</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: '#10B98115', border: '1px solid #10B98130' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>LIVE</span>
          </div>
          <div style={{ fontSize: 11, color: palette.accent, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
            {efficiency.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${isDark ? '#1E2A38' : '#CBD5E1'} transparent` }}>

        {/* ── Selected Load Summary ─────────────────────────────────── */}
        <AnimatePresence>
          {selLoad && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
              style={{ borderBottom: `1px solid ${bd}`, overflow: 'hidden' }}>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, background: selLoad.color, borderRadius: 2 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: txP }}>{selLoad.name}</div>
                      <div style={{ fontSize: 10, color: selLoad.color, fontFamily: 'JetBrains Mono,monospace' }}>{selLoad.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPinnedLoad(v => !v)} title="Pin this panel"
                      style={{ color: pinnedLoad ? palette.primary : tx, padding: 4 }}>
                      <Pin size={12} style={{ transform: pinnedLoad ? 'rotate(-45deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {selLoad.hasViolation && <AlertTriangle size={12} style={{ color: '#F59E0B' }} />}
                  </div>
                </div>
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { l: 'Weight', v: `${(selLoad.weight / 1000).toFixed(1)}t`, c: undefined },
                    { l: 'Volume', v: `${selLoad.volume.toFixed(1)}m³`, c: undefined },
                    { l: 'Priority', v: `${selLoad.priority}/10`, c: selLoad.priority >= 8 ? '#EF4444' : selLoad.priority >= 5 ? '#F59E0B' : '#10B981' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="rounded-lg p-2 text-center" style={{ background: isDark ? '#0F1824' : '#F8FAFC', border: `1px solid ${bd}` }}>
                      <div style={{ fontSize: 9.5, color: tx }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c || palette.accent, fontFamily: 'Space Grotesk,sans-serif' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {/* Detail rows */}
                {[
                  { l: 'Customer', v: selLoad.customer },
                  { l: 'Fragile', v: selLoad.fragile ? 'Yes' : 'No', c: selLoad.fragile ? '#F59E0B' : '#10B981' },
                  { l: 'Rotation', v: selLoad.rotationAllowed ? 'Allowed' : 'Fixed' },
                  { l: 'Stack Group', v: selLoad.stackGroup },
                  { l: 'Compat. Score', v: `${selLoad.compatScore}%`, c: selLoad.compatScore > 85 ? '#10B981' : '#F59E0B' },
                  { l: 'Position', v: `${selLoad.x.toFixed(1)}, ${selLoad.y.toFixed(1)}, ${selLoad.z.toFixed(1)} m` },
                  { l: 'Dims', v: `${selLoad.w}×${selLoad.h}×${selLoad.d} m` },
                ].map(({ l, v, c }) => (
                  <div key={l} className="flex items-center justify-between py-1">
                    <span style={{ fontSize: 10.5, color: tx }}>{l}</span>
                    <span style={{ fontSize: 10.5, color: c || txP, fontFamily: 'JetBrains Mono,monospace', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                {/* Compat bar */}
                <div style={{ height: 3, background: isDark ? '#0F1824' : '#E8EEF5', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selLoad.compatScore}%`, background: selLoad.compatScore > 85 ? '#10B981' : '#F59E0B', borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {[
                    { icon: Edit3, label: 'Edit', fn: () => onEditLoad(selLoad.id) },
                    { icon: Copy, label: 'Dupe', fn: () => onDuplicateLoad(selLoad.id) },
                    { icon: Trash2, label: 'Remove', fn: () => onRemoveLoad(selLoad.id), danger: true },
                  ].map(({ icon: Icon, label, fn, danger }) => (
                    <button key={label} onClick={fn}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors"
                      style={{
                        fontSize: 11, fontFamily: 'Inter,sans-serif', fontWeight: 600,
                        background: danger ? '#EF444415' : (isDark ? '#1E2A38' : '#F1F5F9'),
                        color: danger ? '#EF4444' : txP,
                        border: `1px solid ${danger ? '#EF444430' : bd}`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      <Icon size={11} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Utilization Gauge ─────────────────────────────────────── */}
        <Section title="Volume Utilization" helpTip="% of available railcar volume occupied by loads">
          <div className="flex items-center gap-4">
            <ArcGauge value={efficiency} label="Loaded" size={124} />
            <div className="flex-1 space-y-2.5">
              {[
                { l: 'Loaded', v: `${volUsed.toFixed(1)} m³`, pct: efficiency, c: '#10B981' },
                { l: 'Empty', v: `${(volTotal - volUsed).toFixed(1)} m³`, pct: 100 - efficiency, c: isDark ? '#1E2A38' : '#E2E8F0' },
                { l: 'Total', v: `${volTotal.toFixed(0)} m³`, pct: 100, c: tx },
              ].map(({ l, v, pct, c }) => (
                <div key={l}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 10, color: tx }}>{l}</span>
                    <span style={{ fontSize: 10, color: c, fontFamily: 'JetBrains Mono,monospace' }}>{v}</span>
                  </div>
                  <div style={{ height: 3, background: isDark ? '#0F1824' : '#EEF2F9', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: c, transition: 'width 0.5s ease', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Axle Load Distribution ────────────────────────────────── */}
        <Section title="Axle Load Distribution" helpTip="Per-axle weight vs limit (22,500 kg each)">
          <div style={{ height: 110 }}>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={axleData} barSize={24} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E2A3840' : '#CBD5E140'} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: tx, fontFamily: 'Inter,sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tx }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}t`} />
                <RCTooltip content={customTooltip} />
                <ReferenceLine y={22500} stroke="#EF4444" strokeDasharray="4 3" strokeWidth={1.5}
                  label={{ value: 'LIMIT', position: 'right', fontSize: 8, fill: '#EF4444', fontFamily: 'JetBrains Mono,monospace' }} />
                <Bar dataKey="load" radius={[3, 3, 0, 0]} name="Axle load">
                  {axleData.map((d, i) => (
                    <Cell key={i} fill={d.load / d.limit > 0.95 ? '#EF4444' : d.load / d.limit > 0.85 ? '#F59E0B' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Axle ratio mini-bars */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {axleData.map((d, i) => {
              const ratio = d.load / d.limit;
              const c = ratio > 0.95 ? '#EF4444' : ratio > 0.85 ? '#F59E0B' : '#10B981';
              return (
                <div key={i}>
                  <div style={{ height: 2, background: isDark ? '#1E2A38' : '#E8EEF5', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ratio * 100}%`, background: c, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 8.5, color: c, textAlign: 'center', marginTop: 2, fontFamily: 'JetBrains Mono,monospace' }}>
                    {(ratio * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Center of Gravity ─────────────────────────────────────── */}
        <Section title="Center of Gravity" helpTip="CoG position relative to railcar centerline. Ideal: X≈10m, Z≈1.6m">
          <div className="flex items-center gap-4">
            <div className="relative rounded-lg overflow-hidden" style={{ width: 88, height: 56, background: isDark ? '#0F1824' : '#F0F5FA', border: `1px solid ${bd}`, flexShrink: 0 }}>
              {/* Mini top-down railcar outline */}
              <div style={{ position: 'absolute', inset: '4px 6px', border: `1px solid ${bd}`, borderRadius: 3 }} />
              {/* CoG dot */}
              <div style={{
                position: 'absolute',
                left: `${(cogPosition.x / 20) * 100}%`,
                top: `${(cogPosition.z / 3.2) * 100}%`,
                width: 10, height: 10,
                borderRadius: '50%', background: palette.primary,
                transform: 'translate(-50%,-50%)',
                boxShadow: `0 0 8px ${palette.primary}`,
                transition: 'left 0.3s ease, top 0.3s ease',
              }} />
              {/* Crosshair lines */}
              <div style={{ position: 'absolute', left: `${(cogPosition.x / 20) * 100}%`, top: 0, bottom: 0, width: 1, background: `${palette.primary}50`, transition: 'left 0.3s ease' }} />
              <div style={{ position: 'absolute', top: `${(cogPosition.z / 3.2) * 100}%`, left: 0, right: 0, height: 1, background: `${palette.primary}50`, transition: 'top 0.3s ease' }} />
              {/* Label */}
              <div style={{ position: 'absolute', bottom: 2, left: 4, fontSize: 7, color: isDark ? '#475569' : '#94A3B8', fontFamily: 'JetBrains Mono,monospace' }}>TOP VIEW</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                { ax: 'X (length)', v: cogPosition.x, range: 20, ideal: 10 },
                { ax: 'Z (width)', v: cogPosition.z, range: 3.2, ideal: 1.6 },
                { ax: 'Y (height)', v: cogPosition.y, range: 2.4, ideal: 0.8 },
              ].map(({ ax, v, range, ideal }) => {
                const dev = Math.abs(v - ideal) / ideal;
                const c = dev < 0.1 ? '#10B981' : dev < 0.25 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={ax}>
                    <div className="flex justify-between">
                      <span style={{ fontSize: 9.5, color: tx }}>{ax}</span>
                      <span style={{ fontSize: 9.5, color: c, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{v.toFixed(2)} m</span>
                    </div>
                    <div style={{ height: 3, background: isDark ? '#0F1824' : '#EEF2F9', borderRadius: 2, marginTop: 2, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${(v / range) * 100}%`, background: c, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Stability & Packing ───────────────────────────────────── */}
        <Section title="Stability & Packing">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <DonutGauge value={stabilityIdx} label="Stability" size={88} />
            </div>
            <div className="flex-1">
              {/* Packing efficiency stacked */}
              <div style={{ fontSize: 10, color: tx, marginBottom: 6 }}>Packing Efficiency</div>
              <div style={{ height: 20, borderRadius: 4, overflow: 'hidden', display: 'flex', background: isDark ? '#0F1824' : '#F0F5FA' }}>
                <div style={{ width: `${efficiency}%`, background: `linear-gradient(90deg, ${palette.primary}, #10B981)`, transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {efficiency > 15 && <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>{efficiency.toFixed(0)}%</span>}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {100 - efficiency > 15 && <span style={{ fontSize: 8, color: tx }}>{(100 - efficiency).toFixed(0)}%</span>}
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ fontSize: 8.5, color: palette.accent }}>● Occupied</span>
                <span style={{ fontSize: 8.5, color: tx }}>● Empty</span>
              </div>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { l: 'Total Weight', v: `${(totalWeight / 1000).toFixed(1)} t` },
                  { l: 'Load Count', v: `${loads.length} units` },
                  { l: 'Avg Priority', v: (loads.reduce((a, l) => a + l.priority, 0) / loads.length).toFixed(1) },
                  { l: 'Violations', v: `${engineResult.violations.filter(v => v.severity === 'warning').length}`, c: engineResult.violations.filter(v => v.severity === 'warning').length > 0 ? '#F59E0B' : '#10B981' },
                ].map(({ l, v, c }) => (
                  <div key={l} className="rounded-lg p-2" style={{ background: isDark ? '#0F1824' : '#F8FAFC', border: `1px solid ${bd}` }}>
                    <div style={{ fontSize: 9, color: tx }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c || txP, fontFamily: 'Space Grotesk,sans-serif' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Weight Distribution Heatmap ───────────────────────────── */}
        <Section title="Weight Distribution" defaultOpen={false} helpTip="Top-down density map of load mass distribution across the railcar length">
          <WeightHeatmap loads={loads} isDark={isDark} palette={palette} />
          <div className="flex items-center justify-between mt-3">
            {[{ l: 'Front ¼', pct: 32 }, { l: 'F-Mid', pct: 28 }, { l: 'R-Mid', pct: 24 }, { l: 'Rear ¼', pct: 16 }].map(({ l, pct }) => (
              <div key={l} className="text-center">
                <div style={{ fontSize: 8.5, color: tx }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: txP, fontFamily: 'Space Grotesk,sans-serif' }}>{pct}%</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Utilization Trend ─────────────────────────────────────── */}
        <Section title="Efficiency Trend" defaultOpen={false} helpTip="Load efficiency over the last 7 optimization runs">
          <div style={{ height: 80 }}>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.primary} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E2A3840' : '#CBD5E140'} vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 8.5, fill: tx }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8.5, fill: tx }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <RCTooltip content={customTooltip} />
                <Area type="monotone" dataKey="v" stroke={palette.primary} strokeWidth={2} fill="url(#trendGrad)" dot={{ r: 2.5, fill: palette.primary }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ── Constraint Violations ─────────────────────────────────── */}
        <Section title="AAR Constraint Status" badge={
          <span className="px-1.5 py-0.5 rounded text-xs" style={{
            background: engineResult.status === 'red' ? '#EF444420' : engineResult.status === 'yellow' ? '#F59E0B20' : '#10B98120',
            color: engineResult.status === 'red' ? '#EF4444' : engineResult.status === 'yellow' ? '#F59E0B' : '#10B981',
            fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
          }}>
            {engineResult.violations.filter(v => v.severity === 'error').length} errors · {engineResult.violations.filter(v => v.severity === 'warning').length} warnings
          </span>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {engineResult.violations.map((v, index) => {
              const Icon = v.severity === 'error' ? ShieldX : v.severity === 'warning' ? AlertTriangle : Info;
              const c = v.severity === 'error' ? '#EF4444' : v.severity === 'warning' ? '#F59E0B' : '#3B82F6';
              return (
                <div key={`${v.id}-${index}`} className="rounded-lg p-2.5" style={{ background: `${c}10`, border: `1px solid ${c}25` }}>
                  <div className="flex items-start gap-2">
                    <Icon size={12} style={{ color: c, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: txP }}>{v.rule}</div>
                      <div style={{ fontSize: 10, color: tx, marginTop: 1, lineHeight: 1.4 }}>{v.message}</div>
                      {v.value !== undefined && v.limit !== undefined && (
                        <div className="flex items-center gap-2 mt-1">
                          <div style={{ flex: 1, height: 3, background: isDark ? '#0F1824' : '#EEF2F9', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (v.value / v.limit) * 100)}%`, background: c, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono,monospace', color: c }}>{((v.value / v.limit) * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {v.affectedLoads.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {v.affectedLoads.slice(0, 5).map((lid, lidIndex) => (
                            <span key={`${lid}-${lidIndex}`} style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: c, background: `${c}20`, padding: '1px 5px', borderRadius: 3 }}>{lid}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {engineResult.violations.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#10B98110', border: '1px solid #10B98125' }}>
                <ShieldCheck size={14} style={{ color: '#10B981' }} />
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Fully AAR compliant — no violations</span>
              </div>
            )}
          </div>
        </Section>

        {/* ── Combined CG Gauge ─────────────────────────────────────── */}
        <Section title="Combined CG (AAR 3.5)" helpTip="Combined center of gravity must not exceed 98 inches above top of rail">
          <div className="flex items-center gap-4">
            <ArcGauge value={Math.round(engineResult.combinedCG * 10) / 10} max={engineResult.combinedCGLimit} label="Above Rail" unit='"' size={124} />
            <div className="flex-1 space-y-2">
              {[
                { l: 'Combined CG', v: `${engineResult.combinedCG.toFixed(1)}"`, c: engineResult.combinedCG > 98 ? '#EF4444' : engineResult.combinedCG > 88 ? '#F59E0B' : '#10B981' },
                { l: 'AAR Limit', v: '98.0"', c: tx },
                { l: 'Headroom', v: `${(98 - engineResult.combinedCG).toFixed(1)}"`, c: engineResult.combinedCG > 98 ? '#EF4444' : '#10B981' },
              ].map(({ l, v, c }) => (
                <div key={l} className="flex justify-between">
                  <span style={{ fontSize: 10, color: tx }}>{l}</span>
                  <span style={{ fontSize: 10, color: c, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Lateral Weight Distribution ────────────────────────────── */}
        <Section title="Lateral Balance (AAR 3.3)" helpTip="Crosswise weight must be approximately equal. >5% warning, >10% blocked">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 text-center rounded-lg p-2" style={{ background: isDark ? '#0F1824' : '#F8FAFC', border: `1px solid ${bd}` }}>
              <div style={{ fontSize: 9, color: tx }}>Left Side</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: txP, fontFamily: 'Space Grotesk,sans-serif' }}>{(engineResult.lateralImbalance.left / 1000).toFixed(1)}t</div>
            </div>
            <div className="text-center" style={{ fontSize: 11, fontWeight: 700, color: engineResult.lateralImbalance.percent > 10 ? '#EF4444' : engineResult.lateralImbalance.percent > 5 ? '#F59E0B' : '#10B981', fontFamily: 'JetBrains Mono,monospace' }}>
              {engineResult.lateralImbalance.percent.toFixed(1)}%
            </div>
            <div className="flex-1 text-center rounded-lg p-2" style={{ background: isDark ? '#0F1824' : '#F8FAFC', border: `1px solid ${bd}` }}>
              <div style={{ fontSize: 9, color: tx }}>Right Side</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: txP, fontFamily: 'Space Grotesk,sans-serif' }}>{(engineResult.lateralImbalance.right / 1000).toFixed(1)}t</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: isDark ? '#0F1824' : '#EEF2F9' }}>
            <div style={{ width: `${engineResult.lateralImbalance.left / (engineResult.lateralImbalance.left + engineResult.lateralImbalance.right) * 100}%`, background: '#3B82F6', transition: 'width 0.4s' }} />
            <div style={{ flex: 1, background: '#10B981' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span style={{ fontSize: 8, color: '#3B82F6' }}>Left</span>
            <span style={{ fontSize: 8, color: '#10B981' }}>Right</span>
          </div>
        </Section>

        {/* ── Endwall Force Meter ────────────────────────────────────── */}
        <Section title="Endwall Force (Table 3.1)" defaultOpen={false} helpTip="Longitudinal force under switching shock must not exceed limit">
          <div className="flex items-center gap-4">
            <ArcGauge value={Math.round(engineResult.endwallForce / 1000)} max={Math.round(engineResult.endwallForceLimit / 1000)} label="Klbs Force" unit="K" size={110} />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <span style={{ fontSize: 10, color: tx }}>Calculated</span>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: engineResult.endwallForce > engineResult.endwallForceLimit ? '#EF4444' : '#10B981' }}>{(engineResult.endwallForce / 1000).toFixed(0)}K lbs</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 10, color: tx }}>Limit</span>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: tx }}>{(engineResult.endwallForceLimit / 1000).toFixed(0)}K lbs</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 10, color: tx }}>Utilization</span>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: (engineResult.endwallForce / engineResult.endwallForceLimit) > 0.8 ? '#F59E0B' : '#10B981' }}>
                  {((engineResult.endwallForce / engineResult.endwallForceLimit) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Truck Weight Distribution ──────────────────────────────── */}
        <Section title="Truck Weights (AAR 3.2)" defaultOpen={false} helpTip="Each truck must not exceed 50% of car load limit">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Front Truck', v: engineResult.truckWeights.front, pct: engineResult.truckWeights.frontPercent },
              { l: 'Rear Truck', v: engineResult.truckWeights.rear, pct: engineResult.truckWeights.rearPercent },
            ].map(({ l, v, pct }) => {
              const c = pct > 100 ? '#EF4444' : pct > 90 ? '#F59E0B' : '#10B981';
              return (
                <div key={l} className="rounded-lg p-3" style={{ background: isDark ? '#0F1824' : '#F8FAFC', border: `1px solid ${bd}` }}>
                  <div style={{ fontSize: 9, color: tx, marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c, fontFamily: 'Space Grotesk,sans-serif' }}>{(v / 1000).toFixed(1)}t</div>
                  <div style={{ height: 3, background: isDark ? '#1E2A38' : '#EEF2F9', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: c, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 8, color: c, marginTop: 2, fontFamily: 'JetBrains Mono,monospace' }}>{pct.toFixed(0)}% of limit</div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Shock Simulation ────────────────────────────────────────── */}
        <Section title="Shock Simulation" defaultOpen={false} helpTip="Simulated switching impact force over time (4G shock per AAR)">
          <div style={{ height: 90 }}>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={engineResult.shockSimulation} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E2A3840' : '#CBD5E140'} vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: tx }} axisLine={false} tickLine={false} tickFormatter={v => `${v}s`} />
                <YAxis tick={{ fontSize: 8, fill: tx }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} />
                <RCTooltip content={customTooltip} />
                <Line type="monotone" dataKey="force" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Force (Klbs)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ── Blocking & Strapping Recommendations ────────────────────── */}
        {(engineResult.recommendedBlocking.length > 0 || engineResult.requiredStrapping.length > 0) && (
          <Section title="Blocking & Strapping" defaultOpen={false} helpTip="Required securing methods per AAR loading standards">
            <div className="space-y-2">
              {engineResult.recommendedBlocking.map((b, i) => (
                <div key={`b-${i}`} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: '#F59E0B10', border: '1px solid #F59E0B20' }}>
                  <Anchor size={11} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 10, color: tx, lineHeight: 1.4 }}>{b}</span>
                </div>
              ))}
              {engineResult.requiredStrapping.map((s, i) => (
                <div key={`s-${i}`} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: '#3B82F610', border: '1px solid #3B82F620' }}>
                  <Wrench size={11} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 10, color: tx, lineHeight: 1.4 }}>{s}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Engine Output JSON ──────────────────────────────────────── */}
        <Section title="Engine Output Status" defaultOpen={false}>
          <div className="rounded-lg p-3 overflow-x-auto" style={{ background: isDark ? '#050810' : '#F0F4FA', border: `1px solid ${bd}` }}>
            <pre style={{ fontSize: 8.5, color: isDark ? '#64748B' : '#475569', fontFamily: 'JetBrains Mono,monospace', margin: 0, lineHeight: 1.6 }}>
              {JSON.stringify({
                compliant: engineResult.compliant,
                status: engineResult.status,
                violations: engineResult.violations.map(v => v.id),
                combinedCG: Math.round(engineResult.combinedCG * 10) / 10,
                truckWeights: engineResult.truckWeights,
                lateralImbalancePercent: engineResult.lateralImbalance.percent,
                endwallForce: engineResult.endwallForce,
                recommendedBlocking: engineResult.recommendedBlocking,
                requiredStrapping: engineResult.requiredStrapping,
                canExport: engineResult.canExport,
              }, null, 2)}
            </pre>
          </div>
        </Section>

        {/* ── Cost / Time Savings ───────────────────────────────────── */}
        <Section title="Savings vs Baseline" defaultOpen={false} helpTip="Comparison with manual/previous plan on same job">
          <div className="flex items-center gap-4 mb-3">
            {[
              { l: 'Cost Save', v: '$11.2K', icon: TrendingUp, c: '#10B981' },
              { l: 'Time Save', v: '2.4 hrs', icon: Clock, c: palette.primary },
            ].map(({ l, v, icon: Icon, c }) => (
              <div key={l} className="flex-1 rounded-lg p-3 text-center" style={{ background: `${c}12`, border: `1px solid ${c}25` }}>
                <Icon size={14} style={{ color: c, margin: '0 auto 4px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: 'Space Grotesk,sans-serif' }}>{v}</div>
                <div style={{ fontSize: 9.5, color: tx }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={COMPARISON_DATA} layout="vertical" margin={{ top: 0, right: 4, left: -8, bottom: 0 }} barSize={7}>
                <XAxis type="number" tick={{ fontSize: 8, fill: tx }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: tx, fontFamily: 'Inter,sans-serif' }} axisLine={false} tickLine={false} width={52} />
                <RCTooltip content={customTooltip} />
                <Bar dataKey="baseline" name="Baseline" fill={isDark ? '#1E2A38' : '#E2E8F0'} radius={[0, 2, 2, 0]} />
                <Bar dataKey="current" name="Current" fill={palette.primary} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ── Optimization Timeline ─────────────────────────────────── */}
        <Section title="Optimization Steps" defaultOpen={false}>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 1.5, background: isDark ? '#1E2A38' : '#E2E8F0', borderRadius: 1 }} />
            {TIMELINE_ITEMS.map((item, i) => (
              <div key={i} className="flex gap-3 mb-3 last:mb-0" style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -13, top: 3, width: 8, height: 8, borderRadius: '50%',
                  background: item.status === 'current' ? palette.primary : '#10B981',
                  border: `1.5px solid ${isDark ? '#0A1018' : '#fff'}`,
                  boxShadow: item.status === 'current' ? `0 0 6px ${palette.primary}` : 'none',
                }} />
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: item.status === 'current' ? palette.accent : txP }}>{item.label}</div>
                  <div style={{ fontSize: 9.5, color: tx, marginTop: 1 }}>{item.sub}</div>
                  <div style={{ fontSize: 8.5, color: isDark ? '#374151' : '#CBD5E1', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Load Manifest Table ───────────────────────────────────── */}
        <Section title="Load Manifest" defaultOpen={false}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${bd}` }}>
                  {['ID', 'Weight', 'Pos X', 'Score', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 6px', color: tx, fontWeight: 600, letterSpacing: '0.04em', fontSize: 9, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loads.map(l => (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${isDark ? '#0F1824' : '#F8FAFC'}`, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = rowHov)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '5px 6px', fontFamily: 'JetBrains Mono,monospace', color: l.color, fontWeight: 700 }}>{l.id}</td>
                    <td style={{ padding: '5px 6px', color: txP, fontFamily: 'JetBrains Mono,monospace' }}>{(l.weight / 1000).toFixed(1)}t</td>
                    <td style={{ padding: '5px 6px', color: tx, fontFamily: 'JetBrains Mono,monospace' }}>{l.x.toFixed(1)}m</td>
                    <td style={{ padding: '5px 6px' }}>
                      <span style={{ color: l.compatScore > 85 ? '#10B981' : '#F59E0B', fontFamily: 'JetBrains Mono,monospace' }}>{l.compatScore}%</span>
                    </td>
                    <td style={{ padding: '5px 6px' }}>
                      {l.hasViolation
                        ? <span style={{ color: '#F59E0B', fontSize: 9 }}>⚠ Warn</span>
                        : <span style={{ color: '#10B981', fontSize: 9 }}>✓ OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Export Controls ───────────────────────────────────────── */}
        <Section title="Export & Save" defaultOpen={false}>
          <div className="space-y-2">
            {[
              { label: 'Export PDF Report', icon: Download, desc: 'Full analytics + 3D snapshots' },
              { label: 'Export CSV Data', icon: BarChart2, desc: 'Load manifest with positions' },
              { label: 'Export GLTF Scene', icon: Package, desc: '3D scene for Vectary / Blender' },
              { label: 'Save as Template', icon: Save, desc: 'Reuse this configuration' },
            ].map(({ label, icon: Icon, desc }) => (
              <button key={label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
                style={{ border: `1px solid ${bd}`, background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A3840' : '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Icon size={14} style={{ color: palette.primary, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: txP }}>{label}</div>
                  <div style={{ fontSize: 9.5, color: tx }}>{desc}</div>
                </div>
                <ArrowRight size={11} style={{ color: tx, marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </Section>

        {/* ── DEV Handoff Note ─────────────────────────────────────── */}
        <Section title="Dev Handoff — JSON Schema" defaultOpen={false}>
          <div className="rounded-lg p-3 overflow-x-auto" style={{ background: isDark ? '#050810' : '#F0F4FA', border: `1px solid ${bd}` }}>
            <pre style={{ fontSize: 9, color: isDark ? '#64748B' : '#475569', fontFamily: 'JetBrains Mono,monospace', margin: 0, lineHeight: 1.6 }}>
              {`{
  "id": "L-0441",
  "dimensions": {
    "w": 2100, "h": 1800, "d": 2200
  },
  "weightKg": 12400,
  "fragile": false,
  "rotationAllowed": false,
  "stackGroup": "A",
  "position": {
    "x": 0.3, "y": 0.0, "z": 0.3
  }
}`}
            </pre>
          </div>
          <div style={{ marginTop: 8, fontSize: 9.5, color: tx, lineHeight: 1.6 }}>
            Hooks: <code style={{ fontFamily: 'JetBrains Mono,monospace', color: palette.accent }}>onDragStart(loadId)</code>, <code style={{ fontFamily: 'JetBrains Mono,monospace', color: palette.accent }}>onDrop(payload)</code>, <code style={{ fontFamily: 'JetBrains Mono,monospace', color: palette.accent }}>onAutoBalance()</code>
          </div>
        </Section>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}