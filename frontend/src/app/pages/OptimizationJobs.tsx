import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight, ChevronLeft, Check, Truck, Package, Settings,
  Zap, CheckSquare, Square, AlertTriangle, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard } from '../components/ui/OLCard';
import { OLButton } from '../components/ui/OLButton';
import { toast } from 'sonner';
import { fetchVehicles, fetchLoads, runOptimization, type VehicleRow, type LoadRow } from '../services/domainApi';

const STEPS = [
  { id: 1, label: 'Select Vehicle', icon: Truck },
  { id: 2, label: 'Select Loads', icon: Package },
  { id: 3, label: 'Configure Constraints', icon: Settings },
];

const CONSTRAINTS = [
  { key: 'weightBalance', label: 'Weight Distribution Balancing', desc: 'Optimize axle load distribution', type: 'toggle' as const, default: true },
  { key: 'stackRules', label: 'Enforce Stack Rules', desc: 'Apply fragility and stackability constraints', type: 'toggle' as const, default: true },
  { key: 'hazmatSeparation', label: 'Hazmat Separation', desc: 'Keep hazardous materials isolated', type: 'toggle' as const, default: false },
  { key: 'priorityOrder', label: 'Priority-Based Loading', desc: 'Load high-priority items first', type: 'toggle' as const, default: true },
];

function fmtDims(d: Record<string, unknown>) {
  const L = Number(d.length ?? 0);
  const W = Number(d.width ?? 0);
  const H = Number(d.height ?? 0);
  return `${L} × ${W} × ${H}`;
}

export function OptimizationJobs() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedLoads, setSelectedLoads] = useState<Set<number>>(new Set());
  const [constraints, setConstraints] = useState<Record<string, boolean | number>>(
    Object.fromEntries(CONSTRAINTS.map(c => [c.key, c.default])),
  );
  const [running, setRunning] = useState(false);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const rowHover = isDark ? '#161D2A' : '#F8FAFC';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListError(null);
      setListLoading(true);
      try {
        const [v, l] = await Promise.all([fetchVehicles(1, 200), fetchLoads(1, 200)]);
        if (cancelled) return;
        setVehicles(v.items);
        setLoads(l.items);
      } catch (e) {
        if (!cancelled) setListError(e instanceof Error ? e.message : 'Failed to load fleet data');
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalWeight = useMemo(
    () => loads.filter(l => selectedLoads.has(l.id)).reduce((a, l) => a + l.weight * l.quantity, 0),
    [loads, selectedLoads],
  );

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) ?? null;

  const toggleLoad = (id: number) => {
    const s = new Set(selectedLoads);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedLoads(s);
  };

  const handleRun = async () => {
    if (selectedVehicleId == null || selectedLoads.size === 0) {
      toast.error('Select one vehicle and at least one load.');
      return;
    }
    setRunning(true);
    try {
      const res = await runOptimization(selectedVehicleId, [...selectedLoads]);
      toast.success(`Optimization #${res.id} started`);
      navigate(`/jobs/processing?id=${res.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!value)} style={{ color: value ? palette.primary : text }}>
      {value ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
    </button>
  );

  if (listLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-24 rounded-xl mb-6" style={{ background: border }} />
        <div className="animate-pulse h-64 rounded-xl" style={{ background: border }} />
      </div>
    );
  }

  if (listError) {
    return (
      <div className="p-6">
        <OLCard padding="24px">
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>Could not load vehicles or loads</div>
          <div style={{ color: text, fontSize: 13 }}>{listError}</div>
        </OLCard>
      </div>
    );
  }

  return (
    <div className="p-6">
      <OLCard padding="20px" style={{ marginBottom: 24 }}>
        <div className="flex items-center">
          {STEPS.flatMap((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            const Icon = s.icon;
            const items: React.ReactNode[] = [
              <div key={`step-${s.id}`} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    background: done ? palette.primary : active ? `${palette.primary}20` : isDark ? '#1E2A38' : '#F1F5F9',
                    border: `2px solid ${done || active ? palette.primary : border}`,
                    color: done ? '#fff' : active ? palette.primary : text,
                    transition: 'all 0.2s',
                  }}
                >
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step {s.id}</div>
                  <div style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? textPrimary : text }}>{s.label}</div>
                </div>
              </div>,
            ];
            if (i < STEPS.length - 1) {
              items.push(
                <div key={`connector-${s.id}`} className="flex-1 mx-4" style={{ height: 2, background: step > s.id + 1 ? palette.primary : border, transition: 'background 0.3s' }} />,
              );
            }
            return items;
          })}
        </div>
      </OLCard>

      {step === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OLCard padding="0">
              <div className="p-4" style={{ borderBottom: `1px solid ${border}` }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Vehicles (GET /vehicles)</div>
                <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>Select exactly one vehicle — POST /optimization/run uses vehicle_id</div>
              </div>
              {vehicles.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: text }}>No vehicles in your organization.</div>
              ) : (
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      <th className="px-4 py-3 w-10" />
                      {['ID', 'Type', 'Capacity', 'Dimensions'].map(h => (
                        <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => {
                      const sel = selectedVehicleId === v.id;
                      return (
                        <tr
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          style={{ borderBottom: `1px solid ${border}`, cursor: 'pointer', background: sel ? `${palette.primary}10` : 'transparent' }}
                          onMouseEnter={e => {
                            if (!sel) e.currentTarget.style.background = rowHover;
                          }}
                          onMouseLeave={e => {
                            if (!sel) e.currentTarget.style.background = 'transparent';
                          }}
                          className="transition-colors"
                        >
                          <td className="px-4 py-3">{sel ? <CheckSquare size={16} style={{ color: palette.primary }} /> : <Square size={16} style={{ color: text }} />}</td>
                          <td className="px-4 py-3">
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent }}>#{v.id}</span>
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '12px', color: text }}>{v.type}</td>
                          <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary }}>{v.capacity}</td>
                          <td className="px-4 py-3" style={{ fontSize: '11px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{fmtDims(v.dimensions)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </OLCard>
          </div>
          <div>
            <OLCard padding="20px">
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary, marginBottom: 16 }}>Selected</div>
              {!selectedVehicle ? (
                <div className="flex flex-col items-center py-8" style={{ color: text }}>
                  <Truck size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <span style={{ fontSize: '12px' }}>No vehicle selected</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg" style={{ background: isDark ? '#161D2A' : '#F8FAFC', border: `1px solid ${border}` }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: textPrimary }}>#{selectedVehicle.id}</div>
                  <div style={{ fontSize: '11px', color: text }}>{selectedVehicle.type} · cap {selectedVehicle.capacity}</div>
                </div>
              )}
            </OLCard>
          </div>
        </div>
      )}

      {step === 2 && (
        <OLCard padding="0">
          <div className="p-4" style={{ borderBottom: `1px solid ${border}` }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Loads (GET /loads)</div>
            <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>
              Total selected weight:{' '}
              <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: textPrimary }}>{totalWeight.toLocaleString()} kg</strong>
            </div>
          </div>
          {loads.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: text }}>No loads in your organization.</div>
          ) : (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  <th className="px-4 py-3 w-10" />
                  {['ID', 'Type', 'Weight', 'Qty', 'Dimensions'].map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loads.map(l => (
                  <tr
                    key={l.id}
                    onClick={() => toggleLoad(l.id)}
                    style={{ borderBottom: `1px solid ${border}`, cursor: 'pointer', background: selectedLoads.has(l.id) ? `${palette.primary}10` : 'transparent' }}
                    onMouseEnter={e => {
                      if (!selectedLoads.has(l.id)) e.currentTarget.style.background = rowHover;
                    }}
                    onMouseLeave={e => {
                      if (!selectedLoads.has(l.id)) e.currentTarget.style.background = 'transparent';
                    }}
                    className="transition-colors"
                  >
                    <td className="px-4 py-3">{selectedLoads.has(l.id) ? <CheckSquare size={16} style={{ color: palette.primary }} /> : <Square size={16} style={{ color: text }} />}</td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent }}>#{l.id}</span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: '12px', color: text }}>{l.type}</td>
                    <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{l.weight.toLocaleString()}</td>
                    <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary }}>{l.quantity}</td>
                    <td className="px-4 py-3" style={{ fontSize: '11px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{fmtDims(l.dimensions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OLCard>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OLCard padding="20px">
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary, marginBottom: 20 }}>
                Constraint preferences (client-only — not sent to API yet)
              </div>
              <div className="space-y-4">
                {CONSTRAINTS.map(c => (
                  <div key={c.key} className="flex items-start justify-between gap-4 pb-4" style={{ borderBottom: `1px solid ${border}` }}>
                    <div className="flex-1">
                      <div style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{c.label}</div>
                      <div style={{ fontSize: '11px', color: text, marginTop: 2 }}>{c.desc}</div>
                    </div>
                    <Toggle value={!!constraints[c.key]} onChange={v => setConstraints({ ...constraints, [c.key]: v })} />
                  </div>
                ))}
              </div>
            </OLCard>
          </div>
          <div>
            <OLCard padding="20px">
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary, marginBottom: 16 }}>Job summary</div>
              <div className="space-y-3">
                {[
                  { label: 'Vehicle', value: selectedVehicle ? `#${selectedVehicle.id}` : '—' },
                  { label: 'Loads', value: `${selectedLoads.size} selected` },
                  { label: 'Total weight', value: `${totalWeight.toLocaleString()} kg` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ fontSize: '12px', color: text }}>{label}</span>
                    <span style={{ fontSize: '12px', color: textPrimary, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <OLButton
                  variant="primary"
                  size="lg"
                  icon={<Zap size={16} />}
                  loading={running}
                  onClick={handleRun}
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={selectedVehicleId == null || selectedLoads.size === 0}
                >
                  Run optimization (POST /optimization/run)
                </OLButton>
                {(selectedVehicleId == null || selectedLoads.size === 0) && (
                  <div className="flex items-center gap-1.5 mt-2" style={{ fontSize: '11px', color: '#F59E0B' }}>
                    <AlertTriangle size={12} />
                    Pick one vehicle and one or more loads
                  </div>
                )}
              </div>
            </OLCard>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <OLButton variant="secondary" size="md" icon={<ChevronLeft size={16} />} onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}>
          Previous
        </OLButton>
        {step < 3 && (
          <OLButton variant="primary" size="md" iconRight={<ChevronRight size={16} />} onClick={() => setStep(step + 1)}>
            Next step
          </OLButton>
        )}
      </div>
    </div>
  );
}