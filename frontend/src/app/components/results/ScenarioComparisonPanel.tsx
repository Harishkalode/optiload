import { useState } from 'react';
import { Save, GitCompare, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

export interface ScenarioData {
  id: string;
  name: string;
  timestamp: Date;
  metrics: {
    cgPosition: number;
    axleStress: number;
    efficiency: number;
    stability: number;
    complianceScore: number;
    cost: number;
  };
}

interface Props {
  scenarios: ScenarioData[];
  onSaveScenario: (name: string) => void;
  onCompare: (scenarioA: string, scenarioB: string) => void;
  onDeleteScenario: (id: string) => void;
}

export function ScenarioComparisonPanel({ scenarios, onSaveScenario, onCompare, onDeleteScenario }: Props) {
  const { isDark, palette } = useTheme();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  const handleSave = () => {
    if (scenarioName.trim()) {
      onSaveScenario(scenarioName.trim());
      setScenarioName('');
      setShowSaveDialog(false);
    }
  };

  const handleSelectScenario = (id: string) => {
    setSelectedScenarios(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return [prev[1], id]; // Replace first with new selection
    });
  };

  const canCompare = selectedScenarios.length === 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Scenario Comparison
        </div>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: palette.primary,
            background: `${palette.primary}15`,
            border: `1px solid ${palette.primary}30`,
          }}
        >
          <Save size={12} />
          Save Current
        </button>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl space-y-3"
            style={{ background: cardBg, border: `2px solid ${palette.primary}` }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
              Save Current Scenario
            </div>
            <input
              type="text"
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              placeholder="Enter scenario name..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg transition-colors"
              style={{
                fontSize: '12px',
                background: inputBg,
                border: `1px solid ${border}`,
                color: textPrimary,
                outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!scenarioName.trim()}
                className="flex-1 py-2 px-3 rounded-lg font-semibold transition-all"
                style={{
                  fontSize: '11px',
                  background: scenarioName.trim() ? palette.primary : border,
                  color: scenarioName.trim() ? '#ffffff' : text,
                  cursor: scenarioName.trim() ? 'pointer' : 'not-allowed',
                  opacity: scenarioName.trim() ? 1 : 0.5,
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setScenarioName('');
                }}
                className="px-3 py-2 rounded-lg transition-all"
                style={{
                  fontSize: '11px',
                  color: text,
                  background: inputBg,
                  border: `1px solid ${border}`,
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenario List */}
      {scenarios.length === 0 ? (
        <div className="p-6 rounded-xl text-center" style={{ background: inputBg, border: `1px solid ${border}` }}>
          <Save size={32} style={{ color: text, margin: '0 auto 8px' }} />
          <div style={{ fontSize: '11px', color: text }}>
            No saved scenarios yet
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {scenarios.map((scenario, index) => {
            const isSelected = selectedScenarios.includes(scenario.id);
            
            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectScenario(scenario.id)}
                className="p-3 rounded-lg cursor-pointer transition-all"
                style={{
                  background: isSelected ? `${palette.accent}15` : cardBg,
                  border: `1px solid ${isSelected ? palette.accent : border}`,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: 2 }}>
                      {scenario.name}
                    </div>
                    <div style={{ fontSize: '9px', color: text }}>
                      {scenario.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScenario(scenario.id);
                    }}
                    className="p-1 rounded transition-colors"
                    style={{ color: text }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = text)}
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded" style={{ background: inputBg }}>
                    <div style={{ fontSize: '9px', color: text }}>Efficiency</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: palette.primary }}>
                      {scenario.metrics.efficiency.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center p-2 rounded" style={{ background: inputBg }}>
                    <div style={{ fontSize: '9px', color: text }}>Stability</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: palette.success }}>
                      {scenario.metrics.stability.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center p-2 rounded" style={{ background: inputBg }}>
                    <div style={{ fontSize: '9px', color: text }}>Cost</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: textPrimary }}>
                      ${scenario.metrics.cost.toFixed(0)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Compare Button */}
      {scenarios.length >= 2 && (
        <button
          onClick={() => canCompare && onCompare(selectedScenarios[0], selectedScenarios[1])}
          disabled={!canCompare}
          className="w-full py-3 px-4 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
          style={{
            fontSize: '12px',
            background: canCompare ? `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` : border,
            color: canCompare ? '#ffffff' : text,
            cursor: canCompare ? 'pointer' : 'not-allowed',
            opacity: canCompare ? 1 : 0.5,
          }}
        >
          <GitCompare size={14} />
          Compare Selected Scenarios {selectedScenarios.length > 0 && `(${selectedScenarios.length}/2)`}
        </button>
      )}
    </div>
  );
}

// Comparison View Component
interface ComparisonViewProps {
  scenarioA: ScenarioData;
  scenarioB: ScenarioData;
  onClose: () => void;
}

export function ScenarioComparisonView({ scenarioA, scenarioB, onClose }: ComparisonViewProps) {
  const { isDark, palette } = useTheme();
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  const metrics = [
    { key: 'cgPosition', label: 'CG Position', unit: '"', inverse: false },
    { key: 'axleStress', label: 'Axle Stress', unit: '%', inverse: true },
    { key: 'efficiency', label: 'Efficiency', unit: '%', inverse: false },
    { key: 'stability', label: 'Stability', unit: '%', inverse: false },
    { key: 'complianceScore', label: 'Compliance', unit: '%', inverse: false },
    { key: 'cost', label: 'Cost', unit: '$', inverse: true },
  ];

  const getDelta = (key: keyof ScenarioData['metrics']) => {
    const delta = scenarioB.metrics[key] - scenarioA.metrics[key];
    return delta;
  };

  const getDeltaIcon = (delta: number, inverse: boolean) => {
    const isPositive = inverse ? delta < 0 : delta > 0;
    if (Math.abs(delta) < 0.1) return Minus;
    return isPositive ? TrendingUp : TrendingDown;
  };

  const getDeltaColor = (delta: number, inverse: boolean) => {
    const isPositive = inverse ? delta < 0 : delta > 0;
    if (Math.abs(delta) < 0.1) return text;
    return isPositive ? palette.success : '#EF4444';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="rounded-xl overflow-hidden"
        style={{
          background: isDark ? '#0D1420' : '#ffffff',
          border: `1px solid ${border}`,
          maxWidth: 800,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, marginBottom: 4 }}>
              Scenario Comparison
            </div>
            <div style={{ fontSize: '11px', color: text }}>
              Side-by-side metric analysis
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: text }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div></div>
            <div className="text-center p-3 rounded-xl" style={{ background: `${palette.primary}15`, border: `1px solid ${palette.primary}30` }}>
              <div style={{ fontSize: '10px', color: text, marginBottom: 2 }}>Scenario A</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                {scenarioA.name}
              </div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: `${palette.accent}15`, border: `1px solid ${palette.accent}30` }}>
              <div style={{ fontSize: '10px', color: text, marginBottom: 2 }}>Scenario B</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                {scenarioB.name}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.map(({ key, label, unit, inverse }) => {
              const delta = getDelta(key as keyof ScenarioData['metrics']);
              const DeltaIcon = getDeltaIcon(delta, inverse);
              const deltaColor = getDeltaColor(delta, inverse);

              return (
                <div
                  key={key}
                  className="grid grid-cols-3 gap-4 p-4 rounded-xl"
                  style={{ background: cardBg, border: `1px solid ${border}` }}
                >
                  <div className="flex items-center">
                    <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
                      {label}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                      {unit === '$' && '$'}
                      {scenarioA.metrics[key as keyof ScenarioData['metrics']].toFixed(1)}
                      {unit !== '$' && unit}
                    </span>
                  </div>
                  
                  <div className="text-center flex items-center justify-center gap-2">
                    <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                      {unit === '$' && '$'}
                      {scenarioB.metrics[key as keyof ScenarioData['metrics']].toFixed(1)}
                      {unit !== '$' && unit}
                    </span>
                    <div className="flex items-center gap-1">
                      <DeltaIcon size={12} style={{ color: deltaColor }} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: deltaColor }}>
                        {Math.abs(delta).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
