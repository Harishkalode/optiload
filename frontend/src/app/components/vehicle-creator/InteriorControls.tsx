import { useTheme } from '../../contexts/ThemeContext';
import { DoorOpen, Maximize2 } from 'lucide-react';

interface Props {
  doorPosition: number;
  interiorWidth: number;
  maxWidth: number;
  onChange: (doorPosition: number, interiorWidth: number) => void;
}

export function InteriorControls({ doorPosition, interiorWidth, maxWidth, onChange }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  const clearanceWarning = maxWidth - interiorWidth < 6;

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Interior Configuration
      </div>

      {/* Door Position */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 40, height: 40, background: palette.primary + '20', color: palette.primary }}
          >
            <DoorOpen size={20} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
              Door Position
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary }}>
              {doorPosition}%
            </div>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={doorPosition}
          onChange={e => onChange(Number(e.target.value), interiorWidth)}
          className="w-full"
          style={{ accentColor: palette.primary }}
        />
        <div className="flex justify-between mt-2" style={{ fontSize: '10px', color: text }}>
          <span>Left (0%)</span>
          <span>Center (50%)</span>
          <span>Right (100%)</span>
        </div>
      </div>

      {/* Interior Width */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: clearanceWarning ? palette.warning + '15' : cardBg,
          border: `1px solid ${clearanceWarning ? palette.warning : border}`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 40,
              height: 40,
              background: clearanceWarning ? palette.warning : palette.accent + '20',
              color: clearanceWarning ? '#ffffff' : palette.accent,
            }}
          >
            <Maximize2 size={20} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>
              Interior Width
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary }}>
              {(interiorWidth / 12).toFixed(1)}'
              <span style={{ fontSize: '13px', color: text, fontWeight: 400, marginLeft: 4 }}>
                ({interiorWidth}")
              </span>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="84"
          max={maxWidth - 6}
          step="2"
          value={interiorWidth}
          onChange={e => onChange(doorPosition, Number(e.target.value))}
          className="w-full"
          style={{ accentColor: clearanceWarning ? palette.warning : palette.accent }}
        />
        <div className="flex justify-between mt-2" style={{ fontSize: '10px', color: text }}>
          <span>Min (7')</span>
          <span>Max ({((maxWidth - 6) / 12).toFixed(1)}')</span>
        </div>

        {clearanceWarning && (
          <div
            className="mt-3 p-2 rounded-lg flex items-start gap-2"
            style={{ background: palette.warning + '15', border: `1px solid ${palette.warning}` }}
          >
            <div style={{ fontSize: '16px' }}>⚠️</div>
            <div style={{ fontSize: '11px', color: textPrimary }}>
              <strong>Low Clearance Warning:</strong> Only {maxWidth - interiorWidth}" clearance. May affect load placement patterns.
            </div>
          </div>
        )}
      </div>

      {/* Clearance Visualization */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Clearance Visualization
        </div>
        <div className="relative" style={{ height: 80 }}>
          {/* Outer walls */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 rounded"
            style={{
              border: `3px solid ${border}`,
            }}
          />
          {/* Interior usable space */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
            style={{
              width: `${(interiorWidth / maxWidth) * 100}%`,
              height: '60%',
              background: palette.success + '30',
              border: `2px dashed ${palette.success}`,
            }}
          />
          {/* Clearance markers */}
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2"
            style={{
              width: `${((maxWidth - interiorWidth) / 2 / maxWidth) * 100}%`,
              height: '60%',
              background: clearanceWarning ? palette.warning + '40' : palette.primary + '20',
            }}
          />
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2"
            style={{
              width: `${((maxWidth - interiorWidth) / 2 / maxWidth) * 100}%`,
              height: '60%',
              background: clearanceWarning ? palette.warning + '40' : palette.primary + '20',
            }}
          />
        </div>
        <div className="flex justify-between mt-3" style={{ fontSize: '11px', color: text }}>
          <div>Clearance: {((maxWidth - interiorWidth) / 2).toFixed(1)}"</div>
          <div>Usable: {interiorWidth}"</div>
          <div>Clearance: {((maxWidth - interiorWidth) / 2).toFixed(1)}"</div>
        </div>
      </div>
    </div>
  );
}
