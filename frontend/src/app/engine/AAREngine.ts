// ── AAR-COMPLIANT RAIL LOAD OPTIMIZATION ENGINE ─────────────────────────────
// Implements AAR (Association of American Railroads) Loading Rules:
//   Section 3.2 — Maximum Car Load Validation
//   Section 3.3 — Crosswise Weight Distribution
//   Section 3.4 — Lengthwise Distribution & Void Spaces
//   Section 3.5 — Combined Center of Gravity (98" limit)
//   Section 4   — Roll Pattern Rules
//   Table 3.1   — Endwall Force Limits

const M_TO_IN = 39.3701;
const KG_TO_LB = 2.20462;

// ── INTERFACES ──────────────────────────────────────────────────────────────
export interface CarConfig {
  length: number;
  width: number;
  interiorHeight: number;
  loadLimit: number;
  tareWeight: number;
  emptyCGHeight: number;
  plateType: string;
  truckCenterFront: number;
  truckCenterRear: number;
  axlePositions: number[];
  axleLimit: number;
  endwallForceLimit: number;
  allowedGap: number;
  platformHeight: number;
}

export interface LoadItem {
  id: string;
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  weight: number;
  diameter?: number;
  isRoll?: boolean;
}

export interface Violation {
  id: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedLoads: string[];
  value?: number;
  limit?: number;
}

export interface VoidSpace {
  startX: number;
  endX: number;
  width: number;
  severity: 'warning' | 'error';
}

export interface TruckWeights {
  front: number;
  rear: number;
  frontPercent: number;
  rearPercent: number;
}

export interface LateralBalance {
  left: number;
  right: number;
  percent: number;
}

export interface AxleLoad {
  name: string;
  load: number;
  limit: number;
  percent: number;
}

export interface ShockPoint {
  time: number;
  force: number;
}

export interface ContactPoint {
  loadId: string;
  points: { x: number; z: number }[];
}

export interface EngineOutput {
  compliant: boolean;
  status: 'green' | 'yellow' | 'red';
  violations: Violation[];
  combinedCG: number;
  combinedCGLimit: number;
  truckWeights: TruckWeights;
  lateralImbalance: LateralBalance;
  longitudinalZones: number[];
  endwallForce: number;
  endwallForceLimit: number;
  voidSpaces: VoidSpace[];
  axleLoads: AxleLoad[];
  recommendedBlocking: string[];
  requiredStrapping: string[];
  packingEfficiency: number;
  utilizationPercent: number;
  shockSimulation: ShockPoint[];
  rollContactPoints: ContactPoint[];
  totalWeight: number;
  canExport: boolean;
}

// ── DEFAULT CAR CONFIG ──────────────────────────────────────────────────────
export const DEFAULT_CAR: CarConfig = {
  length: 20,
  width: 3.2,
  interiorHeight: 2.4,
  loadLimit: 80000,
  tareWeight: 20000,
  emptyCGHeight: 45,
  plateType: 'C',
  truckCenterFront: 3.5,
  truckCenterRear: 16.5,
  axlePositions: [2.5, 7.5, 12.5, 17.5],
  axleLimit: 22500,
  endwallForceLimit: 100000,
  allowedGap: 1.5,
  platformHeight: 1.1,
};

// ── CORE VALIDATION FUNCTIONS ───────────────────────────────────────────────

/** Section 3.2 — Maximum Car Load Validation */
function validateMaxCarLoad(car: CarConfig, loads: LoadItem[]): Violation[] {
  const violations: Violation[] = [];
  const totalWeight = loads.reduce((a, l) => a + l.weight, 0);

  if (totalWeight > car.loadLimit) {
    violations.push({
      id: 'V-MAX-LOAD',
      rule: 'Maximum Car Load',
      severity: 'error',
      message: `Total load weight (${(totalWeight / 1000).toFixed(1)}t) exceeds car load limit (${(car.loadLimit / 1000).toFixed(1)}t)`,
      affectedLoads: loads.map(l => l.id),
      value: totalWeight,
      limit: car.loadLimit,
    });
  } else if (totalWeight / car.loadLimit > 0.9) {
    violations.push({
      id: 'V-MAX-LOAD-WARN',
      rule: 'Maximum Car Load',
      severity: 'warning',
      message: `Total load at ${((totalWeight / car.loadLimit) * 100).toFixed(1)}% of car load limit`,
      affectedLoads: [],
      value: totalWeight,
      limit: car.loadLimit,
    });
  }

  return violations;
}

/** Section 3.2 — Per-Truck Weight (must not exceed 50% of load limit) */
function validateTruckWeights(car: CarConfig, loads: LoadItem[]): { violations: Violation[]; truckWeights: TruckWeights } {
  const violations: Violation[] = [];
  const halfLimit = car.loadLimit / 2;
  const carMidpoint = car.length / 2;

  let frontWeight = 0;
  let rearWeight = 0;
  const totalWeight = loads.reduce((a, l) => a + l.weight, 0);

  loads.forEach(l => {
    const loadCenter = l.x + l.w / 2;
    const distFromRear = car.truckCenterRear - loadCenter;
    const truckSpan = car.truckCenterRear - car.truckCenterFront;
    const frontRatio = Math.max(0, Math.min(1, distFromRear / truckSpan));
    frontWeight += l.weight * frontRatio;
    rearWeight += l.weight * (1 - frontRatio);
  });

  const truckWeights: TruckWeights = {
    front: Math.round(frontWeight),
    rear: Math.round(rearWeight),
    frontPercent: totalWeight > 0 ? (frontWeight / halfLimit) * 100 : 0,
    rearPercent: totalWeight > 0 ? (rearWeight / halfLimit) * 100 : 0,
  };

  if (frontWeight > halfLimit) {
    violations.push({
      id: 'V-TRUCK-FRONT',
      rule: 'Front Truck Overload',
      severity: 'error',
      message: `Front truck weight (${(frontWeight / 1000).toFixed(1)}t) exceeds 50% of load limit (${(halfLimit / 1000).toFixed(1)}t)`,
      affectedLoads: loads.filter(l => l.x + l.w / 2 < carMidpoint).map(l => l.id),
      value: frontWeight,
      limit: halfLimit,
    });
  }

  if (rearWeight > halfLimit) {
    violations.push({
      id: 'V-TRUCK-REAR',
      rule: 'Rear Truck Overload',
      severity: 'error',
      message: `Rear truck weight (${(rearWeight / 1000).toFixed(1)}t) exceeds 50% of load limit (${(halfLimit / 1000).toFixed(1)}t)`,
      affectedLoads: loads.filter(l => l.x + l.w / 2 >= carMidpoint).map(l => l.id),
      value: rearWeight,
      limit: halfLimit,
    });
  }

  return { violations, truckWeights };
}

/** Section 3.3 — Crosswise (Lateral) Weight Distribution */
function validateLateralBalance(car: CarConfig, loads: LoadItem[]): { violations: Violation[]; lateral: LateralBalance } {
  const violations: Violation[] = [];
  const centerline = car.width / 2;
  let leftWeight = 0;
  let rightWeight = 0;

  loads.forEach(l => {
    const loadCenterZ = l.z + l.d / 2;
    if (loadCenterZ < centerline) {
      leftWeight += l.weight;
    } else if (loadCenterZ > centerline) {
      rightWeight += l.weight;
    } else {
      leftWeight += l.weight / 2;
      rightWeight += l.weight / 2;
    }
  });

  const totalWeight = leftWeight + rightWeight;
  const imbalancePercent = totalWeight > 0 ? (Math.abs(leftWeight - rightWeight) / totalWeight) * 100 : 0;

  const lateral: LateralBalance = {
    left: Math.round(leftWeight),
    right: Math.round(rightWeight),
    percent: Math.round(imbalancePercent * 10) / 10,
  };

  if (imbalancePercent > 10) {
    violations.push({
      id: 'V-LATERAL-BLOCK',
      rule: 'Crosswise Weight Distribution',
      severity: 'error',
      message: `Lateral imbalance ${imbalancePercent.toFixed(1)}% exceeds 10% limit. Optimization result blocked.`,
      affectedLoads: loads.map(l => l.id),
      value: imbalancePercent,
      limit: 10,
    });
  } else if (imbalancePercent > 5) {
    violations.push({
      id: 'V-LATERAL-WARN',
      rule: 'Crosswise Weight Distribution',
      severity: 'warning',
      message: `Lateral imbalance ${imbalancePercent.toFixed(1)}% exceeds 5% advisory threshold.`,
      affectedLoads: loads.map(l => l.id),
      value: imbalancePercent,
      limit: 5,
    });
  }

  return { violations, lateral };
}

/** Section 3.4 — Lengthwise Distribution & Void Spaces */
function validateLengthwiseDistribution(car: CarConfig, loads: LoadItem[]): { violations: Violation[]; voidSpaces: VoidSpace[] } {
  const violations: Violation[] = [];
  const voidSpaces: VoidSpace[] = [];

  if (loads.length < 2) return { violations, voidSpaces };

  const sorted = [...loads].sort((a, b) => a.x - b.x);

  for (let i = 0; i < sorted.length - 1; i++) {
    const endOfCurrent = sorted[i].x + sorted[i].w;
    const startOfNext = sorted[i + 1].x;
    const gap = startOfNext - endOfCurrent;

    if (gap > car.allowedGap) {
      const severity = gap > car.allowedGap * 2 ? 'error' as const : 'warning' as const;
      voidSpaces.push({
        startX: endOfCurrent,
        endX: startOfNext,
        width: gap,
        severity,
      });

      violations.push({
        id: `V-VOID-${i}`,
        rule: 'Void Space Detection',
        severity,
        message: `${gap.toFixed(1)}m void between ${sorted[i].id} and ${sorted[i + 1].id}. ${severity === 'error' ? 'Requires filler material.' : 'Consider filler placement.'}`,
        affectedLoads: [sorted[i].id, sorted[i + 1].id],
        value: gap,
        limit: car.allowedGap,
      });
    }
  }

  // Check gap at car start
  const firstLoad = sorted[0];
  if (firstLoad && firstLoad.x > car.allowedGap) {
    voidSpaces.push({ startX: 0, endX: firstLoad.x, width: firstLoad.x, severity: 'warning' });
  }

  // Check gap at car end
  const lastLoad = sorted[sorted.length - 1];
  if (lastLoad) {
    const endGap = car.length - (lastLoad.x + lastLoad.w);
    if (endGap > car.allowedGap) {
      voidSpaces.push({ startX: lastLoad.x + lastLoad.w, endX: car.length, width: endGap, severity: 'warning' });
    }
  }

  return { violations, voidSpaces };
}

/** Section 3.5 — Combined Center of Gravity (must not exceed 98 inches above rail) */
function validateCombinedCG(car: CarConfig, loads: LoadItem[]): { violations: Violation[]; combinedCG: number } {
  const violations: Violation[] = [];

  const B = car.emptyCGHeight; // inches
  const E = car.tareWeight * KG_TO_LB; // lbs

  let numerator = B * E;
  let denominator = E;

  loads.forEach(l => {
    // Load CG height above top of rail in inches
    // platformHeight (m->in) + load y position (m->in) + half load height (m->in)
    const D = (car.platformHeight + l.y + l.h / 2) * M_TO_IN;
    const F = l.weight * KG_TO_LB;
    numerator += D * F;
    denominator += F;
  });

  const combinedCG = denominator > 0 ? numerator / denominator : B;
  const CG_LIMIT = 98;

  if (combinedCG > CG_LIMIT) {
    violations.push({
      id: 'V-CG-EXCEED',
      rule: 'Combined Center of Gravity',
      severity: 'error',
      message: `Combined CG at ${combinedCG.toFixed(1)}" exceeds ${CG_LIMIT}" limit above top of rail. Export disabled.`,
      affectedLoads: loads.map(l => l.id),
      value: combinedCG,
      limit: CG_LIMIT,
    });
  } else if (combinedCG > CG_LIMIT * 0.9) {
    violations.push({
      id: 'V-CG-WARN',
      rule: 'Combined Center of Gravity',
      severity: 'warning',
      message: `Combined CG at ${combinedCG.toFixed(1)}" approaching ${CG_LIMIT}" limit (${((combinedCG / CG_LIMIT) * 100).toFixed(0)}%).`,
      affectedLoads: [],
      value: combinedCG,
      limit: CG_LIMIT,
    });
  }

  return { violations, combinedCG };
}

/** Section 4 — Roll Pattern Rules */
function validateRollPatterns(car: CarConfig, loads: LoadItem[]): Violation[] {
  const violations: Violation[] = [];
  const rolls = loads.filter(l => l.isRoll && l.diameter);

  rolls.forEach(roll => {
    if (!roll.diameter) return;
    const d = roll.diameter;

    if (d > car.width / 2) {
      // 1-1 offset pattern required
      const loadCenterZ = roll.z + roll.d / 2;
      const carCenter = car.width / 2;
      if (Math.abs(loadCenterZ - carCenter) > 0.15) {
        violations.push({
          id: `V-ROLL-${roll.id}`,
          rule: 'Roll Pattern — 1-1 Offset',
          severity: 'warning',
          message: `Roll ${roll.id} (d=${d.toFixed(1)}m) requires centered 1-1 offset pattern per AAR.`,
          affectedLoads: [roll.id],
        });
      }
    } else if (d < car.width / 3) {
      // 3-3 or 3-2-3 allowed — check lateral alignment
      const loadCenterZ = roll.z + roll.d / 2;
      if (loadCenterZ < 0.1 || loadCenterZ > car.width - 0.1) {
        violations.push({
          id: `V-ROLL-EDGE-${roll.id}`,
          rule: 'Roll Pattern — Edge Violation',
          severity: 'warning',
          message: `Roll ${roll.id} too close to car edge. Reposition per AAR loading standards.`,
          affectedLoads: [roll.id],
        });
      }
    }
  });

  return violations;
}

/** Table 3.1 — Endwall Force Limit calculation */
function calculateEndwallForce(car: CarConfig, loads: LoadItem[]): { force: number; violations: Violation[] } {
  const violations: Violation[] = [];

  // Simulate longitudinal shock force (simplified)
  // Force = mass * deceleration factor (4g for switching impact per AAR)
  const SHOCK_G = 4;
  const G_ACCEL = 9.81; // m/s^2

  // Find loads pushing against each endwall
  let frontForce = 0;
  let rearForce = 0;

  loads.forEach(l => {
    const loadCenter = l.x + l.w / 2;
    const carCenter = car.length / 2;

    if (loadCenter < carCenter) {
      // Load tends to push toward front endwall under braking
      const distance = l.x; // distance from front wall
      const inertiaFactor = Math.max(0.2, 1 - distance / (car.length / 2));
      frontForce += l.weight * SHOCK_G * G_ACCEL * inertiaFactor;
    } else {
      const distance = car.length - (l.x + l.w);
      const inertiaFactor = Math.max(0.2, 1 - distance / (car.length / 2));
      rearForce += l.weight * SHOCK_G * G_ACCEL * inertiaFactor;
    }
  });

  // Convert to lbs
  const maxForce = Math.max(frontForce, rearForce) * KG_TO_LB / SHOCK_G;
  const forceLbs = Math.round(maxForce);

  if (forceLbs > car.endwallForceLimit) {
    violations.push({
      id: 'V-ENDWALL',
      rule: 'Endwall Force Limit',
      severity: 'error',
      message: `Calculated endwall force (${(forceLbs / 1000).toFixed(0)}K lbs) exceeds ${(car.endwallForceLimit / 1000).toFixed(0)}K lb limit. Requires anchored straps or blocking.`,
      affectedLoads: loads.map(l => l.id),
      value: forceLbs,
      limit: car.endwallForceLimit,
    });
  } else if (forceLbs > car.endwallForceLimit * 0.8) {
    violations.push({
      id: 'V-ENDWALL-WARN',
      rule: 'Endwall Force Limit',
      severity: 'warning',
      message: `Endwall force at ${((forceLbs / car.endwallForceLimit) * 100).toFixed(0)}% of limit. Consider blocking reinforcement.`,
      affectedLoads: [],
      value: forceLbs,
      limit: car.endwallForceLimit,
    });
  }

  return { force: forceLbs, violations };
}

/** Collision detection between loads */
export function checkCollisions(loads: LoadItem[]): { collisions: [string, string][]; violations: Violation[] } {
  const collisions: [string, string][] = [];
  const violations: Violation[] = [];

  for (let i = 0; i < loads.length; i++) {
    for (let j = i + 1; j < loads.length; j++) {
      const a = loads[i], b = loads[j];
      const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
      const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;
      const overlapZ = a.z < b.z + b.d && a.z + a.d > b.z;

      if (overlapX && overlapY && overlapZ) {
        collisions.push([a.id, b.id]);
        violations.push({
          id: `V-COLLISION-${a.id}-${b.id}`,
          rule: 'Bounding Box Collision',
          severity: 'error',
          message: `${a.id} and ${b.id} have overlapping bounding boxes.`,
          affectedLoads: [a.id, b.id],
        });
      }
    }
  }

  return { collisions, violations };
}

/** Check single load collision against others (for drag validation) */
export function checkSingleCollision(
  draggedId: string, newX: number, newY: number, newZ: number,
  draggedLoad: { w: number; h: number; d: number },
  otherLoads: LoadItem[]
): boolean {
  for (const b of otherLoads) {
    if (b.id === draggedId) continue;
    const overlapX = newX < b.x + b.w && newX + draggedLoad.w > b.x;
    const overlapY = newY < b.y + b.h && newY + draggedLoad.h > b.y;
    const overlapZ = newZ < b.z + b.d && newZ + draggedLoad.d > b.z;
    if (overlapX && overlapY && overlapZ) return true;
  }
  return false;
}

/** Quick drag validation — returns object with all constraint checks */
export function validateDragPosition(
  car: CarConfig,
  draggedId: string,
  newX: number, newZ: number,
  loads: LoadItem[]
): {
  hasCollision: boolean;
  lateralWarning: boolean;
  cgViolation: boolean;
  voidWarning: boolean;
  combinedCG: number;
  lateralPercent: number;
} {
  const dragged = loads.find(l => l.id === draggedId);
  if (!dragged) return { hasCollision: false, lateralWarning: false, cgViolation: false, voidWarning: false, combinedCG: 0, lateralPercent: 0 };

  const simulatedLoads = loads.map(l =>
    l.id === draggedId ? { ...l, x: newX, z: newZ } : l
  );

  const hasCollision = checkSingleCollision(draggedId, newX, dragged.y, newZ, dragged, loads);

  const { lateral } = validateLateralBalance(car, simulatedLoads);
  const lateralWarning = lateral.percent > 5;

  const { combinedCG } = validateCombinedCG(car, simulatedLoads);
  const cgViolation = combinedCG > 98;

  const { voidSpaces } = validateLengthwiseDistribution(car, simulatedLoads);
  const voidWarning = voidSpaces.length > 0;

  return {
    hasCollision,
    lateralWarning,
    cgViolation,
    voidWarning,
    combinedCG,
    lateralPercent: lateral.percent,
  };
}

/** Generate shock simulation data */
function generateShockSimulation(car: CarConfig, loads: LoadItem[]): ShockPoint[] {
  const totalWeight = loads.reduce((a, l) => a + l.weight, 0);
  const points: ShockPoint[] = [];

  for (let t = 0; t <= 2.0; t += 0.05) {
    // Simulate switching impact shock wave
    const impactPhase = t < 0.1 ? t / 0.1 : 1;
    const dampingFactor = Math.exp(-t * 2.5);
    const oscillation = Math.sin(t * 12) * dampingFactor;
    const baseForce = totalWeight * 4 * 9.81 * KG_TO_LB / 1000; // in Klbs
    const force = baseForce * impactPhase * (0.3 + 0.7 * dampingFactor + 0.4 * oscillation);
    points.push({ time: Math.round(t * 100) / 100, force: Math.round(force * 10) / 10 });
  }

  return points;
}

/** Generate roll contact points */
function generateRollContactPoints(loads: LoadItem[]): ContactPoint[] {
  return loads.map(l => {
    if (l.isRoll && l.diameter) {
      const r = l.diameter / 2;
      return {
        loadId: l.id,
        points: [
          { x: l.x + l.w / 2, z: l.z },
          { x: l.x + l.w / 2, z: l.z + l.d },
          { x: l.x, z: l.z + l.d / 2 },
          { x: l.x + l.w, z: l.z + l.d / 2 },
        ],
      };
    }
    // Non-roll loads have corner contact points
    return {
      loadId: l.id,
      points: [
        { x: l.x, z: l.z },
        { x: l.x + l.w, z: l.z },
        { x: l.x, z: l.z + l.d },
        { x: l.x + l.w, z: l.z + l.d },
      ],
    };
  });
}

/** Calculate longitudinal zone weights (4 zones) */
function calculateLongitudinalZones(car: CarConfig, loads: LoadItem[]): number[] {
  const zoneCount = 4;
  const zoneWidth = car.length / zoneCount;
  const zones = Array(zoneCount).fill(0);

  loads.forEach(l => {
    const loadCenter = l.x + l.w / 2;
    const zoneIdx = Math.min(zoneCount - 1, Math.floor(loadCenter / zoneWidth));
    zones[zoneIdx] += l.weight;
  });

  return zones;
}

/** Generate blocking and strapping recommendations */
function getRecommendations(
  car: CarConfig, loads: LoadItem[], endwallForce: number, voidSpaces: VoidSpace[]
): { blocking: string[]; strapping: string[] } {
  const blocking: string[] = [];
  const strapping: string[] = [];

  if (endwallForce > car.endwallForceLimit * 0.7) {
    blocking.push('Install longitudinal blocking at endwalls');
    strapping.push('Apply minimum 2x steel straps per load group');
  }

  voidSpaces.forEach(vs => {
    if (vs.width > 1.0) {
      blocking.push(`Install filler/dunnage between ${vs.startX.toFixed(1)}m–${vs.endX.toFixed(1)}m`);
    }
  });

  const heavyLoads = loads.filter(l => l.weight > 10000);
  if (heavyLoads.length > 0) {
    strapping.push(`Heavy loads (${heavyLoads.map(l => l.id).join(', ')}): 4x steel bands minimum`);
  }

  loads.filter(l => l.y > 0.1).forEach(l => {
    strapping.push(`Stacked load ${l.id}: Requires vertical securing`);
  });

  return { blocking, strapping };
}

// ── MAIN ENGINE FUNCTION ────────────────────────────────────────────────────
export function runAARValidation(car: CarConfig, loads: LoadItem[]): EngineOutput {
  const allViolations: Violation[] = [];

  // Section 3.2 — Max load
  allViolations.push(...validateMaxCarLoad(car, loads));

  // Section 3.2 — Truck weights
  const { violations: truckViolations, truckWeights } = validateTruckWeights(car, loads);
  allViolations.push(...truckViolations);

  // Section 3.3 — Lateral balance
  const { violations: lateralViolations, lateral } = validateLateralBalance(car, loads);
  allViolations.push(...lateralViolations);

  // Section 3.4 — Void spaces
  const { violations: voidViolations, voidSpaces } = validateLengthwiseDistribution(car, loads);
  allViolations.push(...voidViolations);

  // Section 3.5 — Combined CG
  const { violations: cgViolations, combinedCG } = validateCombinedCG(car, loads);
  allViolations.push(...cgViolations);

  // Section 4 — Roll patterns
  allViolations.push(...validateRollPatterns(car, loads));

  // Table 3.1 — Endwall force
  const { force: endwallForce, violations: endwallViolations } = calculateEndwallForce(car, loads);
  allViolations.push(...endwallViolations);

  // Collision detection
  const { violations: collisionViolations } = checkCollisions(loads);
  allViolations.push(...collisionViolations);

  // Compute axle loads
  const axleLoads: AxleLoad[] = car.axlePositions.map((ax, i) => {
    const load = loads.reduce((sum, l) => {
      const lc = l.x + l.w / 2;
      const dist = Math.abs(lc - ax);
      const influence = Math.max(0, 1 - dist / 5.5);
      return sum + l.weight * influence;
    }, 0);
    return {
      name: `Axle ${i + 1}`,
      load: Math.round(load),
      limit: car.axleLimit,
      percent: Math.round((load / car.axleLimit) * 1000) / 10,
    };
  });

  // Axle overload violations
  axleLoads.forEach(al => {
    if (al.percent > 100) {
      allViolations.push({
        id: `V-AXLE-${al.name}`,
        rule: `${al.name} Overload`,
        severity: 'error',
        message: `${al.name} at ${al.percent.toFixed(1)}% — exceeds limit`,
        affectedLoads: [],
        value: al.load,
        limit: al.limit,
      });
    } else if (al.percent > 92) {
      allViolations.push({
        id: `V-AXLE-WARN-${al.name}`,
        rule: `${al.name} Near Limit`,
        severity: 'warning',
        message: `${al.name} at ${al.percent.toFixed(1)}% capacity`,
        affectedLoads: [],
        value: al.load,
        limit: al.limit,
      });
    }
  });

  // Packing
  const totalWeight = loads.reduce((a, l) => a + l.weight, 0);
  const volUsed = loads.reduce((a, l) => a + l.w * l.h * l.d, 0);
  const volTotal = car.length * car.width * car.interiorHeight;
  const packingEfficiency = volTotal > 0 ? (volUsed / volTotal) * 100 : 0;
  const utilizationPercent = car.loadLimit > 0 ? (totalWeight / car.loadLimit) * 100 : 0;

  // Shock simulation
  const shockSimulation = generateShockSimulation(car, loads);

  // Roll contact points
  const rollContactPoints = generateRollContactPoints(loads);

  // Longitudinal zones
  const longitudinalZones = calculateLongitudinalZones(car, loads);

  // Recommendations
  const { blocking, strapping } = getRecommendations(car, loads, endwallForce, voidSpaces);

  // Determine overall status
  const hasErrors = allViolations.some(v => v.severity === 'error');
  const hasWarnings = allViolations.some(v => v.severity === 'warning');
  const status = hasErrors ? 'red' : hasWarnings ? 'yellow' : 'green';

  // Can export only if no blocking violations
  const blockingRules = ['V-CG-EXCEED', 'V-TRUCK-FRONT', 'V-TRUCK-REAR', 'V-ENDWALL', 'V-LATERAL-BLOCK'];
  const canExport = !allViolations.some(v =>
    v.severity === 'error' && blockingRules.some(r => v.id.startsWith(r.replace(/-$/, '')))
  );

  return {
    compliant: !hasErrors,
    status,
    violations: allViolations,
    combinedCG,
    combinedCGLimit: 98,
    truckWeights,
    lateralImbalance: lateral,
    longitudinalZones,
    endwallForce,
    endwallForceLimit: car.endwallForceLimit,
    voidSpaces,
    axleLoads,
    recommendedBlocking: blocking,
    requiredStrapping: strapping,
    packingEfficiency: Math.round(packingEfficiency * 10) / 10,
    utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    shockSimulation,
    rollContactPoints,
    totalWeight,
    canExport: !hasErrors,
  };
}

// ── FORM VALIDATION HELPERS ─────────────────────────────────────────────────

export interface VehicleFormErrors {
  length?: string;
  width?: string;
  height?: string;
  maxWeight?: string;
  emptyCG?: string;
  plateType?: string;
  name?: string;
}

export function validateVehicleForm(data: {
  name: string; length: string; width: string; height: string;
  maxWeight: string; axles: string; emptyCG?: string; plateType?: string;
}): VehicleFormErrors {
  const errors: VehicleFormErrors = {};

  if (!data.name.trim()) errors.name = 'Vehicle name is required';
  if (!data.length || parseFloat(data.length) <= 0) errors.length = 'Length must be > 0';
  if (!data.width || parseFloat(data.width) <= 0) errors.width = 'Width must be > 0';
  if (!data.height || parseFloat(data.height) <= 0) errors.height = 'Height must be > 0';
  if (!data.maxWeight || parseFloat(data.maxWeight) <= 0) errors.maxWeight = 'Load limit must be > 0';

  return errors;
}

export interface LoadFormErrors {
  name?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  diameter?: string;
}

export function validateLoadForm(data: {
  name: string; weight: string; length: string; width: string;
  height: string; diameter?: string; carWidth?: number; carHeight?: number;
}): LoadFormErrors {
  const errors: LoadFormErrors = {};

  if (!data.name.trim()) errors.name = 'Load name is required';
  if (!data.weight || parseFloat(data.weight) <= 0) errors.weight = 'Weight must be > 0';
  if (!data.length || parseFloat(data.length) <= 0) errors.length = 'Length must be > 0';
  if (!data.width || parseFloat(data.width) <= 0) errors.width = 'Width must be > 0';
  if (!data.height || parseFloat(data.height) <= 0) errors.height = 'Height must be > 0';

  if (data.diameter && isNaN(parseFloat(data.diameter))) {
    errors.diameter = 'Diameter must be numeric';
  }

  if (data.carWidth && data.width && parseFloat(data.width) > data.carWidth) {
    errors.width = `Width must not exceed car width (${data.carWidth}m)`;
  }

  if (data.carHeight && data.height && parseFloat(data.height) > data.carHeight) {
    errors.height = `Height must not exceed interior height (${data.carHeight}m)`;
  }

  return errors;
}

export interface OptimizationErrors {
  vehicles?: string;
  loads?: string;
  weights?: string;
  dimensions?: string;
  overlaps?: string;
}

export function validateOptimizationSetup(
  vehicleCount: number,
  loads: { id: string; weight: number; w: number; h: number; d: number; x: number; y: number; z: number }[]
): OptimizationErrors {
  const errors: OptimizationErrors = {};

  if (vehicleCount === 0) errors.vehicles = 'At least one vehicle required';
  if (loads.length === 0) errors.loads = 'At least one load required';

  const zeroWeight = loads.filter(l => l.weight <= 0);
  if (zeroWeight.length > 0) {
    errors.weights = `Loads with zero weight: ${zeroWeight.map(l => l.id).join(', ')}`;
  }

  const zeroDims = loads.filter(l => l.w <= 0 || l.h <= 0 || l.d <= 0);
  if (zeroDims.length > 0) {
    errors.dimensions = `Loads with zero dimensions: ${zeroDims.map(l => l.id).join(', ')}`;
  }

  // Quick overlap check
  for (let i = 0; i < loads.length; i++) {
    for (let j = i + 1; j < loads.length; j++) {
      const a = loads[i], b = loads[j];
      if (
        a.x < b.x + b.w && a.x + a.w > b.x &&
        a.y < b.y + b.h && a.y + a.h > b.y &&
        a.z < b.z + b.d && a.z + a.d > b.z
      ) {
        errors.overlaps = `Overlapping: ${a.id} and ${b.id}`;
        break;
      }
    }
    if (errors.overlaps) break;
  }

  return errors;
}
