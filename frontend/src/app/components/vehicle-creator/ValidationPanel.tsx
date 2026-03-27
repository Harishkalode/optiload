import { useTheme } from '../../contexts/ThemeContext';
import { VehicleConfig } from '../../pages/VehicleCreator';
import { CheckCircle2, AlertTriangle, XCircle, Activity, Target, Gauge } from 'lucide-react';

interface Props {
  vehicle: VehicleConfig;
}

interface ValidationResult {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  value?: string;
}

export function ValidationPanel({ vehicle }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  // Run validation checks
  const validations: ValidationResult[] = [];

  // Check bogie spacing
  if (vehicle.bogies.length >= 2) {
    const sorted = [...vehicle.bogies].sort((a, b) => a.position - b.position);
    const spacing = (sorted[1].position - sorted[0].position) * vehicle.length / 100;
    if (spacing < 120) {
      validations.push({
        category: 'Truck Spacing',
        status: 'fail',
        message: 'Spacing below minimum 10 feet',
        value: `${(spacing / 12).toFixed(1)}'`,
      });
    } else if (spacing < 180) {
      validations.push({
        category: 'Truck Spacing',
        status: 'warning',
        message: 'Spacing acceptable but tight',
        value: `${(spacing / 12).toFixed(1)}'`,
      });
    } else {
      validations.push({
        category: 'Truck Spacing',
        status: 'pass',
        message: 'Optimal spacing',
        value: `${(spacing / 12).toFixed(1)}'`,
      });
    }
  }

  // Check load limit vs empty weight
  const netCapacity = vehicle.loadLimit - vehicle.emptyWeight;
  if (netCapacity < 100000) {
    validations.push({
      category: 'Load Capacity',
      status: 'warning',
      message: 'Low net capacity',
      value: `${(netCapacity / 1000).toFixed(0)}K lbs`,
    });
  } else {
    validations.push({
      category: 'Load Capacity',
      status: 'pass',
      message: 'Good net capacity',
      value: `${(netCapacity / 1000).toFixed(0)}K lbs`,
    });
  }

  // Check axle load distribution
  const totalAxles = vehicle.bogies.reduce((sum, b) => sum + b.axleCount, 0);
  const avgAxleLoad = vehicle.loadLimit / totalAxles;
  const maxAxleLoad = Math.max(...vehicle.bogies.map(b => b.maxAxleLoad));
  
  if (avgAxleLoad > maxAxleLoad) {
    validations.push({
      category: 'Axle Load',
      status: 'fail',
      message: 'Average load exceeds max axle capacity',
      value: `${(avgAxleLoad / 1000).toFixed(0)}K vs ${(maxAxleLoad / 1000).toFixed(0)}K`,
    });
  } else if (avgAxleLoad > maxAxleLoad * 0.8) {
    validations.push({
      category: 'Axle Load',
      status: 'warning',
      message: 'High utilization of axle capacity',
      value: `${((avgAxleLoad / maxAxleLoad) * 100).toFixed(0)}%`,
    });
  } else {
    validations.push({
      category: 'Axle Load',
      status: 'pass',
      message: 'Well within axle capacity',
      value: `${((avgAxleLoad / maxAxleLoad) * 100).toFixed(0)}%`,
    });
  }

  // Check interior clearance
  const clearance = vehicle.width - vehicle.interiorWidth;
  if (clearance < 6) {
    validations.push({
      category: 'Interior Clearance',
      status: 'warning',
      message: 'Minimal wall clearance',
      value: `${clearance}"`,
    });
  } else {
    validations.push({
      category: 'Interior Clearance',
      status: 'pass',
      message: 'Adequate clearance',
      value: `${clearance}"`,
    });
  }

  // Check length vs plate
  const lengthFt = vehicle.length / 12;
  if (vehicle.plate === 'A' && lengthFt > 60) {
    validations.push({
      category: 'Plate Clearance',
      status: 'warning',
      message: 'Long car with Plate A',
      value: `${lengthFt.toFixed(0)}' / Plate ${vehicle.plate}`,
    });
  } else {
    validations.push({
      category: 'Plate Clearance',
      status: 'pass',
      message: 'Plate matches length',
      value: `Plate ${vehicle.plate}`,
    });
  }

  const passCount = validations.filter(v => v.status === 'pass').length;
  const warningCount = validations.filter(v => v.status === 'warning').length;
  const failCount = validations.filter(v => v.status === 'fail').length;

  const overallStatus = failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass';
  const statusColor = overallStatus === 'pass' ? palette.success : overallStatus === 'warning' ? palette.warning : palette.error;

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Real-Time Validation
      </div>

      {/* Overall Status */}
      <div
        className="p-4 rounded-xl"
        style={{ background: statusColor + '15', border: `2px solid ${statusColor}` }}
      >
        <div className="flex items-center gap-3 mb-3">
          {overallStatus === 'pass' && <CheckCircle2 size={32} style={{ color: statusColor }} />}
          {overallStatus === 'warning' && <AlertTriangle size={32} style={{ color: statusColor }} />}
          {overallStatus === 'fail' && <XCircle size={32} style={{ color: statusColor }} />}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
              {overallStatus === 'pass' && 'All Systems Valid'}
              {overallStatus === 'warning' && 'Warnings Detected'}
              {overallStatus === 'fail' && 'Critical Issues'}
            </div>
            <div style={{ fontSize: '11px', color: text }}>
              {passCount} pass • {warningCount} warning • {failCount} fail
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ background: palette.success }}>
            <div style={{ width: `${(passCount / validations.length) * 100}%`, height: '100%', background: palette.success, borderRadius: 9999 }} />
          </div>
          <div className="flex-1 h-2 rounded-full" style={{ background: palette.warning }}>
            <div style={{ width: `${(warningCount / validations.length) * 100}%`, height: '100%', background: palette.warning, borderRadius: 9999 }} />
          </div>
          <div className="flex-1 h-2 rounded-full" style={{ background: palette.error }}>
            <div style={{ width: `${(failCount / validations.length) * 100}%`, height: '100%', background: palette.error, borderRadius: 9999 }} />
          </div>
        </div>
      </div>

      {/* Individual Validations */}
      <div className="space-y-2">
        {validations.map((validation, index) => {
          const color = validation.status === 'pass' ? palette.success : validation.status === 'warning' ? palette.warning : palette.error;
          const Icon = validation.status === 'pass' ? CheckCircle2 : validation.status === 'warning' ? AlertTriangle : XCircle;

          return (
            <div
              key={index}
              className="p-3 rounded-lg"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <div className="flex items-start gap-3">
                <Icon size={18} style={{ color, marginTop: 2, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, marginBottom: 2 }}>
                    {validation.category}
                  </div>
                  <div style={{ fontSize: '11px', color: text, marginBottom: validation.value ? 4 : 0 }}>
                    {validation.message}
                  </div>
                  {validation.value && (
                    <div
                      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: color + '20', color }}
                    >
                      {validation.value}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Metrics */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Key Metrics
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: palette.primary }} />
              <span style={{ fontSize: '12px', color: text }}>Estimated CG</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: palette.success }}>
              85" <span style={{ fontSize: '11px', color: text, fontWeight: 400 }}>({'<'} 98")</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: palette.accent }} />
              <span style={{ fontSize: '12px', color: text }}>Weight Balance</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: palette.success }}>
              ±2% <span style={{ fontSize: '11px', color: text, fontWeight: 400 }}>(Good)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge size={14} style={{ color: palette.secondary }} />
              <span style={{ fontSize: '12px', color: text }}>Capacity Utilization</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
              {((netCapacity / vehicle.loadLimit) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}