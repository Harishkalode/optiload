import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight, ChevronLeft, Check, Truck, Package, Settings,
  Play, CheckSquare, Square, AlertTriangle, Info, ToggleLeft, ToggleRight,
  Zap, Plus, X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import { validateOptimizationSetup } from '../engine/AAREngine';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, label: 'Select Vehicles', icon: Truck },
  { id: 2, label: 'Select Loads', icon: Package },
  { id: 3, label: 'Configure Constraints', icon: Settings },
];

const VEHICLES = [
  { id: 'V-001', name: 'Flatcar Alpha-7', type: 'Flatcar', capacity: '80,000 kg', dims: '20.0 × 3.2 × 1.8m', status: 'active' },
  { id: 'V-002', name: 'Boxcar Bravo-12', type: 'Boxcar', capacity: '65,000 kg', dims: '15.0 × 2.8 × 3.2m', status: 'active' },
  { id: 'V-004', name: 'Hopper Echo-9', type: 'Hopper', capacity: '100,000 kg', dims: '18.5 × 3.0 × 3.6m', status: 'active' },
  { id: 'V-006', name: 'Gondola Golf-5', type: 'Gondola', capacity: '90,000 kg', dims: '16.8 × 3.0 × 2.5m', status: 'active' },
];

const LOADS = [
  { id: 'L-0441', name: 'Steel Coil Batch A', weight: 12400, dims: '2.1 × 1.8 × 1.8m', priority: 8, conflict: false },
  { id: 'L-0442', name: 'Automotive Parts Box', weight: 840, dims: '1.2 × 0.8 × 1.0m', priority: 6, conflict: false },
  { id: 'L-0443', name: 'Grain Bulk Unit', weight: 24000, dims: '3.0 × 2.4 × 2.0m', priority: 9, conflict: false },
  { id: 'L-0444', name: 'Chemical Drums Set', weight: 2200, dims: '1.0 × 1.0 × 1.2m', priority: 7, conflict: true },
  { id: 'L-0445', name: 'Timber Planks Bundle', weight: 3600, dims: '4.0 × 0.6 × 0.5m', priority: 4, conflict: false },
  { id: 'L-0446', name: 'Machinery Crate', weight: 18000, dims: '2.4 × 1.6 × 2.0m', priority: 10, conflict: false },
];

const CONSTRAINTS = [
  { key: 'weightBalance', label: 'Weight Distribution Balancing', desc: 'Optimize axle load distribution', type: 'toggle', default: true },
  { key: 'stackRules', label: 'Enforce Stack Rules', desc: 'Apply fragility and stackability constraints', type: 'toggle', default: true },
  { key: 'hazmatSeparation', label: 'Hazmat Separation', desc: 'Keep hazardous materials isolated', type: 'toggle', default: false },
  { key: 'priorityOrder', label: 'Priority-Based Loading', desc: 'Load high-priority items first', type: 'toggle', default: true },
  { key: 'rotationAllowed', label: 'Allow Rotation', desc: 'Permit 90° load rotation for better fit', type: 'toggle', default: true },
  { key: 'maxOverhang', label: 'Max Overhang', desc: 'Maximum allowable load overhang (cm)', type: 'slider', default: 30, min: 0, max: 100, unit: 'cm' },
  { key: 'weightTolerance', label: 'Weight Tolerance', desc: 'Acceptable load weight variance (%)', type: 'slider', default: 5, min: 0, max: 20, unit: '%' },
];

export function OptimizationJobs() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(new Set());
  const [constraints, setConstraints] = useState<Record<string, any>>(
    Object.fromEntries(CONSTRAINTS.map(c => [c.key, c.default]))
  );
  const [running, setRunning] = useState(false);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const rowHover = isDark ? '#161D2A' : '#F8FAFC';

  const toggleVehicle = (id: string) => {
    const s = new Set(selectedVehicles);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedVehicles(s);
  };

  const toggleLoad = (id: string) => {
    const s = new Set(selectedLoads);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedLoads(s);
  };

  const totalWeight = LOADS.filter(l => selectedLoads.has(l.id)).reduce((a, l) => a + l.weight, 0);
  const selectedVehicleData = VEHICLES.filter(v => selectedVehicles.has(v.id));

  const handleRun = async () => {
    // Pre-run validation
    const selectedLoadData = LOADS.filter(l => selectedLoads.has(l.id)).map(l => {
      const [w, h, d] = l.dims.replace(/m/g, '').split(' × ').map(Number);
      return { id: l.id, weight: l.weight, w: w || 1, h: h || 1, d: d || 1, x: 0, y: 0, z: 0 };
    });
    const errors = validateOptimizationSetup(selectedVehicles.size, selectedLoadData);
    if (Object.keys(errors).length > 0) {
      if (errors.vehicles) toast.error(errors.vehicles);
      if (errors.loads) toast.error(errors.loads);
      if (errors.weights) toast.error(errors.weights);
      if (errors.dimensions) toast.error(errors.dimensions);
      if (errors.overlaps) toast.error(errors.overlaps);
      return;
    }
    setRunning(true);
    await new Promise(r => setTimeout(r, 600));
    navigate('/jobs/processing');
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} style={{ color: value ? palette.primary : text }}>
      {value ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
    </button>
  );

  return (
    <div className="p-6">
      {/* Stepper */}
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
                  style={{ width: 36, height: 36, background: done ? palette.primary : active ? palette.primary + '20' : isDark ? '#1E2A38' : '#F1F5F9', border: `2px solid ${done || active ? palette.primary : border}`, color: done ? '#fff' : active ? palette.primary : text, transition: 'all 0.2s' }}
                >
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step {s.id}</div>
                  <div style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? textPrimary : text }}>{s.label}</div>
                </div>
              </div>
            ];
            if (i < STEPS.length - 1) {
              items.push(
                <div key={`connector-${s.id}`} className="flex-1 mx-4" style={{ height: 2, background: step > s.id + 1 ? palette.primary : border, transition: 'background 0.3s' }} />
              );
            }
            return items;
          })}
        </div>
      </OLCard>

      {/* Step Content */}
      {step === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OLCard padding="0">
              <div className="p-4" style={{ borderBottom: `1px solid ${border}` }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Available Vehicles</div>
                <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>Select one or more vehicles for this optimization job</div>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th className="px-4 py-3 w-10" />
                    {['ID', 'Name', 'Type', 'Capacity', 'Dimensions'].map(h => (
                      <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VEHICLES.map(v => (
                    <tr key={v.id} onClick={() => toggleVehicle(v.id)} style={{ borderBottom: `1px solid ${border}`, cursor: 'pointer', background: selectedVehicles.has(v.id) ? palette.primary + '10' : 'transparent' }}
                      onMouseEnter={e => { if (!selectedVehicles.has(v.id)) e.currentTarget.style.background = rowHover; }}
                      onMouseLeave={e => { if (!selectedVehicles.has(v.id)) e.currentTarget.style.background = 'transparent'; }}
                      className="transition-colors"
                    >
                      <td className="px-4 py-3">
                        {selectedVehicles.has(v.id) ? <CheckSquare size={16} style={{ color: palette.primary }} /> : <Square size={16} style={{ color: text }} />}
                      </td>
                      <td className="px-4 py-3"><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent }}>{v.id}</span></td>
                      <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary, fontWeight: 500 }}>{v.name}</td>
                      <td className="px-4 py-3" style={{ fontSize: '12px', color: text }}>{v.type}</td>
                      <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary }}>{v.capacity}</td>
                      <td className="px-4 py-3" style={{ fontSize: '11px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{v.dims}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </OLCard>
          </div>

          {/* Capacity Panel */}
          <div>
            <OLCard padding="20px">
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary, marginBottom: 16 }}>Capacity Summary</div>
              {selectedVehicleData.length === 0 ? (
                <div className="flex flex-col items-center py-8" style={{ color: text }}>
                  <Truck size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <span style={{ fontSize: '12px' }}>No vehicles selected</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedVehicleData.map(v => (
                    <div key={v.id} className="p-3 rounded-lg" style={{ background: isDark ? '#161D2A' : '#F8FAFC', border: `1px solid ${border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: '12px', fontWeight: 500, color: textPrimary }}>{v.name}</span>
                        <button onClick={() => toggleVehicle(v.id)}><X size={12} style={{ color: text }} /></button>
                      </div>
                      <span style={{ fontSize: '11px', color: text }}>{v.capacity}</span>
                    </div>
                  ))}
                </div>
              )}
            </OLCard>
          </div>
        </div>
      )}

      {step === 2 && (
        <OLCard padding="0">
          <div className="p-4" style={{ borderBottom: `1px solid ${border}` }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary }}>Available Loads</div>
            <div style={{ fontSize: '12px', color: text, marginTop: 2 }}>
              Total selected weight: <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: textPrimary }}>{totalWeight.toLocaleString()} kg</strong>
            </div>
          </div>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                <th className="px-4 py-3 w-10" />
                {['ID', 'Name', 'Weight (kg)', 'Dimensions', 'Priority', 'Alerts'].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOADS.map(l => (
                <tr key={l.id} onClick={() => toggleLoad(l.id)} style={{ borderBottom: `1px solid ${border}`, cursor: 'pointer', background: selectedLoads.has(l.id) ? palette.primary + '10' : 'transparent' }}
                  onMouseEnter={e => { if (!selectedLoads.has(l.id)) e.currentTarget.style.background = rowHover; }}
                  onMouseLeave={e => { if (!selectedLoads.has(l.id)) e.currentTarget.style.background = 'transparent'; }}
                  className="transition-colors"
                >
                  <td className="px-4 py-3">
                    {selectedLoads.has(l.id) ? <CheckSquare size={16} style={{ color: palette.primary }} /> : <Square size={16} style={{ color: text }} />}
                  </td>
                  <td className="px-4 py-3"><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent }}>{l.id}</span></td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary, fontWeight: 500 }}>{l.name}</td>
                  <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{l.weight.toLocaleString()}</td>
                  <td className="px-4 py-3" style={{ fontSize: '11px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{l.dims}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} style={{ width: 4, height: 10, borderRadius: 2, background: i < l.priority ? (l.priority >= 8 ? '#EF4444' : l.priority >= 5 ? '#F59E0B' : '#10B981') : (isDark ? '#1E2A38' : '#E2E8F0') }} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.conflict && <span className="flex items-center gap-1 text-xs" style={{ color: '#F59E0B' }}><AlertTriangle size={12} />Conflict</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OLCard>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OLCard padding="20px">
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary, marginBottom: 20 }}>Constraint Configuration</div>
              <div className="space-y-4">
                {CONSTRAINTS.map(c => (
                  <div key={c.key} className="flex items-start justify-between gap-4 pb-4" style={{ borderBottom: `1px solid ${border}` }}>
                    <div className="flex-1">
                      <div style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{c.label}</div>
                      <div style={{ fontSize: '11px', color: text, marginTop: 2 }}>{c.desc}</div>
                      {c.type === 'slider' && (
                        <div className="mt-2 flex items-center gap-3">
                          <input type="range" min={c.min} max={c.max} value={constraints[c.key]}
                            onChange={e => setConstraints({ ...constraints, [c.key]: +e.target.value })}
                            className="flex-1" style={{ accentColor: palette.primary }} />
                          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: textPrimary, minWidth: 48 }}>{constraints[c.key]}{c.unit}</span>
                        </div>
                      )}
                    </div>
                    {c.type === 'toggle' && (
                      <Toggle value={constraints[c.key]} onChange={v => setConstraints({ ...constraints, [c.key]: v })} />
                    )}
                  </div>
                ))}
              </div>
            </OLCard>
          </div>

          {/* Summary */}
          <div>
            <OLCard padding="20px">
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary, marginBottom: 16 }}>Job Summary</div>
              <div className="space-y-3">
                {[
                  { label: 'Vehicles', value: `${selectedVehicles.size} selected` },
                  { label: 'Loads', value: `${selectedLoads.size} selected` },
                  { label: 'Total Weight', value: `${totalWeight.toLocaleString()} kg` },
                  { label: 'Algorithm', value: 'Bin-Packing v3' },
                  { label: 'Est. Runtime', value: '~45 seconds' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ fontSize: '12px', color: text }}>{label}</span>
                    <span style={{ fontSize: '12px', color: textPrimary, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <OLButton variant="primary" size="lg" icon={<Zap size={16} />} loading={running} onClick={handleRun}
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={selectedVehicles.size === 0 || selectedLoads.size === 0}
                >
                  Run Optimization
                </OLButton>
                {(selectedVehicles.size === 0 || selectedLoads.size === 0) && (
                  <div className="flex items-center gap-1.5 mt-2" style={{ fontSize: '11px', color: '#F59E0B' }}>
                    <AlertTriangle size={12} />
                    Select vehicles and loads to continue
                  </div>
                )}
              </div>
            </OLCard>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <OLButton variant="secondary" size="md" icon={<ChevronLeft size={16} />} onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}>
          Previous
        </OLButton>
        {step < 3 && (
          <OLButton variant="primary" size="md" iconRight={<ChevronRight size={16} />} onClick={() => setStep(step + 1)}>
            Next Step
          </OLButton>
        )}
      </div>
    </div>
  );
}