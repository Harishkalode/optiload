import { useState } from 'react';
import { BarChart2, Settings, Info, Target, GitCompare } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'motion/react';
import { OptimizationStrategyPanel, type OptimizationObjective, type OptimizationWeights } from './OptimizationStrategyPanel';
import { ComplianceChecklistPanel, type ComplianceCheck } from './ComplianceChecklistPanel';
import { OptimizationConfidenceScore, type ConfidenceMetrics } from './OptimizationConfidenceScore';
import { ShockSimulationPanel, type ShockSimulationConfig, type StressMetrics } from './ShockSimulationPanel';
import { ExplainabilityPanel, type LoadExplanation } from './ExplainabilityPanel';
import { ScenarioComparisonPanel, ScenarioComparisonView, type ScenarioData } from './ScenarioComparisonPanel';
import { RightPanel as OriginalRightPanel } from './RightPanel';
import type { Load3D } from './Scene3D';
import type { EngineOutput } from '../../engine/AAREngine';

type TabId = 'overview' | 'advanced' | 'explain' | 'scenarios';

interface Props {
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
  
  // New props for advanced features
  optimizationObjective: OptimizationObjective;
  optimizationWeights: OptimizationWeights;
  shockConfig: ShockSimulationConfig;
  stressMetrics: StressMetrics;
  confidenceMetrics: ConfidenceMetrics;
  complianceChecks: ComplianceCheck[];
  loadExplanation: LoadExplanation | null;
  scenarios: ScenarioData[];
  
  onObjectiveChange: (obj: OptimizationObjective) => void;
  onWeightsChange: (weights: OptimizationWeights) => void;
  onShockConfigChange: (config: ShockSimulationConfig) => void;
  onSaveScenario: (name: string) => void;
  onCompareScenarios: (idA: string, idB: string) => void;
  onDeleteScenario: (id: string) => void;
  onShowAlternate?: () => void;
}

const TABS = [
  { id: 'overview' as const, label: 'Overview', icon: BarChart2 },
  { id: 'advanced' as const, label: 'Advanced', icon: Settings },
  { id: 'explain' as const, label: 'Explain', icon: Info },
  { id: 'scenarios' as const, label: 'Scenarios', icon: Target },
];

export function EnhancedRightPanel(props: Props) {
  const { isDark, palette } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [compareMode, setCompareMode] = useState(false);
  const [compareScenarios, setCompareScenarios] = useState<{ a: string; b: string } | null>(null);
  
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const panelBg = isDark ? '#07101A' : '#F8FAFC';

  const handleCompare = (idA: string, idB: string) => {
    const scenarioA = props.scenarios.find(s => s.id === idA);
    const scenarioB = props.scenarios.find(s => s.id === idB);
    
    if (scenarioA && scenarioB) {
      setCompareScenarios({ a: idA, b: idB });
      setCompareMode(true);
    }
    
    props.onCompareScenarios(idA, idB);
  };

  return (
    <>
      <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', background: panelBg }}>
        {/* Tab Bar */}
        <div 
          className="flex items-center gap-1 px-2 py-2 flex-shrink-0"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isActive ? palette.primary : text,
                  background: isActive ? `${palette.primary}15` : 'transparent',
                }}
              >
                <Icon size={13} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg"
                    style={{ border: `1px solid ${palette.primary}`, zIndex: -1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="p-4 space-y-4">
              {/* Confidence Score at top */}
              <OptimizationConfidenceScore 
                metrics={props.confidenceMetrics}
                showDetails={false}
              />
              
              {/* Original Overview Content */}
              <div style={{ marginTop: 16 }}>
                <OriginalRightPanel {...props} />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="p-4 space-y-6">
              {/* Optimization Strategy */}
              <OptimizationStrategyPanel
                objective={props.optimizationObjective}
                weights={props.optimizationWeights}
                onObjectiveChange={props.onObjectiveChange}
                onWeightsChange={props.onWeightsChange}
              />
              
              {/* Shock Simulation */}
              <ShockSimulationPanel
                config={props.shockConfig}
                metrics={props.stressMetrics}
                onConfigChange={props.onShockConfigChange}
              />
              
              {/* Compliance Checklist */}
              <ComplianceChecklistPanel
                checks={props.complianceChecks}
              />
            </div>
          )}

          {activeTab === 'explain' && (
            <div className="p-4">
              <ExplainabilityPanel
                explanation={props.loadExplanation}
                onShowAlternate={props.onShowAlternate}
              />
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="p-4">
              <ScenarioComparisonPanel
                scenarios={props.scenarios}
                onSaveScenario={props.onSaveScenario}
                onCompare={handleCompare}
                onDeleteScenario={props.onDeleteScenario}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {compareMode && compareScenarios && (
        <ScenarioComparisonView
          scenarioA={props.scenarios.find(s => s.id === compareScenarios.a)!}
          scenarioB={props.scenarios.find(s => s.id === compareScenarios.b)!}
          onClose={() => {
            setCompareMode(false);
            setCompareScenarios(null);
          }}
        />
      )}
    </>
  );
}
