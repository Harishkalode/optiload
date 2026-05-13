/**
 * OptimizationContext.tsx - Centralized state for optimization results
 * Holds: placements, securements, violations, metrics
 * Methods: setPlacement, addSecurement, undoLastMove, fetchResult
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '../services/http';

export interface LoadPlacement {
  load_id: number;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  placed_w: number;
  placed_h: number;
  placed_d: number;
}

export interface Securement {
  id: number;
  type: string;
  position: [number, number, number];
  load_id: number;
  reason?: string;
  [key: string]: any;
}

export interface Violation {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface OptimizationMetrics {
  cg_x: number;
  cg_y: number;
  cg_z: number;
  volume_utilization: number;
  weight_utilization: number;
  lateral_imbalance_pct: number;
  longitudinal_imbalance_pct: number;
}

export interface OptimizationResult {
  placements: LoadPlacement[];
  securements: Securement[];
  violations: Violation[];
  warnings: Violation[];
  metrics: OptimizationMetrics;
  efficiency_score: number;
  suggested_securements: Securement[];
}

interface OptimizationContextType {
  result: OptimizationResult | null;
  optimizationId: number | null;
  loading: boolean;
  error: string | null;

  // State change methods
  setPlacement: (loadId: number, x: number, y: number, z: number) => Promise<void>;
  addSecurement: (securement: Securement) => void;
  removeSecurement: (secId: number) => void;
  fetchResult: (optimizationId: number) => Promise<void>;
  undoLastMove: (optimizationId: number) => Promise<void>;
  
  // History
  history: OptimizationResult[];
  historyIndex: number;
}

const OptimizationContext = createContext<OptimizationContextType | undefined>(undefined);

export const OptimizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [optimizationId, setOptimizationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<OptimizationResult[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const fetchResult = useCallback(async (optId: number) => {
    setLoading(true);
    setError(null);
    setOptimizationId(optId);
    try {
      const data = await apiRequest<{ result: any }>(`/optimization/${optId}/result`);
      if (data.result) {
        const res = data.result;
        const optimizationResult: OptimizationResult = {
          placements: res.placements || [],
          securements: res.securements || [],
          violations: res.violations || [],
          warnings: res.warnings || [],
          metrics: res.metrics || {},
          efficiency_score: res.efficiency_score || 0,
          suggested_securements: res.suggested_securements || [],
        };
        setResult(optimizationResult);
        setHistory([optimizationResult]);
        setHistoryIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch result');
    } finally {
      setLoading(false);
    }
  }, []);

  const setPlacement = useCallback(async (loadId: number, x: number, y: number, z: number) => {
    if (!result || !optimizationId) return;

    try {
      const updated = {
        ...result,
        placements: result.placements.map(p =>
          p.load_id === loadId ? { ...p, x, y, z } : p
        ),
      };
      setResult(updated);
      setHistory([...history.slice(0, historyIndex + 1), updated]);
      setHistoryIndex(historyIndex + 1);

      // Validate with backend (optional)
      const data = await apiRequest<{ violations: any[] }>(`/optimization/${optimizationId}/validate`, {
        method: 'POST',
        body: JSON.stringify({ placements: updated.placements }),
      });
      if (data) {
        setResult(prev => prev ? { ...prev, violations: data.violations || [] } : null);
      }
    } catch (err) {
      console.error('Failed to set placement:', err);
    }
  }, [result, optimizationId, history, historyIndex]);

  const addSecurement = useCallback((securement: Securement) => {
    if (result) {
      const updated = {
        ...result,
        securements: [...result.securements, securement],
      };
      setResult(updated);
      setHistory([...history.slice(0, historyIndex + 1), updated]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [result, history, historyIndex]);

  const removeSecurement = useCallback((secId: number) => {
    if (result) {
      const updated = {
        ...result,
        securements: result.securements.filter(s => s.id !== secId),
      };
      setResult(updated);
      setHistory([...history.slice(0, historyIndex + 1), updated]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [result, history, historyIndex]);

  const undoLastMove = useCallback(async (optId: number) => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setResult(history[historyIndex - 1]);
    } else {
      // Fetch original from backend
      await fetchResult(optId);
    }
  }, [history, historyIndex, fetchResult]);

  return (
    <OptimizationContext.Provider
      value={{
        result,
        optimizationId,
        loading,
        error,
        setPlacement,
        addSecurement,
        removeSecurement,
        fetchResult,
        undoLastMove,
        history,
        historyIndex,
      }}
    >
      {children}
    </OptimizationContext.Provider>
  );
};

export const useOptimization = () => {
  const context = useContext(OptimizationContext);
  if (!context) {
    throw new Error('useOptimization must be used within OptimizationProvider');
  }
  return context;
};
