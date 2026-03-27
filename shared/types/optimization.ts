export interface LoadPlacement {
  loadId: string;
  x: number;
  y: number;
  z: number;
}

export interface AARViolation {
  code: string;
  message: string;
}

export interface OptimizationMetrics {
  runtimeMs: number;
  totalWeight: number;
}

export interface OptimizationResult {
  id: string;
  vehicleId: string;
  loads: LoadPlacement[];
  utilization: number;
  confidenceScore: number;
  aarViolations: AARViolation[];
  metrics: OptimizationMetrics;
}
