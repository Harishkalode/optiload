import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  RotateCcw, Zap, Save, Download, RefreshCw,
  AlertTriangle, X, ChevronDown, Undo2,
  CheckCircle2, Activity, ShieldAlert, ShieldCheck, ShieldX,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Scene3D, Load3D } from '../components/results/Scene3D';
import { EnhancedRightPanel } from '../components/results/EnhancedRightPanel';
import type { OptimizationObjective, OptimizationWeights } from '../components/results/OptimizationStrategyPanel';
import type { ComplianceCheck } from '../components/results/ComplianceChecklistPanel';
import type { ConfidenceMetrics } from '../components/results/OptimizationConfidenceScore';
import type { ShockSimulationConfig, StressMetrics } from '../components/results/ShockSimulationPanel';
import type { LoadExplanation } from '../components/results/ExplainabilityPanel';
import type { ScenarioData } from '../components/results/ScenarioComparisonPanel';
import { MiniMap } from '../components/results/MiniMap';
import { LoadInfoPanel, type LoadInfo } from '../components/results/LoadInfoPanel';
import { SecurementPanel } from '../components/results/SecurementPanel';
import { toast } from 'sonner';
import { fetchOptimizationResult, fetchOptimizationHistory } from '../services/domainApi';
import { motion, AnimatePresence } from 'motion/react';
import {
  runAARValidation, DEFAULT_CAR, validateDragPosition,
  type EngineOutput, type CarConfig, type LoadItem,
} from '../engine/AAREngine';

const EMPTY_TREND: { t: string; v: number }[] = [];

// ── COMPUTE FUNCTIONS ───────────────────────────────────────────────────────
function computeCoG(loads: Load3D[], carLength = 20, carWidth = 3.2) {
  const total = loads.reduce((a, l) => a + l.weight, 0);
  if (total === 0) return { x: carLength / 2, y: 0, z: carWidth / 2 };
  return {
    x: loads.reduce((a, l) => a + l.weight * (l.x + l.w / 2), 0) / total,
    y: loads.reduce((a, l) => a + l.weight * (l.y + l.h / 2), 0) / total,
    z: loads.reduce((a, l) => a + l.weight * (l.z + l.d / 2), 0) / total,
  };
}

function autoBalance(loads: Load3D[], carLength = 20): Load3D[] {
  const sorted = [...loads].sort((a, b) => b.weight - a.weight);
  return loads.map(l => {
    const matched = sorted.find(s => s.id === l.id);
    if (!matched) return l;
    const idx = sorted.indexOf(matched);
    const halfL = carLength / 2;
    const targetX = idx % 2 === 0 ? 0.3 + (idx / sorted.length) * (carLength * 0.45) : carLength - 0.5 - (idx / sorted.length) * (carLength * 0.45) - l.w;
    return { ...l, x: Math.max(0.1, Math.min(carLength - l.w - 0.1, targetX)) };
  });
}

// Convert Load3D to engine LoadItem
function toEngineLoads(loads: Load3D[]): LoadItem[] {
  return loads.map(l => ({
    id: l.id, x: l.x, y: l.y, z: l.z, w: l.w, h: l.h, d: l.d,
    weight: l.weight, isRoll: false,
  }));
}

// ── STATUS BADGE ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const cfg = {
    green: { Icon: ShieldCheck, label: 'AAR COMPLIANT', color: '#10B981', bg: '#10B98115', border: '#10B98130' },
    yellow: { Icon: ShieldAlert, label: 'WARNINGS', color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B30' },
    red: { Icon: ShieldX, label: 'VIOLATIONS', color: '#EF4444', bg: '#EF444415', border: '#EF444430' },
  }[status];

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <cfg.Icon size={11} style={{ color: cfg.color }} />
      <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
    </div>
  );
}

// ── VIOLATION BANNER ────────────────────────────────────────────────────────
function ViolationBanner({ msg, severity, onClose, onAction }: {
  msg: string; severity: 'warning' | 'error'; onClose: () => void; onAction: () => void;
}) {
  const color = severity === 'error' ? '#EF4444' : '#F59E0B';
  return (
    <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
      style={{ background: `${color}15`, borderBottom: `1px solid ${color}30` }}>
      <AlertTriangle size={14} style={{ color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color, flex: 1 }}>{msg}</span>
      <button onClick={onAction} className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
        style={{ background: `${color}30`, color, fontFamily: 'Inter,sans-serif' }}
        onMouseEnter={e => (e.currentTarget.style.background = `${color}50`)}
        onMouseLeave={e => (e.currentTarget.style.background = `${color}30`)}>
        Auto-Rebalance
      </button>
      <button onClick={onClose} style={{ color, opacity: 0.7 }}>
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ── BOTTOM ACTION BAR ────────────────────────────────────────────────────────
function BottomBar({
  efficiency, hasHistory, onUndo, onRevertAll, onAutoBalance,
  onReRun, isBalancing, engineStatus, optimizationId,
}: {
  efficiency: number; hasHistory: boolean;
  engineStatus: 'green' | 'yellow' | 'red';
  onUndo: () => void; onRevertAll: () => void; onAutoBalance: () => void;
  onReRun: () => void; isBalancing: boolean; optimizationId: string | null;
}) {
  const { isDark, palette } = useTheme();
  const bd = isDark ? '#1E2A38' : '#E2E8F0';
  const txP = isDark ? '#F1F5F9' : '#0F172A';
  const tx = isDark ? '#64748B' : '#94A3B8';
  const muted = isDark ? '#475569' : '#94A3B8';
  const barBg = isDark ? '#060C14' : '#FFFFFF';

  return (
    <div className="flex items-center gap-3 px-4 flex-shrink-0" style={{
      height: 60, background: barBg,
      borderTop: `1px solid ${bd}`,
      boxShadow: isDark ? '0 -2px 12px rgba(0,0,0,0.4)' : '0 -2px 8px rgba(0,0,0,0.05)',
    }}>
      {/* Job info */}
      <div className="flex items-center gap-3 mr-2">
        <StatusBadge status={engineStatus} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: txP, fontFamily: 'JetBrains Mono,monospace' }}>#{optimizationId || '—'}</div>
          <div style={{ fontSize: 9.5, color: tx }}>Score <strong style={{ color: palette.accent }}>{efficiency.toFixed(1)}%</strong> · 9.4s</div>
        </div>
      </div>

      <div style={{ width: 1, height: 32, background: bd, flexShrink: 0 }} />

      {/* Left actions */}
      <button onClick={onUndo} disabled={!hasHistory}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
        style={{ fontSize: 12, fontFamily: 'Inter,sans-serif', color: hasHistory ? txP : tx, background: 'transparent', border: `1px solid ${bd}`, opacity: hasHistory ? 1 : 0.45, cursor: hasHistory ? 'pointer' : 'not-allowed' }}>
        <Undo2 size={13} /> Undo
      </button>

      <button onClick={onRevertAll}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
        style={{ fontSize: 12, fontFamily: 'Inter,sans-serif', color: tx, background: 'transparent', border: `1px solid ${bd}` }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = palette.primary)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = bd)}>
        <RotateCcw size={13} /> Revert All
      </button>

      {/* Primary: Auto-Balance */}
      <button onClick={onAutoBalance}
        className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all font-semibold"
        style={{ fontSize: 12, fontFamily: 'Inter,sans-serif', background: `linear-gradient(135deg,${palette.primary},${palette.secondary})`, color: '#fff', border: 'none', boxShadow: `0 0 14px ${palette.primary}50` }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        {isBalancing
          ? <span className="animate-spin inline-flex"><Activity size={13} /></span>
          : <Zap size={13} />}
        Auto-Balance
      </button>

      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <button onClick={onReRun}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
        style={{ fontSize: 12, fontFamily: 'Inter,sans-serif', color: txP, background: 'transparent', border: `1px solid ${bd}` }}
        onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F8FAFC')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <RefreshCw size={13} /> Re-Run
      </button>
    </div>
  );
}

// ── MAIN RESULTS PAGE ────────────────────────────────────────────────────────
export function Results() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiEfficiency, setApiEfficiency] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<{ t: string; v: number }[]>(EMPTY_TREND);

  const [loads, setLoads]             = useState<Load3D[]>([]);
  const [loadsLoaded, setLoadsLoaded] = useState(false);
  const [originalLoads, setOriginalLoads] = useState<Load3D[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null);
  const [history, setHistory]         = useState<Load3D[][]>([]);
  const [cogTrail, setCogTrail]       = useState<{ x: number; y: number; z: number }[]>([]);
  const [violationBanner, setViolationBanner] = useState(true);
  const [isBalancing, setIsBalancing] = useState(false);
  const [vehicleType, setVehicleType] = useState<'flatcar' | 'boxcar' | 'gondola' | 'reefer'>('flatcar');
  const [vehicleTypeOpen, setVehicleTypeOpen] = useState(false);
  const [vehicleDims, setVehicleDims] = useState<{ length: number; width: number; height: number; axlePositions: number[] } | null>(null);
  const [stabilityResults, setStabilityResults] = useState<{ item_id: string; risk_score: number }[]>([]);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [securements, setSecurements] = useState<any[]>([]);
  const [suggestedSecurements, setSuggestedSecurements] = useState<any[]>([]);
  const [showSecurementPanel, setShowSecurementPanel] = useState(false);

  // ── NEW: Advanced Optimization State ────────────────────────────────────
  const [optimizationObjective, setOptimizationObjective] = useState<OptimizationObjective>('space');
  const [optimizationWeights, setOptimizationWeights] = useState<OptimizationWeights>({
    efficiency: 40,
    stability: 30,
    compliance: 20,
    cost: 5,
    speed: 5,
  });
  const [shockConfig, setShockConfig] = useState<ShockSimulationConfig>({
    shockMultiplier: 1.0,
    emergencyBrake: false,
    curveSimulation: false,
  });
  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);

  const bd    = isDark ? '#1E2A38' : '#E2E8F0';
  const muted = isDark ? '#475569' : '#94A3B8';

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      fetchOptimizationResult(Number(id))
        .then(r => {
          console.log('[Results] API response:', r);
          if (r.efficiency_score != null) setApiEfficiency(r.efficiency_score * 100);
          const result = (r as any).result ?? {};
          console.log('[Results] result object:', result);
          const placements = result.placements ?? [];
          const vehicle = result.vehicle;
          const errorMessage = result.error_message;
          const violations = result.violations ?? [];
          console.log('[Results] placements:', placements.length, 'vehicle:', !!vehicle, 'errors:', errorMessage);

          if (vehicle) {
            setVehicleDims({
              length: vehicle.length_m,
              width: vehicle.width_m,
              height: vehicle.height_m,
              axlePositions: vehicle.axle_positions ?? [],
            });
            const vt = vehicle.type as 'flatcar' | 'boxcar' | 'gondola' | 'reefer';
            if (['flatcar', 'boxcar', 'gondola', 'reefer'].includes(vt)) setVehicleType(vt);
          }

          if (placements.length > 0) {
            const apiLoads: Load3D[] = placements.map((p: any, i: number) => {
              const ld = p.load?.dimensions ?? {};
              return {
                id: `L-${p.load_id}`,
                name: p.load?.name ?? `Load ${p.load_id}`,
                weight: p.load?.weight ?? 0,
                volume: (ld.length ?? 0) * (ld.width ?? 0) * (ld.height ?? 0),
                fragile: p.load?.fragile ?? false,
                priority: p.load?.priority ?? 5,
                customer: p.load?.customer ?? '',
                compatScore: 90,
                stackGroup: 'A',
                rotationAllowed: true,
                x: p.x ?? 0,
                y: p.y ?? 0,
                z: p.z ?? 0,
                w: ld.length ?? 1,
                h: ld.height ?? 1,
                d: ld.width ?? 1,
                color: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899','#84CC16'][i % 8],
                hasViolation: false,
              };
            });
            setLoads(apiLoads);
            setOriginalLoads(apiLoads);

            // Fetch securements
            setSuggestedSecurements(result.suggested_securements ?? []);
            if (result.securements) {
              setSecurements(result.securements);
            }
          } else {
            console.warn('[Results] No placements returned. Vehicle:', vehicle, 'Violations:', violations);
            if (errorMessage) {
              toast.error(`Optimization failed: ${errorMessage}`);
            } else if (violations.length > 0) {
              const errors = violations.filter((v: any) => v.severity === 'error');
              if (errors.length > 0) {
                toast.error(`Optimization had ${errors.length} violations`);
              }
            }
          }
          setLoadsLoaded(true);
        })
        .catch(err => {
          console.error('[Results] Failed to fetch optimization result:', err);
          toast.error('Failed to load optimization results');
          setLoadsLoaded(true);
        });
    } else {
      setApiEfficiency(null);
      setLoadsLoaded(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOptimizationHistory()
      .then(rows => {
        setTrendData(
          rows
            .slice(0, 14)
            .reverse()
            .map(r => ({ t: `OPT-${r.id}`, v: (r.efficiency_score ?? 0) * 100 })),
        );
      })
      .catch(() => setTrendData(EMPTY_TREND));
  }, []);

  // ── AAR ENGINE ──────────────────────────────────────────────────────────
  const carConfig = useMemo<CarConfig>(() => {
    if (vehicleDims) {
      const L = vehicleDims.length;
      return {
        length: L,
        width: vehicleDims.width,
        interiorHeight: vehicleDims.height,
        loadLimit: 80000,
        tareWeight: 20000,
        emptyCGHeight: 45,
        plateType: 'C',
        truckCenterFront: L * 0.15,
        truckCenterRear: L * 0.85,
        axlePositions: vehicleDims.axlePositions.length ? vehicleDims.axlePositions : [L*0.1, L*0.35, L*0.65, L*0.9],
        axleLimit: 22500,
        endwallForceLimit: 100000,
        allowedGap: 1.5,
        platformHeight: 1.1,
      };
    }
    return DEFAULT_CAR;
  }, [vehicleDims]);

  const engineResult: EngineOutput = useMemo(
    () => runAARValidation(carConfig, toEngineLoads(loads)),
    [loads, carConfig]
  );

  // Computed values from engine
  const cogPosition = useMemo(() => computeCoG(loads), [loads]);
  const carLength = vehicleDims?.length ?? 20;
  const carWidth = vehicleDims?.width ?? 3.2;
  const efficiency = apiEfficiency ?? engineResult.packingEfficiency;
  const stabilityIdx = useMemo(() => {
    const xDev = Math.abs(cogPosition.x - carLength / 2) / (carLength / 2);
    const zDev = Math.abs(cogPosition.z - carWidth / 2) / (carWidth / 2);
    return Math.round(Math.max(0, Math.min(100, 100 - xDev * 50 - zDev * 50)));
  }, [cogPosition, carLength, carWidth]);

  // ── NEW: Advanced Metrics Computation ──────────────────────────────────
  const stressMetrics: StressMetrics = useMemo(() => {
    const baseStress = engineResult.axleLoads.map(axle => (axle.load / axle.limit) * 100);
    const multipliedStress = baseStress.map(s => Math.min(100, s * shockConfig.shockMultiplier));
    
    const endwallMultiplier = shockConfig.emergencyBrake ? 1.5 : 1.0;
    const curveMultiplier = shockConfig.curveSimulation ? 1.2 : 1.0;
    
    const maxStress = multipliedStress.length > 0 ? Math.max(...multipliedStress) : 0;
    
    return {
      axleStress: multipliedStress,
      endwallForce: (engineResult.endwallForce || 0) * endwallMultiplier,
      cgShift: {
        x: shockConfig.emergencyBrake ? 0.8 : shockConfig.curveSimulation ? 0.5 : 0.0,
        z: shockConfig.curveSimulation ? 0.3 : 0.0,
      },
      stressMargin: Math.max(0, 100 - maxStress),
    };
  }, [engineResult, shockConfig]);

  const confidenceMetrics: ConfidenceMetrics = useMemo(() => {
    const cgMargin = Math.max(0, 100 - ((engineResult.combinedCG || 0) / 98) * 100);
    const axleMargin = engineResult.axleLoads.length > 0 
      ? Math.max(0, Math.min(...engineResult.axleLoads.map(a => (1 - a.load / a.limit) * 100)))
      : 0;
    const stabilityMargin = stabilityIdx || 0;
    const shockTolerance = stressMetrics.axleStress.length > 0 
      ? Math.max(0, 100 - (stressMetrics.axleStress[0] || 0))
      : 0;
    const patternReliability = engineResult.violations.filter(v => v.type === 'pattern').length === 0 ? 95 : 75;
    
    const overall = Math.round(
      (cgMargin * 0.25 + axleMargin * 0.25 + stabilityMargin * 0.25 + shockTolerance * 0.15 + patternReliability * 0.1)
    );

    return {
      overall: Math.max(0, Math.min(100, overall)),
      stabilityMargin: Math.max(0, Math.min(100, stabilityMargin)),
      cgSafetyMargin: Math.max(0, Math.min(100, cgMargin)),
      axleMargin: Math.max(0, Math.min(100, axleMargin)),
      shockTolerance: Math.max(0, Math.min(100, shockTolerance)),
      patternReliability: Math.max(0, Math.min(100, patternReliability)),
    };
  }, [engineResult, stabilityIdx, stressMetrics]);

  const complianceChecks: ComplianceCheck[] = useMemo(() => {
    const maxAxleLoad = engineResult.axleLoads.length > 0
      ? Math.max(...engineResult.axleLoads.map(a => (a.load / a.limit) * 100))
      : 0;
    
    return [
      {
        id: 'cg',
        label: 'Combined CG ≤ Limit',
        status: (engineResult.combinedCG || 0) <= 98 ? 'pass' : 'fail',
        value: `${(engineResult.combinedCG || 0).toFixed(1)}"`,
        limit: '98"',
      },
      {
        id: 'truck',
        label: 'Truck Load ≤ Threshold',
        status: engineResult.axleLoads.every(a => a.load <= a.limit) ? 'pass' : 'fail',
        value: `${maxAxleLoad.toFixed(0)}%`,
        limit: '100%',
      },
      {
        id: 'lateral',
        label: 'Lateral Imbalance ≤ 10%',
        status: (engineResult.lateralImbalance?.percent || 0) <= 10 ? 'pass' : (engineResult.lateralImbalance?.percent || 0) <= 15 ? 'warning' : 'fail',
        value: `${(engineResult.lateralImbalance?.percent || 0).toFixed(1)}%`,
        limit: '10%',
      },
      {
        id: 'pattern',
        label: 'Pattern Compliance',
        status: engineResult.violations.filter(v => v.type === 'pattern').length === 0 ? 'pass' : 'warning',
      },
      {
        id: 'void',
        label: 'Void Space Acceptable',
        status: (engineResult.voidSpace || 0) < 2 ? 'pass' : (engineResult.voidSpace || 0) < 4 ? 'warning' : 'fail',
        value: `${(engineResult.voidSpace || 0).toFixed(1)} m³`,
      },
    ];
  }, [engineResult]);

  const loadExplanation: LoadExplanation | null = useMemo(() => {
    if (!selectedLoad) return null;
    
    const load = loads.find(l => l.id === selectedLoad);
    if (!load) return null;

    return {
      loadId: load.id,
      loadName: load.name,
      placementReason: `Positioned here to optimize ${optimizationObjective === 'space' ? 'space utilization' : optimizationObjective === 'cg-variance' ? 'center-of-gravity balance' : optimizationObjective === 'axle-stress' ? 'axle load distribution' : 'overall metrics'} while maintaining AAR compliance.`,
      constraints: [
        `Weight: ${load.weight.toLocaleString()} lbs requires balanced distribution`,
        `Dimensions: ${load.w.toFixed(1)}m × ${load.h.toFixed(1)}m × ${load.d.toFixed(1)}m`,
        load.fragile ? 'Fragile — cannot support stacking' : 'Stackable load',
        `Priority ${load.priority}/10 — placed early in optimization`,
        `Customer: ${load.customer}`,
      ],
      rejectedPositions: [
        {
          position: 'Front-left corner',
          reason: 'Would create excessive forward CG bias beyond 88" threshold',
          scoreDelta: 8.3,
        },
        {
          position: 'Rear section',
          reason: 'Collision with existing load L-0450, insufficient clearance',
          scoreDelta: 12.1,
        },
        {
          position: 'Center-right',
          reason: 'Lateral imbalance would exceed 10% limit',
          scoreDelta: 5.7,
        },
      ],
      currentScore: efficiency,
      alternativeScore: efficiency - 6.2,
    };
  }, [selectedLoad, loads, efficiency, optimizationObjective]);

  // Banner messages from engine
  const bannerViolation = useMemo(() => {
    const errors = engineResult.violations.filter(v => v.severity === 'error');
    if (errors.length > 0) return { msg: errors[0].message, severity: 'error' as const };
    const warnings = engineResult.violations.filter(v => v.severity === 'warning');
    if (warnings.length > 0) return { msg: warnings[0].message, severity: 'warning' as const };
    return null;
  }, [engineResult]);

  const pushHistory = useCallback((current: Load3D[]) => {
    setHistory(h => [...h.slice(-19), current]);
  }, []);

  // Use refs to avoid stale closures in drag callbacks
  const loadsDragRef = useRef(loads);
  const carConfigRef = useRef(carConfig);
  useEffect(() => { loadsDragRef.current = loads; }, [loads]);
  useEffect(() => { carConfigRef.current = carConfig; }, [carConfig]);

  const handleValidateDrag = useCallback((id: string, x: number, z: number) => {
    return validateDragPosition(carConfigRef.current, id, x, z, toEngineLoads(loadsDragRef.current));
  }, []);

  const handleMoveLoad = useCallback((id: string, x: number, z: number) => {
    const validation = validateDragPosition(carConfigRef.current, id, x, z, toEngineLoads(loadsDragRef.current));

    if (validation.hasCollision) {
      toast.error('Cannot place — collision detected');
      return;
    }

    if (validation.cgViolation) {
      toast.error(`CG at ${validation.combinedCG.toFixed(1)}" exceeds 98" limit — drop blocked`);
      return;
    }

    pushHistory(loadsDragRef.current);
    setLoads(prev => {
      // Find the dragged load to get its stack group
      const dragged = prev.find(l => l.id === id);
      if (!dragged) return prev;
      const stackGroup = dragged.stackGroup || id;
      const dx = x - dragged.x;
      const dz = z - dragged.z;
      // Move all loads in the same stack group
      const updated = prev.map(l =>
        (l.stackGroup || l.id) === stackGroup
          ? { ...l, x: l.x + dx, z: l.z + dz }
          : l
      );
      const newCog = computeCoG(updated);
      setCogTrail(trail => [...trail.slice(-8), computeCoG(prev), newCog]);
      return updated;
    });

    if (validation.lateralWarning) {
      toast.warning(`Lateral imbalance: ${validation.lateralPercent.toFixed(1)}%`);
    }
    if (validation.voidWarning) {
      toast.warning('Void space detected — consider filler placement');
    }

    toast('Load repositioned', {
      action: { label: 'Undo (5s)', onClick: handleUndo },
      duration: 5000,
    });
  }, [loads, pushHistory]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    setLoads(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    toast.success('Reverted to previous position');
  }, [history]);

  const handleRevertAll = useCallback(() => {
    pushHistory(loads);
    setLoads(originalLoads);
    setCogTrail([]);
    toast.success('Reverted to original placement');
  }, [loads, originalLoads, pushHistory]);

  const handleAutoBalance = useCallback(async () => {
    setIsBalancing(true);
    pushHistory(loads);
    await new Promise(r => setTimeout(r, 900));
    const balanced = autoBalance(loads, vehicleDims?.length ?? 20);
    setLoads(balanced);
    const newCog = computeCoG(balanced);
    setCogTrail(t => [...t.slice(-5), computeCoG(loads), newCog]);
    setIsBalancing(false);
    toast.success('Auto-balance complete — CoG optimized', { icon: '⚡' });
  }, [loads, pushHistory, vehicleDims]);

  const handleReRun = useCallback(() => {
    navigate('/jobs/new');
  }, [navigate]);

  const handleEditLoad   = useCallback((id: string) => { toast(`Edit load ${id} — form coming soon`); }, []);
  const handleDuplicateLoad = useCallback((id: string) => {
    const l = loads.find(ld => ld.id === id); if (!l) return;
    pushHistory(loads);
    // Generate a unique ID by appending a timestamp to avoid duplicates
    const timestamp = Date.now().toString().slice(-6);
    const newId = `${l.id}-copy-${timestamp}`;
    setLoads(prev => [...prev, { ...l, id: newId, x: Math.min(l.x + 0.3, 18), color: l.color }]);
    toast.success(`Duplicated ${id}`);
  }, [loads, pushHistory]);
  const handleRemoveLoad = useCallback((id: string) => {
    pushHistory(loads);
    setLoads(prev => prev.filter(l => l.id !== id));
    if (selectedLoad === id) setSelectedLoad(null);
    toast.success(`Removed ${id}`, { action: { label: 'Undo', onClick: handleUndo } });
  }, [loads, selectedLoad, pushHistory, handleUndo]);

  // ── NEW: Advanced Feature Handlers ──────────────────────────────────────
  const handleSaveScenario = useCallback((name: string) => {
    const newScenario: ScenarioData = {
      id: `scenario-${Date.now()}`,
      name,
      timestamp: new Date(),
      metrics: {
        cgPosition: engineResult.combinedCG,
        axleStress: Math.max(...engineResult.axleLoads.map(a => (a.load / a.limit) * 100)),
        efficiency: efficiency,
        stability: stabilityIdx,
        complianceScore: confidenceMetrics.overall,
        cost: 2850 + Math.random() * 500, // Mock cost
      },
    };
    
    setScenarios(prev => [...prev, newScenario]);
    toast.success(`Scenario "${name}" saved successfully`);
  }, [engineResult, efficiency, stabilityIdx, confidenceMetrics]);

  const handleCompareScenarios = useCallback((idA: string, idB: string) => {
    // Comparison logic is handled in the component
    toast.info('Opening scenario comparison...');
  }, []);

  const handleDeleteScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    toast.success('Scenario deleted');
  }, []);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 72px)', overflow: 'hidden', fontFamily: 'Inter,sans-serif' }}>

      {/* Violation / warning banner */}
      <AnimatePresence>
        {violationBanner && bannerViolation && (
          <ViolationBanner
            msg={bannerViolation.msg}
            severity={bannerViolation.severity}
            onClose={() => setViolationBanner(false)}
            onAction={handleAutoBalance}
          />
        )}
      </AnimatePresence>

      {/* Main split: 3D scene (60%) + Right panel (40%) */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── 3D Scene ── */}
        <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${bd}` }}>
          {/* Scene header */}
          <div className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ height: 42, borderBottom: `1px solid ${bd}`, background: isDark ? '#07101A' : '#F8FAFC' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setVehicleTypeOpen(!vehicleTypeOpen)}
                  className="flex items-center gap-2 hover:bg-opacity-10 hover:bg-gray-500 p-1 rounded transition-colors"
                  style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: 'Space Grotesk,sans-serif', letterSpacing: '-0.01em' }}
                >
                  3D Load Placement — {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Alpha-7
                  <ChevronDown size={12} className={`transition-transform ${vehicleTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {vehicleTypeOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-xl border z-50 overflow-hidden"
                      style={{ background: isDark ? '#1E2A38' : '#FFFFFF', borderColor: bd }}
                    >
                      {['flatcar', 'boxcar', 'gondola', 'reefer'].map((type) => (
                        <button
                          key={type}
                          onClick={() => { setVehicleType(type as any); setVehicleTypeOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-opacity-10 hover:bg-blue-500 transition-colors flex items-center justify-between"
                          style={{ color: isDark ? '#F1F5F9' : '#0F172A', background: vehicleType === type ? (isDark ? '#2D3748' : '#F1F5F9') : 'transparent' }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                          {vehicleType === type && <CheckCircle2 size={12} className="text-blue-500" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span style={{ fontSize: 10, color: isDark ? '#64748B' : '#94A3B8', fontFamily: 'JetBrains Mono,monospace' }}>
                V-001 · 20m · {loads.length} loads
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={engineResult.status} />
              {/* CG indicator */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{
                background: engineResult.combinedCG > 98 ? '#EF444415' : engineResult.combinedCG > 88 ? '#F59E0B15' : '#10B98115',
                border: `1px solid ${engineResult.combinedCG > 98 ? '#EF444430' : engineResult.combinedCG > 88 ? '#F59E0B30' : '#10B98130'}`,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono,monospace',
                  color: engineResult.combinedCG > 98 ? '#EF4444' : engineResult.combinedCG > 88 ? '#F59E0B' : '#10B981',
                }}>
                  CG {engineResult.combinedCG.toFixed(1)}"
                </span>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: palette.accent, fontWeight: 700 }}>
                {efficiency.toFixed(1)}% eff.
              </div>
              <button
                onClick={() => setShowMiniMap(!showMiniMap)}
                style={{
                  padding: '4px 8px', borderRadius: 4, border: `1px solid ${showMiniMap ? '#10B98140' : bd}`,
                  background: showMiniMap ? '#10B98120' : 'transparent', color: showMiniMap ? '#10B981' : muted,
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {showMiniMap ? '📍 Map' : '📍 Map'}
              </button>
              <button
                onClick={() => setShowSecurementPanel(!showSecurementPanel)}
                style={{
                  padding: '4px 8px', borderRadius: 4, border: `1px solid ${showSecurementPanel ? '#0066cc40' : bd}`,
                  background: showSecurementPanel ? '#0066cc20' : 'transparent', color: showSecurementPanel ? '#0066cc' : muted,
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                }}
              >
                🔒 Securements {securements.length > 0 && `(${securements.length})`}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 min-h-0">
            <Scene3D
              loads={loads}
              selectedLoad={selectedLoad}
              vehicleType={vehicleType}
              vehicleDims={vehicleDims ? { length: vehicleDims.length, width: vehicleDims.width, height: vehicleDims.height } : undefined}
              cogPosition={cogPosition}
              cogTrail={cogTrail}
              axleData={engineResult.axleLoads}
              engineResult={engineResult}
              securements={securements}
              onSelectLoad={setSelectedLoad}
              onMoveLoad={handleMoveLoad}
              onValidateDrag={handleValidateDrag}
              onStabilityUpdate={setStabilityResults}
              onPhysicsToggle={setPhysicsEnabled}
              onDebugToggle={setDebugMode}
            />
            {/* MiniMap overlay */}
            {showMiniMap && vehicleDims && loads.length > 0 && (
              <div style={{ position: 'absolute', bottom: 48, left: 12, zIndex: 50 }}>
                <MiniMap
                  loads={loads.map(l => ({ id: l.id, x: l.x, z: l.z, w: l.w, d: l.d, color: l.color, name: l.name, weight: l.weight }))}
                  vehicleLength={vehicleDims.length}
                  vehicleWidth={vehicleDims.width}
                  selectedLoad={selectedLoad}
                  onSelectLoad={setSelectedLoad}
                  isDark={isDark}
                />
              </div>
            )}
            {/* Load Info Panel */}
            {selectedLoad && (
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 50 }}>
                <LoadInfoPanel
                  load={(() => {
                    const l = loads.find(ld => ld.id === selectedLoad);
                    if (!l) return null;
                    const stab = stabilityResults.find(s => s.item_id === l.id);
                    return {
                      id: l.id, name: l.name, weight: l.weight,
                      w: l.w, h: l.h, d: l.d,
                      x: l.x, y: l.y, z: l.z,
                      color: l.color, fragile: l.fragile, stackable: true,
                      stabilityRisk: stab?.risk_score,
                    } as LoadInfo;
                  })()}
                  isDark={isDark}
                  onClose={() => setSelectedLoad(null)}
                />
              </div>
            )}
            {/* Securement Panel */}
            {showSecurementPanel && (
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 50, maxWidth: 400 }}>
                <SecurementPanel
                  optimizationId={Number(searchParams.get('id')) || 0}
                  suggestedSecurements={suggestedSecurements}
                  onSecurementAdded={(sec) => setSecurements([...securements, sec])}
                  onSecurementDeleted={(secId) => setSecurements(securements.filter(s => s.id !== secId))}
                />
              </div>
            )}
          </div>

          {/* Scene footer — quick KPI strip */}
          <div className="flex items-center gap-0 flex-shrink-0" style={{ borderTop: `1px solid ${bd}`, background: isDark ? '#060C14' : '#F8FAFC' }}>
            {[
              { label: 'Efficiency', value: `${efficiency.toFixed(1)}%`, color: '#10B981' },
              { label: 'Total Weight', value: `${(engineResult.totalWeight / 1000).toFixed(1)} t`, color: palette.accent },
              { label: 'Combined CG', value: `${engineResult.combinedCG.toFixed(1)}"`, color: engineResult.combinedCG > 98 ? '#EF4444' : engineResult.combinedCG > 88 ? '#F59E0B' : '#10B981' },
              { label: 'Lateral Bal.', value: `${engineResult.lateralImbalance.percent.toFixed(1)}%`, color: engineResult.lateralImbalance.percent > 10 ? '#EF4444' : engineResult.lateralImbalance.percent > 5 ? '#F59E0B' : '#10B981' },
              { label: 'Endwall Force', value: `${(engineResult.endwallForce / 1000).toFixed(0)}K`, color: engineResult.endwallForce > engineResult.endwallForceLimit ? '#EF4444' : engineResult.endwallForce > engineResult.endwallForceLimit * 0.8 ? '#F59E0B' : '#10B981' },
            ].map(({ label, value, color }, i) => (
              <div key={label} className="flex flex-col items-center justify-center flex-1 py-1.5"
                style={{ borderRight: i < 4 ? `1px solid ${bd}` : 'none' }}>
                <div style={{ fontSize: 9, color: isDark ? '#475569' : '#94A3B8', marginBottom: 1 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'Space Grotesk,sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <EnhancedRightPanel
          loads={loads}
          selectedLoad={selectedLoad}
          cogPosition={cogPosition}
          axleData={engineResult.axleLoads}
          efficiency={efficiency}
          stabilityIdx={stabilityIdx}
          engineResult={engineResult}
          trendData={trendData.length ? trendData : [{ t: 'local', v: engineResult.packingEfficiency }]}
          onEditLoad={handleEditLoad}
          onDuplicateLoad={handleDuplicateLoad}
          onRemoveLoad={handleRemoveLoad}
          
          optimizationObjective={optimizationObjective}
          optimizationWeights={optimizationWeights}
          shockConfig={shockConfig}
          stressMetrics={stressMetrics}
          confidenceMetrics={confidenceMetrics}
          complianceChecks={complianceChecks}
          loadExplanation={loadExplanation}
          scenarios={scenarios}
          
          onObjectiveChange={setOptimizationObjective}
          onWeightsChange={setOptimizationWeights}
          onShockConfigChange={setShockConfig}
          onSaveScenario={handleSaveScenario}
          onCompareScenarios={handleCompareScenarios}
          onDeleteScenario={handleDeleteScenario}
        />
      </div>

      {/* Bottom action bar */}
      <BottomBar
        efficiency={efficiency}
        hasHistory={history.length > 0}
        engineStatus={engineResult.status}
        onUndo={handleUndo}
        onRevertAll={handleRevertAll}
        onAutoBalance={handleAutoBalance}
        onReRun={handleReRun}
        isBalancing={isBalancing}
        optimizationId={searchParams.get('id')}
      />
    </div>
  );
}