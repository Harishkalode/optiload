import { useState } from 'react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bogie } from '../../pages/VehicleCreator';

interface Props {
  bogies: Bogie[];
  onChange: (bogies: Bogie[]) => void;
}

export function AxleSelector({ bogies, onChange }: Props) {
  const { isDark, palette } = useTheme();
  const [editingBogie, setEditingBogie] = useState<string | null>(null);

  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const inputBg = isDark ? '#060B10' : '#F8FAFC';

  const addBogie = () => {
    const newBogie: Bogie = {
      id: `b${Date.now()}`,
      position: 50,
      axleCount: 2,
      maxAxleLoad: 50000,
      suspensionType: 'spring',
    };
    onChange([...bogies, newBogie]);
  };

  const removeBogie = (id: string) => {
    onChange(bogies.filter(b => b.id !== id));
  };

  const updateBogie = (id: string, updates: Partial<Bogie>) => {
    onChange(bogies.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Bogie Configuration
        </div>
        <button
          onClick={addBogie}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
          style={{
            background: palette.primary,
            color: '#ffffff',
          }}
        >
          <Plus size={14} />
          Add Bogie
        </button>
      </div>

      <AnimatePresence>
        {bogies.map((bogie, index) => (
          <motion.div
            key={bogie.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl"
            style={{ background: cardBg, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                Bogie {index + 1}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingBogie(editingBogie === bogie.id ? null : bogie.id)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: editingBogie === bogie.id ? palette.primary : text }}
                >
                  <Settings2 size={16} />
                </button>
                {bogies.length > 1 && (
                  <button
                    onClick={() => removeBogie(bogie.id)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: text }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Position Slider */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label style={{ fontSize: '11px', color: text, fontWeight: 600 }}>Position</label>
                <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>{bogie.position}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={bogie.position}
                onChange={e => updateBogie(bogie.id, { position: Number(e.target.value) })}
                className="w-full"
                style={{
                  accentColor: palette.primary,
                  height: 6,
                  borderRadius: 3,
                }}
              />
            </div>

            {editingBogie === bogie.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 pt-3"
                style={{ borderTop: `1px solid ${border}` }}
              >
                {/* Axle Count */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: text, fontWeight: 600, marginBottom: 6 }}>
                    Axle Count
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map(count => (
                      <button
                        key={count}
                        onClick={() => updateBogie(bogie.id, { axleCount: count })}
                        className="flex-1 py-2 rounded-lg transition-all text-sm font-semibold"
                        style={{
                          background: bogie.axleCount === count ? palette.primary : inputBg,
                          color: bogie.axleCount === count ? '#ffffff' : textPrimary,
                          border: `1px solid ${bogie.axleCount === count ? palette.primary : border}`,
                        }}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Axle Load */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label style={{ fontSize: '11px', color: text, fontWeight: 600 }}>Max Axle Load</label>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
                      {(bogie.maxAxleLoad / 1000).toFixed(0)}K lbs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="70000"
                    step="1000"
                    value={bogie.maxAxleLoad}
                    onChange={e => updateBogie(bogie.id, { maxAxleLoad: Number(e.target.value) })}
                    className="w-full"
                    style={{ accentColor: palette.primary }}
                  />
                </div>

                {/* Suspension Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: text, fontWeight: 600, marginBottom: 6 }}>
                    Suspension Type
                  </label>
                  <select
                    value={bogie.suspensionType}
                    onChange={e => updateBogie(bogie.id, { suspensionType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: inputBg,
                      color: textPrimary,
                      border: `1px solid ${border}`,
                      outline: 'none',
                    }}
                  >
                    <option value="spring">Spring</option>
                    <option value="hydraulic">Hydraulic</option>
                    <option value="air">Air</option>
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
