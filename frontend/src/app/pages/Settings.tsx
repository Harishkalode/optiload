import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor, Check, RotateCcw, Loader2, Building2, Save, Zap } from 'lucide-react';
import { useTheme, PALETTES, PaletteName, ColorMode } from '../contexts/ThemeContext';
import { OLCard, OLCardHeader } from '../components/ui/OLCard';
import { OLButton } from '../components/ui/OLButton';
import { toast } from 'sonner';
import { fetchOrganization, updateOrganization, type OrgRow } from '../services/organizationService';

export function Settings() {
  const {
    colorMode, setColorMode, palette, setPalette, isDark,
    selectionHighlight, setSelectionHighlight,
    tableRowHighlight, setTableRowHighlight,
  } = useTheme();

  // Organization state
  const [org, setOrg] = useState<Partial<OrgRow> | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgForm, setOrgForm] = useState<Partial<OrgRow>>({});

  const [demoEnabled, setDemoEnabled] = useState(() => localStorage.getItem('optiload_demo_mode') === 'true');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOrganization();
        setOrg(data);
        setOrgForm(data);
      } catch {
        toast.error('Failed to load organization settings');
      } finally {
        setOrgLoading(false);
      }
    };
    void load();
  }, []);

  const handleSaveOrg = useCallback(async () => {
    setOrgSaving(true);
    try {
      const payload: Partial<OrgRow> = {};
      if (orgForm.name !== org?.name) payload.name = orgForm.name;
      if (orgForm.timezone !== org?.timezone) payload.timezone = orgForm.timezone;
      if (orgForm.contact_email !== org?.contact_email) payload.contact_email = orgForm.contact_email;
      if (orgForm.contact_phone !== org?.contact_phone) payload.contact_phone = orgForm.contact_phone;
      if (orgForm.address !== org?.address) payload.address = orgForm.address;
      if (orgForm.city !== org?.city) payload.city = orgForm.city;
      if (orgForm.state !== org?.state) payload.state = orgForm.state;
      if (orgForm.country !== org?.country) payload.country = orgForm.country;
      if (orgForm.postal_code !== org?.postal_code) payload.postal_code = orgForm.postal_code;
      if (Object.keys(payload).length === 0) { toast.info('No changes to save'); setOrgSaving(false); return; }
      await updateOrganization(payload);
      setOrg(prev => prev ? { ...prev, ...payload } : payload);
      toast.success('Organization settings saved');
    } catch {
      toast.error('Failed to save organization settings');
    } finally {
      setOrgSaving(false);
    }
  }, [orgForm, org]);

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const inputBg = isDark ? '#0D1117' : '#F8FAFC';

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: textPrimary,
    borderRadius: 8, padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif',
    outline: 'none', width: '100%',
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
                <input value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, width: 140, fontFamily: 'JetBrains Mono, monospace' }} placeholder="#000000" />
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

      {/* Theme Preview */}
      <OLCard padding="24px">
        <OLCardHeader title="Theme Preview" subtitle="Live preview of current settings" />
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
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

      {/* Demo Mode */}
      <OLCard padding="24px">
        <OLCardHeader title="Demo Mode" subtitle="Enable demo templates for optimization results (session only, resets on logout)" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={20} style={{ color: palette.accent }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>Demo Mode</div>
              <div style={{ fontSize: '11px', color: text }}>
                {demoEnabled ? 'On — optimizations return demo results' : 'Off — optimizations run real algorithms'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !demoEnabled;
              setDemoEnabled(next);
              localStorage.setItem('optiload_demo_mode', next ? 'true' : '');
              toast.success(next ? 'Demo mode enabled (session only)' : 'Demo mode disabled');
            }}
            className="rounded-full transition-all"
            style={{
              width: 48, height: 26, position: 'relative', border: 'none', cursor: 'pointer',
              background: demoEnabled ? palette.primary : (isDark ? '#334155' : '#CBD5E1'),
            }}
          >
            <div className="rounded-full shadow-sm transition-all" style={{
              width: 22, height: 22, position: 'absolute', top: 2,
              left: demoEnabled ? 24 : 2, background: '#fff',
            }} />
          </button>
        </div>
      </OLCard>

      {/* Organization Settings */}
      <OLCard padding="24px">
        <OLCardHeader title="Organization" subtitle={orgLoading ? 'Loading...' : `${org?.name || 'Organization'} settings`} />
        {orgLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: palette.primary }} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Organization Name', key: 'name' as const, type: 'text' },
                { label: 'Contact Email', key: 'contact_email' as const, type: 'email' },
                { label: 'Contact Phone', key: 'contact_phone' as const, type: 'tel' },
                { label: 'Timezone', key: 'timezone' as const, type: 'text' },
                { label: 'City', key: 'city' as const, type: 'text' },
                { label: 'State', key: 'state' as const, type: 'text' },
                { label: 'Country', key: 'country' as const, type: 'text' },
                { label: 'Postal Code', key: 'postal_code' as const, type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: text, marginBottom: 4, display: 'block' }}>{label}</label>
                  <input
                    type={type}
                    value={orgForm[key] || ''}
                    onChange={e => setOrgForm(f => ({ ...f, [key]: e.target.value }))}
                    style={inputStyle}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: text, marginBottom: 4, display: 'block' }}>Address</label>
              <textarea
                value={orgForm.address || ''}
                onChange={e => setOrgForm(f => ({ ...f, address: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Street address"
              />
            </div>

            {/* Read-only info */}
            <div className="flex flex-wrap gap-4 pt-2" style={{ borderTop: `1px solid ${border}` }}>
              <div>
                <span style={{ fontSize: '11px', color: text }}>Plan: </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, textTransform: 'capitalize' }}>{org?.plan_type}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: text }}>Status: </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, textTransform: 'capitalize' }}>{org?.status}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: text }}>Max Users: </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>{org?.max_users}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <OLButton
                variant="primary"
                size="sm"
                icon={orgSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                disabled={orgSaving}
                onClick={handleSaveOrg}
              >
                {orgSaving ? 'Saving...' : 'Save Changes'}
              </OLButton>
            </div>
          </div>
        )}
      </OLCard>
    </div>
  );
}
