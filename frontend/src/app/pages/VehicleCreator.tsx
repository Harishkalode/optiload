import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Save, Undo, Redo, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { VehicleCanvas3D } from '../components/vehicle-creator/VehicleCanvas3D';
import { StepIndicator } from '../components/vehicle-creator/StepIndicator';
import { VehicleTypePicker } from '../components/vehicle-creator/VehicleTypePicker';
import { AxleSelector } from '../components/vehicle-creator/AxleSelector';
import { LengthControls } from '../components/vehicle-creator/LengthControls';
import { AxleSpacingControls } from '../components/vehicle-creator/AxleSpacingControls';
import { LoadLimitSelector } from '../components/vehicle-creator/LoadLimitSelector';
import { InteriorControls } from '../components/vehicle-creator/InteriorControls';
import { ReviewPanel } from '../components/vehicle-creator/ReviewPanel';
import { ValidationPanel } from '../components/vehicle-creator/ValidationPanel';
import { toast } from 'sonner';

export type VehicleType = 'boxcar' | 'flatcar' | 'gondola' | 'reefer';
export type PlateType = 'A' | 'B' | 'C';

export interface VehicleConfig {
  type: VehicleType;
  length: number; // inches
  width: number; // inches
  height: number; // inches
  emptyWeight: number; // lbs
  loadLimit: number; // lbs
  plate: PlateType;
  bogies: Bogie[];
  doorPosition: number; // 0-100%
  interiorWidth: number; // inches
}

export interface Bogie {
  id: string;
  position: number; // position along length (0-100%)
  axleCount: number;
  maxAxleLoad: number; // lbs
  suspensionType: 'spring' | 'hydraulic' | 'air';
}

const STEPS = [
  { id: 1, label: 'Vehicle Type', icon: '🚂' },
  { id: 2, label: 'Axle Config', icon: '⚙️' },
  { id: 3, label: 'Dimensions', icon: '📏' },
  { id: 4, label: 'Spacing', icon: '↔️' },
  { id: 5, label: 'Load Limits', icon: '⚖️' },
  { id: 6, label: 'Interior', icon: '🔧' },
  { id: 7, label: 'Review', icon: '✓' },
];

const DEFAULT_VEHICLE: VehicleConfig = {
  type: 'boxcar',
  length: 600, // 50 feet = 600 inches
  width: 120, // 10 feet
  height: 180, // 15 feet
  emptyWeight: 60000,
  loadLimit: 200000,
  plate: 'B',
  bogies: [
    { id: 'b1', position: 15, axleCount: 2, maxAxleLoad: 50000, suspensionType: 'spring' },
    { id: 'b2', position: 85, axleCount: 2, maxAxleLoad: 50000, suspensionType: 'spring' },
  ],
  doorPosition: 50,
  interiorWidth: 108,
};

export function VehicleCreator() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicle, setVehicle] = useState<VehicleConfig>(DEFAULT_VEHICLE);
  const [history, setHistory] = useState<VehicleConfig[]>([DEFAULT_VEHICLE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const bg = isDark ? '#080D13' : '#F1F5F9';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';

  const updateVehicle = useCallback((updates: Partial<VehicleConfig>) => {
    setVehicle(prev => {
      const newVehicle = { ...prev, ...updates };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newVehicle);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newVehicle;
    });
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setVehicle(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setVehicle(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    toast.success('Vehicle template saved successfully');
    navigate('/vehicles');
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-full flex flex-col" style={{ background: bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 sm:p-4" style={{ background: cardBg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/vehicles')}
            className="p-2 rounded-lg transition-colors"
            style={{ color: text }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, fontFamily: 'Space Grotesk, sans-serif' }}>
              Vehicle Creator
            </div>
            <div style={{ fontSize: '12px', color: text }}>
              Step {currentStep} of {STEPS.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg transition-all"
            style={{
              color: canUndo ? text : border,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => canUndo && (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg transition-all"
            style={{
              color: canRedo ? text : border,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => canRedo && (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Redo size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Step Control */}
        <div className="w-72 flex-shrink-0 overflow-y-auto p-4" style={{ background: cardBg, borderRight: `1px solid ${border}` }}>
          <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
          
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <VehicleTypePicker value={vehicle.type} onChange={type => updateVehicle({ type })} />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <AxleSelector bogies={vehicle.bogies} onChange={bogies => updateVehicle({ bogies })} />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <LengthControls
                    length={vehicle.length}
                    width={vehicle.width}
                    height={vehicle.height}
                    onChange={(length, width, height) => updateVehicle({ length, width, height })}
                  />
                </motion.div>
              )}
              {currentStep === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <AxleSpacingControls bogies={vehicle.bogies} onChange={bogies => updateVehicle({ bogies })} vehicleLength={vehicle.length} />
                </motion.div>
              )}
              {currentStep === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <LoadLimitSelector
                    loadLimit={vehicle.loadLimit}
                    plate={vehicle.plate}
                    emptyWeight={vehicle.emptyWeight}
                    onChange={(loadLimit, plate, emptyWeight) => updateVehicle({ loadLimit, plate, emptyWeight })}
                  />
                </motion.div>
              )}
              {currentStep === 6 && (
                <motion.div key="step6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <InteriorControls
                    doorPosition={vehicle.doorPosition}
                    interiorWidth={vehicle.interiorWidth}
                    maxWidth={vehicle.width}
                    onChange={(doorPosition, interiorWidth) => updateVehicle({ doorPosition, interiorWidth })}
                  />
                </motion.div>
              )}
              {currentStep === 7 && (
                <motion.div key="step7" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <ReviewPanel vehicle={vehicle} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - 3D Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <VehicleCanvas3D vehicle={vehicle} />
        </div>

        {/* Right Panel - Validation */}
        <div className="w-80 flex-shrink-0 overflow-y-auto p-4" style={{ background: cardBg, borderLeft: `1px solid ${border}` }}>
          <ValidationPanel vehicle={vehicle} />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between p-4" style={{ background: cardBg, borderTop: `1px solid ${border}` }}>
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{
            background: currentStep === 1 ? 'transparent' : (isDark ? '#1E2A38' : '#F1F5F9'),
            color: currentStep === 1 ? border : text,
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {currentStep === STEPS.length ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all"
              style={{
                background: palette.primary,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Save size={16} />
              Save Vehicle Template
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all"
              style={{
                background: palette.primary,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Next Step
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
