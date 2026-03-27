import { Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Step {
  id: number;
  label: string;
  icon: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';

  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isAccessible = step.id <= currentStep;

        return (
          <button
            key={step.id}
            onClick={() => isAccessible && onStepClick(step.id)}
            disabled={!isAccessible}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
            style={{
              background: isActive ? palette.primary + '15' : 'transparent',
              border: `1px solid ${isActive ? palette.primary : border}`,
              cursor: isAccessible ? 'pointer' : 'not-allowed',
              opacity: isAccessible ? 1 : 0.5,
            }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 transition-all"
              style={{
                width: 32,
                height: 32,
                background: isCompleted ? palette.success : isActive ? palette.primary : border,
                color: isCompleted || isActive ? '#ffffff' : text,
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {isCompleted ? <Check size={16} /> : step.icon}
            </div>
            <div className="flex-1 text-left">
              <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? palette.primary : textPrimary }}>
                {step.label}
              </div>
              <div style={{ fontSize: '11px', color: text }}>
                Step {step.id}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
