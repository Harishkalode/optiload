import React, { useState } from 'react';
import { Sun, Moon, Monitor, Check, Palette, Eye, RotateCcw } from 'lucide-react';
import { useTheme, PALETTES, PaletteName, ColorMode } from '../contexts/ThemeContext';
import { OLCard, OLCardHeader } from '../components/ui/OLCard';
import { OLButton } from '../components/ui/OLButton';
import { toast } from 'sonner';

export function Settings() {
  const {
    colorMode, setColorMode, palette, setPalette, isDark,
    selectionHighlight, setSelectionHighlight,
    tableRowHighlight, setTableRowHighlight,
  } = useTheme();

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const inputBg = isDark ? '#0D1117' : '#F8FAFC';

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: textPrimary,
    borderRadius: 8, padding: '8px 12px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace',
    outline: 'none',
  };

  const MODE_OPTIONS: { mode: ColorMode; icon: React.FC<any>; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'auto', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="p-3 sm:p-6 max-w-full lg:max-w-4xl space-y-4 sm:space-y-6">
      {/* Appearance */}
      <OLCard padding="24px">
        <OLCardHeader title="Appearance" subtitle="Control visual theme and color mode" />

        <div className="mb-6">
          <div style={{ fontSize: '12px', fontWeight: 600, color: text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Color Mode</div>
          <div className="grid grid-cols-3 gap-3" style={{ maxWidth: 320 }}>
            {MODE_OPTIONS.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{
                  background: colorMode === mode ? palette.primary + '20' : (isDark ? '#161D2A' : '#F8FAFC'),
                  border: `2px solid ${colorMode === mode ? palette.primary : border}`,
                }}
              >
                <Icon size={20} style={{ color: colorMode === mode ? palette.primary : text }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: colorMode === mode ? palette.primary : text }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Color Palette</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PALETTES.map(p => (
              <button
                key={p.name}
                onClick={() => { setPalette(p.name); toast.success(`Theme: ${p.label}`); }}
                className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                style={{
                  background: palette.name === p.name ? p.primary + '15' : (isDark ? '#161D2A' : '#F8FAFC'),
                  border: `2px solid ${palette.name === p.name ? p.primary : border}`,
                }}
              >
                <div className="flex gap-1 flex-shrink-0">
                  {[p.primary, p.secondary, p.accent].map((c, i) => (
                    <div key={i} className="rounded-full" style={{ width: 12, height: 12, background: c }} />
                  ))}
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: palette.name === p.name ? p.primary : textPrimary }}>{p.label}</div>
                </div>
                {palette.name === p.name && <Check size={14} style={{ color: p.primary, flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>
      </OLCard>

      {/* Custom Highlights */}
      <OLCard padding="24px">
        <OLCardHeader title="Custom Highlight Colors" subtitle="Fine-tune selection and highlight colors" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'Selection Highlight', desc: 'Color for selected items', value: selectionHighlight, onChange: setSelectionHighlight },
            { label: 'Table Row Highlight', desc: 'Hover and row highlight color', value: tableRowHighlight, onChange: setTableRowHighlight },
          ].map(({ label, desc, value, onChange }) => (
            <div key={label}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: textPrimary, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '11px', color: text, marginBottom: 10 }}>{desc}</div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="color" value={value.slice(0, 7)} onChange={e => onChange(e.target.value)}
                    className="rounded-lg cursor-pointer" style={{ width: 44, height: 36, border: `1px solid ${border}`, padding: 2 }} />
                </div>
                <input value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, width: 140 }} placeholder="#000000" />
                <div className="rounded-lg flex-1" style={{ height: 36, background: value, border: `1px solid ${border}` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <OLButton variant="ghost" size="sm" icon={<RotateCcw size={14} />}
            onClick={() => { setSelectionHighlight(palette.highlight); setTableRowHighlight(palette.primary + '20'); toast.success('Reset to palette defaults'); }}>
            Reset to Defaults
          </OLButton>
        </div>
      </OLCard>

      {/* Preview Panel */}
      <OLCard padding="24px">
        <OLCardHeader title="Theme Preview" subtitle="Live preview of current settings" />
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
          {/* Simulated sidebar strip */}
          <div className="flex">
            <div style={{ width: 8, background: palette.accent }} />
            <div className="flex-1 p-4" style={{ background: isDark ? '#161D2A' : '#F8FAFC' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg" style={{ width: 28, height: 28, background: palette.primary }} />
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: textPrimary }}>OptiLoad Preview</div>
              </div>
              <div className="flex gap-2 mb-3">
                {['primary', 'secondary', 'accent', 'success', 'warning', 'error'].map(k => (
                  <div key={k} className="rounded-md px-2 py-1 flex items-center gap-1" style={{ background: (palette as any)[k] + '20', border: `1px solid ${(palette as any)[k]}40` }}>
                    <span style={{ fontSize: '10px', color: (palette as any)[k], fontWeight: 600, textTransform: 'capitalize' }}>{k}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-3" style={{ background: isDark ? '#0D1117' : '#fff', border: `1px solid ${border}` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full" style={{ width: 8, height: 8, background: '#10B981' }} />
                  <div style={{ fontSize: '12px', color: textPrimary, fontWeight: 500 }}>Sample metric card</div>
                  <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: palette.accent, marginLeft: 'auto' }}>91.2%</div>
                </div>
                <div className="rounded-full" style={{ height: 4, background: isDark ? '#1E2A38' : '#E2E8F0' }}>
                  <div style={{ width: '91.2%', height: '100%', background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})`, borderRadius: 9999 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </OLCard>

      {/* Organization Settings */}
      <OLCard padding="24px">
        <OLCardHeader title="Organization" subtitle="RailCorp Inc. workspace settings" />
        <div className="space-y-4">
          {[
            { label: 'Organization Name', value: 'RailCorp Inc.' },
            { label: 'Subdomain', value: 'railcorp' },
            { label: 'Timezone', value: 'America/Chicago (CST)' },
          ].map(({ label, value }) => (
            <div key={label} className="grid grid-cols-2 gap-4 items-center">
              <label style={{ fontSize: '13px', color: textPrimary, fontWeight: 500 }}>{label}</label>
              <input defaultValue={value} style={{ ...inputStyle, fontFamily: 'Inter, sans-serif' }} />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <OLButton variant="primary" size="sm" onClick={() => toast.success('Organization settings saved')}>Save Changes</OLButton>
          </div>
        </div>
      </OLCard>
    </div>
  );
}