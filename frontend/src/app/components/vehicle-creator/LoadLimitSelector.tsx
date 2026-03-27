import { useTheme } from '../../contexts/ThemeContext';
import { PlateType } from '../../pages/VehicleCreator';
import { Scale, Award, Package } from 'lucide-react';

interface Props {
  loadLimit: number;
  plate: PlateType;
  emptyWeight: number;
  onChange: (loadLimit: number, plate: PlateType, emptyWeight: number) => void;
}

const PLATES = [
  { type: 'A' as PlateType, label: 'Plate A', clearance: '10\' 8"', description: 'Standard clearance' },
  { type: 'B' as PlateType, label: 'Plate B', clearance: '11\' 0"', description: 'Intermediate clearance' },
  { type: 'C' as PlateType, label: 'Plate C', clearance: '15\' 0"', description: 'Unrestricted clearance' },
];

export function LoadLimitSelector({ loadLimit, plate, emptyWeight, onChange }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  const netLoadCapacity = loadLimit - emptyWeight;

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Load Capacity & Plate
      </div>

      {/* Load Limit Slider */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 40, height: 40, background: palette.primary + '20', color: palette.primary }}
          >
            <Scale size={20} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
              Maximum Load Limit
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary }}>
              {(loadLimit / 1000).toFixed(0)}K lbs
            </div>
          </div>
        </div>
        <input
          type="range"
          min="100000"
          max="300000"
          step="10000"
          value={loadLimit}
          onChange={e => onChange(Number(e.target.value), plate, emptyWeight)}
          className="w-full"
          style={{ accentColor: palette.primary }}
        />
        <div className="flex justify-between mt-2" style={{ fontSize: '10px', color: text }}>
          <span>100K</span>
          <span>200K</span>
          <span>300K</span>
        </div>
      </div>

      {/* Empty Weight Slider */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 40, height: 40, background: palette.secondary + '20', color: palette.secondary }}
          >
            <Package size={20} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
              Empty Weight
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary }}>
              {(emptyWeight / 1000).toFixed(0)}K lbs
            </div>
          </div>
        </div>
        <input
          type="range"
          min="40000"
          max="100000"
          step="5000"
          value={emptyWeight}
          onChange={e => onChange(loadLimit, plate, Number(e.target.value))}
          className="w-full"
          style={{ accentColor: palette.secondary }}
        />
        <div className="flex justify-between mt-2" style={{ fontSize: '10px', color: text }}>
          <span>40K</span>
          <span>70K</span>
          <span>100K</span>
        </div>
      </div>

      {/* Net Capacity Display */}
      <div
        className="p-4 rounded-xl"
        style={{ background: palette.success + '15', border: `1px solid ${palette.success}` }}
      >
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          Net Load Capacity
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: palette.success }}>
          {(netLoadCapacity / 1000).toFixed(0)}K lbs
        </div>
        <div style={{ fontSize: '11px', color: text, marginTop: 2 }}>
          Available for cargo after empty weight
        </div>
      </div>

      {/* Plate Selector */}
      <div>
        <div style={{ fontSize: '12px', color: text, fontWeight: 600, marginBottom: 8 }}>
          AAR Plate Clearance
        </div>
        <div className="space-y-2">
          {PLATES.map(p => {
            const isSelected = plate === p.type;
            return (
              <button
                key={p.type}
                onClick={() => onChange(loadLimit, p.type, emptyWeight)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: isSelected ? palette.primary + '15' : cardBg,
                  border: `2px solid ${isSelected ? palette.primary : border}`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    background: isSelected ? palette.primary : (isDark ? '#1E2A38' : '#F1F5F9'),
                    color: isSelected ? '#ffffff' : palette.primary,
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  {p.type}
                </div>
                <div className="flex-1 text-left">
                  <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '11px', color: text }}>
                    {p.clearance} • {p.description}
                  </div>
                </div>
                {isSelected && (
                  <Award size={18} style={{ color: palette.primary }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
