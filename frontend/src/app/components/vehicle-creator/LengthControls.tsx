import { useTheme } from '../../contexts/ThemeContext';
import { Ruler, ArrowUpDown, ArrowLeftRight } from 'lucide-react';

interface Props {
  length: number;
  width: number;
  height: number;
  onChange: (length: number, width: number, height: number) => void;
}

const PRESETS = [
  { label: '40 ft', length: 480 },
  { label: '50 ft', length: 600 },
  { label: '60 ft', length: 720 },
  { label: '89 ft', length: 1068 },
];

export function LengthControls({ length, width, height, onChange }: Props) {
  const { isDark, palette } = useTheme();

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';
  const cardBg = isDark ? '#0D1117' : '#ffffff';

  return (
    <div className="space-y-4">
      <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Vehicle Dimensions
      </div>

      {/* Length Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: text, fontWeight: 600, marginBottom: 8 }}>
          Length Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => onChange(preset.length, width, height)}
              className="py-2 px-3 rounded-lg transition-all text-sm font-semibold"
              style={{
                background: length === preset.length ? palette.primary : cardBg,
                color: length === preset.length ? '#ffffff' : textPrimary,
                border: `1px solid ${length === preset.length ? palette.primary : border}`,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Length Slider */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: palette.primary + '20', color: palette.primary }}
          >
            <Ruler size={18} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>Length</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
              {(length / 12).toFixed(1)}'
              <span style={{ fontSize: '13px', color: text, fontWeight: 400, marginLeft: 4 }}>
                ({length}")
              </span>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="360"
          max="1200"
          step="12"
          value={length}
          onChange={e => onChange(Number(e.target.value), width, height)}
          className="w-full"
          style={{ accentColor: palette.primary }}
        />
      </div>

      {/* Width Slider */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: palette.accent + '20', color: palette.accent }}
          >
            <ArrowLeftRight size={18} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>Width</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
              {(width / 12).toFixed(1)}'
              <span style={{ fontSize: '13px', color: text, fontWeight: 400, marginLeft: 4 }}>
                ({width}")
              </span>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="96"
          max="144"
          step="6"
          value={width}
          onChange={e => onChange(length, Number(e.target.value), height)}
          className="w-full"
          style={{ accentColor: palette.accent }}
        />
      </div>

      {/* Height Slider */}
      <div className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: palette.secondary + '20', color: palette.secondary }}
          >
            <ArrowUpDown size={18} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', fontWeight: 600 }}>Height</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
              {(height / 12).toFixed(1)}'
              <span style={{ fontSize: '13px', color: text, fontWeight: 400, marginLeft: 4 }}>
                ({height}")
              </span>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="120"
          max="240"
          step="6"
          value={height}
          onChange={e => onChange(length, width, Number(e.target.value))}
          className="w-full"
          style={{ accentColor: palette.secondary }}
        />
      </div>
    </div>
  );
}