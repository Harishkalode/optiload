import { useTheme } from '../../contexts/ThemeContext';
import { Bogie } from '../../pages/VehicleCreator';
import { MoveHorizontal } from 'lucide-react';

interface Props {
  bogies: Bogie[];
  onChange: (bogies: Bogie[]) => void;
  vehicleLength: number;
}

export function AxleSpacingControls({ bogies, onChange, vehicleLength }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  const updateBogiePosition = (id: string, position: number) => {
    onChange(bogies.map(b => b.id === id ? { ...b, position } : b));
  };

  // Calculate spacing between bogies
  const calculateSpacing = () => {
    if (bogies.length < 2) return null;
    const sorted = [...bogies].sort((a, b) => a.position - b.position);
    const spacingInches = (sorted[1].position - sorted[0].position) * vehicleLength / 100;
    return spacingInches;
  };

  const spacing = calculateSpacing();
  const isValidSpacing = spacing ? spacing >= 120 : true; // Min 10 feet

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Axle Spacing Configuration
      </div>

      {/* Spacing Info */}
      {spacing && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: isValidSpacing ? palette.success + '15' : palette.error + '15',
            border: `1px solid ${isValidSpacing ? palette.success : palette.error}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 40,
                height: 40,
                background: isValidSpacing ? palette.success : palette.error,
                color: '#ffffff',
              }}
            >
              <MoveHorizontal size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
                Truck Spacing
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary }}>
                {(spacing / 12).toFixed(1)}'
                <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: 4 }}>({spacing.toFixed(0)}")</span>
              </div>
              {!isValidSpacing && (
                <div style={{ fontSize: '11px', color: palette.error, marginTop: 2 }}>
                  ⚠️ Minimum spacing is 10 feet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bogie Position Controls */}
      {bogies.map((bogie, index) => (
        <div key={bogie.id} className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
                Bogie {index + 1} Position
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                {bogie.position}%
                <span style={{ fontSize: '13px', color: text, fontWeight: 400, marginLeft: 4 }}>
                  ({((bogie.position / 100) * vehicleLength / 12).toFixed(1)}' from front)
                </span>
              </div>
            </div>
          </div>

          <input
            type="range"
            min="5"
            max="95"
            step="1"
            value={bogie.position}
            onChange={e => updateBogiePosition(bogie.id, Number(e.target.value))}
            className="w-full"
            style={{ accentColor: palette.primary }}
          />

          <div className="flex justify-between mt-2" style={{ fontSize: '10px', color: text }}>
            <span>Front (5%)</span>
            <span>Center (50%)</span>
            <span>Rear (95%)</span>
          </div>
        </div>
      ))}

      {/* Visual Representation */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Spacing Visualization
        </div>
        <div className="relative" style={{ height: 60 }}>
          {/* Vehicle outline */}
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded"
            style={{
              left: 0,
              right: 0,
              height: 24,
              background: isDark ? '#1E2A38' : '#E2E8F0',
              border: `2px solid ${border}`,
            }}
          />
          {/* Bogies */}
          {bogies.map((bogie, index) => (
            <div
              key={bogie.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{
                left: `${bogie.position}%`,
                width: 12,
                height: 40,
                background: palette.primary,
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
