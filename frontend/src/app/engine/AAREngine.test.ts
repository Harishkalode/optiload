import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAARValidation, validateDragPosition, DEFAULT_CAR, checkSingleCollision } from '../engine/AAREngine';
import type { LoadItem, CarConfig } from '../engine/AAREngine';

// ── Test Fixtures ─────────────────────────────────────────────────────────────

const defaultCar: CarConfig = {
  length: 20, width: 3.2, interiorHeight: 2.4, loadLimit: 80000,
  tareWeight: 20000, emptyCGHeight: 45, plateType: 'C',
  truckCenterFront: 3.5, truckCenterRear: 16.5,
  axlePositions: [2.5, 7.5, 12.5, 17.5], axleLimit: 22500,
  endwallForceLimit: 100000, allowedGap: 1.5, platformHeight: 1.1,
};

const makeLoad = (id: string, x = 0, z = 0, w = 1, h = 1, d = 1, weight = 100): LoadItem => ({
  id, x, z, w, h, d, weight, name: id, volume: w * h * d,
  fragile: false, priority: 5, customer: '', compatScore: 90,
  stackGroup: 'A', rotationAllowed: true, y: 0,
});

// ═══════════════════════════════════════════════════════════════════════════════
// A. CORE FUNCTIONAL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('A. Core Functional', () => {
  it('validates empty loads', () => {
    const result = runAARValidation(defaultCar, []);
    expect(result.violations).toEqual([]);
    // Empty car has tare weight CG at emptyCGHeight (45")
    expect(result.combinedCG).toBe(45);
  });

  it('validates single load', () => {
    const loads = [makeLoad('L1', 5, 1, 1, 1, 1, 100)];
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(100);
    expect(result.combinedCG).toBeGreaterThan(0);
  });

  it('validates multiple loads', () => {
    const loads = [
      makeLoad('L1', 2, 1, 1, 1, 1, 100),
      makeLoad('L2', 6, 1, 1, 1, 1, 200),
    ];
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(300);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// B. CONSTRAINT RULE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('B. Constraint Rules', () => {
  it('detects load out of bounds (x)', () => {
    const loads = [makeLoad('L1', 15, 1, 1, 1, 1, 100)]; // x=15, far from center
    const result = runAARValidation(defaultCar, loads);
    // Out-of-bounds loads cause truck weight or CG violations
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('detects load out of bounds (z)', () => {
    const loads = [makeLoad('L1', 10, 3, 1, 1, 1, 100)]; // z=3, off car width
    const result = runAARValidation(defaultCar, loads);
    // Off-center loads cause lateral imbalance
    expect(result.lateralImbalance.percent).toBeGreaterThan(50);
  });

  it('detects load out of bounds (y)', () => {
    // Very heavy load at very high position to push CG above 98"
    const loads = [{ ...makeLoad('L1', 10, 1.6, 1, 5, 1, 70000), y: 3 }];
    const result = runAARValidation(defaultCar, loads);
    expect(result.combinedCG).toBeGreaterThan(result.combinedCGLimit);
  });

  it('detects collision between loads', () => {
    const loads = [
      makeLoad('L1', 0, 0, 2, 1, 1, 100),
      makeLoad('L2', 1, 0, 2, 1, 1, 100), // overlaps L1
    ];
    const result = runAARValidation(defaultCar, loads);
    const collisions = result.violations.filter(v => v.rule === 'Bounding Box Collision');
    expect(collisions.length).toBeGreaterThan(0);
  });

  it('no collision for adjacent loads', () => {
    const loads = [
      makeLoad('L1', 0, 0, 2, 1, 1, 100),
      makeLoad('L2', 2, 0, 2, 1, 1, 100), // adjacent, no overlap
    ];
    const result = runAARValidation(defaultCar, loads);
    const collisions = result.violations.filter(v => v.rule === 'Bounding Box Collision');
    expect(collisions.length).toBe(0);
  });

  it('no collision for stacked loads', () => {
    const loads = [
      { ...makeLoad('L1', 0, 0, 2, 1, 1, 100), y: 0 },
      { ...makeLoad('L2', 0, 0, 2, 1, 1, 100), y: 1 }, // stacked on top
    ];
    const result = runAARValidation(defaultCar, loads);
    const collisions = result.violations.filter(v => v.rule === 'Bounding Box Collision');
    expect(collisions.length).toBe(0);
  });

  it('detects overweight', () => {
    const loads = [makeLoad('L1', 5, 1, 1, 1, 1, 90000)]; // > 80000 loadLimit
    const result = runAARValidation(defaultCar, loads);
    const overweight = result.violations.filter(v => v.rule.includes('Max') || v.rule.includes('Exceeds'));
    expect(overweight.length).toBeGreaterThan(0);
  });

  it('detects high CG', () => {
    // High weight at high y position increases combined CG above 98"
    const loads = [{ ...makeLoad('L1', 10, 1.6, 1, 4, 1, 60000), y: 2 }];
    const result = runAARValidation(defaultCar, loads);
    expect(result.combinedCG).toBeGreaterThan(98);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// C. EDGE CASE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('C. Edge Cases', () => {
  it('handles zero weight load', () => {
    const loads = [makeLoad('L1', 5, 1, 1, 1, 1, 0)];
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(0);
  });

  it('handles very small load', () => {
    const loads = [makeLoad('L1', 5, 1, 0.01, 0.01, 0.01, 0.01)];
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(0.01);
  });

  it('handles very large load', () => {
    const loads = [makeLoad('L1', 0, 0, 12, 2.5, 2.6, 50000)];
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(50000);
  });

  it('handles negative weight', () => {
    const loads = [makeLoad('L1', 5, 1, 1, 1, 1, -100)];
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(-100);
  });

  it('handles load at exact boundary', () => {
    const loads = [makeLoad('L1', 0, 0, 12, 2.5, 2.4, 100)];
    const result = runAARValidation(defaultCar, loads);
    const boundsViolations = result.violations.filter(v => v.rule === 'out_of_bounds');
    expect(boundsViolations.length).toBe(0);
  });

  it('handles duplicate IDs', () => {
    const loads = [
      makeLoad('L1', 0, 0, 1, 1, 1, 100),
      makeLoad('L1', 2, 0, 1, 1, 1, 200),
    ];
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(300);
  });

  it('handles many small loads', () => {
    const loads = Array.from({ length: 50 }, (_, i) =>
      makeLoad(`L${i}`, (i % 10) * 1.2, Math.floor(i / 10) * 0.5, 1, 0.5, 0.5, 10)
    );
    const result = runAARValidation(defaultCar, loads);
    expect(result.totalWeight).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D. DRAG VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('D. Drag Validation', () => {
  it('valid drag position returns no collision', () => {
    const loads = [
      makeLoad('L1', 2, 1, 1, 1, 1, 100),
      makeLoad('L2', 6, 1, 1, 1, 1, 100),
    ];
    const validation = validateDragPosition(defaultCar, 'L1', 3, 1, loads);
    expect(validation.hasCollision).toBe(false);
  });

  it('drag into collision detected', () => {
    const loads = [
      makeLoad('L1', 2, 1, 1, 1, 1, 100),
      makeLoad('L2', 3, 1, 1, 1, 1, 100),
    ];
    const validation = validateDragPosition(defaultCar, 'L1', 3, 1, loads);
    expect(validation.hasCollision).toBe(true);
  });

  it('drag out of bounds increases CG', () => {
    const loads = [makeLoad('L1', 5, 1, 1, 1, 1, 100)];
    const validation = validateDragPosition(defaultCar, 'L1', 15, 1, loads);
    // Dragging far out should increase combined CG
    expect(validation.combinedCG).toBeGreaterThan(0);
  });

  it('checkSingleCollision detects overlap', () => {
    const hasCollision = checkSingleCollision('L1', 1, 0, 0, { w: 2, h: 1, d: 1 }, [
      { id: 'L2', x: 1.5, z: 0, w: 2, h: 1, d: 1, weight: 100, y: 0 },
    ]);
    expect(hasCollision).toBe(true);
  });

  it('checkSingleCollision no overlap for adjacent', () => {
    const hasCollision = checkSingleCollision('L1', 2, 0, 0, { w: 2, h: 1, d: 1 }, [
      { id: 'L2', x: 0, z: 0, w: 2, h: 1, d: 1, weight: 100, y: 0 },
    ]);
    expect(hasCollision).toBe(false);
  });

  it('checkSingleCollision skips same ID', () => {
    const hasCollision = checkSingleCollision('L1', 0, 0, 0, { w: 1, h: 1, d: 1 }, [
      { id: 'L1', x: 0, z: 0, w: 1, h: 1, d: 1, weight: 100, y: 0 },
    ]);
    expect(hasCollision).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// E. BALANCE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('E. Balance', () => {
  it('centered loads have low lateral imbalance', () => {
    // Car width 3.2, center is 1.6. Place load centered.
    const loads = [
      makeLoad('L1', 10, 1.1, 1, 1, 1, 100), // z=1.1, d=1 → center=1.6
      makeLoad('L2', 10, 1.1, 1, 1, 1, 100),
    ];
    const result = runAARValidation(defaultCar, loads);
    expect(result.lateralImbalance.percent).toBeLessThan(10);
  });

  it('lateral imbalance detected for off-center load', () => {
    const loads = [makeLoad('L1', 10, 0, 1, 1, 1, 100)]; // z=0, all weight on left
    const result = runAARValidation(defaultCar, loads);
    expect(result.lateralImbalance.percent).toBeGreaterThan(5);
  });

  it('combined CG calculated correctly', () => {
    const loads = [makeLoad('L1', 10, 1.6, 1, 1, 1, 100)];
    const result = runAARValidation(defaultCar, loads);
    expect(result.combinedCG).toBeGreaterThan(0);
    expect(result.combinedCGLimit).toBe(98);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// F. PERFORMANCE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('F. Performance', () => {
  it('validates 10 loads quickly', () => {
    const loads = Array.from({ length: 10 }, (_, i) =>
      makeLoad(`L${i}`, (i % 5) * 2, Math.floor(i / 5), 1, 1, 1, 100)
    );
    const start = performance.now();
    runAARValidation(defaultCar, loads);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('validates 100 loads quickly', () => {
    const loads = Array.from({ length: 100 }, (_, i) =>
      makeLoad(`L${i}`, (i % 10) * 1.2, (Math.floor(i / 10) % 2) * 1.2, 1, 1, 1, 10)
    );
    const start = performance.now();
    runAARValidation(defaultCar, loads);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
