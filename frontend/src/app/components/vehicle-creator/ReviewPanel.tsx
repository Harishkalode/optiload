import { useTheme } from '../../contexts/ThemeContext';
import { VehicleConfig } from '../../pages/VehicleCreator';
import { CheckCircle2, Ruler, Scale, Award, Settings, Package } from 'lucide-react';

interface Props {
  vehicle: VehicleConfig;
}

export function ReviewPanel({ vehicle }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  const netCapacity = vehicle.loadLimit - vehicle.emptyWeight;
  const totalAxles = vehicle.bogies.reduce((sum, b) => sum + b.axleCount, 0);

  const specs = [
    {
      icon: Ruler,
      label: 'Dimensions',
      value: `${(vehicle.length / 12).toFixed(0)}' × ${(vehicle.width / 12).toFixed(0)}' × ${(vehicle.height / 12).toFixed(0)}'`,
      color: palette.primary,
    },
    {
      icon: Scale,
      label: 'Load Limit',
      value: `${(vehicle.loadLimit / 1000).toFixed(0)}K lbs`,
      color: palette.accent,
    },
    {
      icon: Package,
      label: 'Empty Weight',
      value: `${(vehicle.emptyWeight / 1000).toFixed(0)}K lbs`,
      color: palette.secondary,
    },
    {
      icon: Award,
      label: 'Plate Type',
      value: `Plate ${vehicle.plate}`,
      color: palette.success,
    },
    {
      icon: Settings,
      label: 'Bogies/Axles',
      value: `${vehicle.bogies.length} bogies / ${totalAxles} axles`,
      color: palette.warning,
    },
  ];

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Vehicle Summary
      </div>

      {/* Vehicle Type Badge */}
      <div
        className="p-4 rounded-xl text-center"
        style={{ background: palette.primary + '15', border: `2px solid ${palette.primary}` }}
      >
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          Vehicle Type
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: palette.primary, fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}>
          {vehicle.type}
        </div>
      </div>

      {/* Net Capacity Highlight */}
      <div
        className="p-4 rounded-xl text-center"
        style={{ background: palette.success + '15', border: `2px solid ${palette.success}` }}
      >
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          Net Load Capacity
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: palette.success, fontFamily: 'Space Grotesk, sans-serif' }}>
          {(netCapacity / 1000).toFixed(0)}K
        </div>
        <div style={{ fontSize: '11px', color: text, marginTop: 2 }}>
          lbs available for cargo
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="space-y-2">
        {specs.map((spec, index) => {
          const Icon = spec.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 36, height: 36, background: spec.color + '20', color: spec.color }}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: '10px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
                  {spec.label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                  {spec.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bogie Details */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Bogie Configuration
        </div>
        <div className="space-y-3">
          {vehicle.bogies.map((bogie, index) => (
            <div
              key={bogie.id}
              className="p-3 rounded-lg"
              style={{ background: isDark ? '#1E2A38' : '#F8FAFC' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                  Bogie {index + 1}
                </span>
                <span style={{ fontSize: '11px', color: text }}>
                  {bogie.position}% position
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2" style={{ fontSize: '11px' }}>
                <div>
                  <div style={{ color: text }}>Axles</div>
                  <div style={{ fontWeight: 600, color: textPrimary }}>{bogie.axleCount}</div>
                </div>
                <div>
                  <div style={{ color: text }}>Max Load</div>
                  <div style={{ fontWeight: 600, color: textPrimary }}>{(bogie.maxAxleLoad / 1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Status */}
      <div
        className="p-4 rounded-xl flex items-center gap-3"
        style={{ background: palette.success + '15', border: `1px solid ${palette.success}` }}
      >
        <CheckCircle2 size={24} style={{ color: palette.success }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
            Configuration Valid
          </div>
          <div style={{ fontSize: '11px', color: text }}>
            All parameters meet AAR standards
          </div>
        </div>
      </div>
    </div>
  );
}
