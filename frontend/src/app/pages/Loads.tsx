import React, { useState } from 'react';
import { Search, Plus, Grid3X3, List, Package, Eye, Edit3, Copy, Archive, Trash2, ToggleLeft, ToggleRight, AlertTriangle, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import { OLModal } from '../components/ui/OLModal';
import { toast } from 'sonner';
import { validateLoadForm, type LoadFormErrors } from '../engine/AAREngine';

const LOADS = [
  { id: 'L-0441', name: 'Steel Coil Batch A', customer: 'MetalWorks Ltd', dims: '2.1 × 1.8 × 1.8m', weight: '12,400 kg', priority: 8, stackable: false, fragile: false, status: 'ready' },
  { id: 'L-0442', name: 'Automotive Parts Box', customer: 'AutoGroup', dims: '1.2 × 0.8 × 1.0m', weight: '840 kg', priority: 6, stackable: true, fragile: true, status: 'ready' },
  { id: 'L-0443', name: 'Grain Bulk Unit', customer: 'AgriSupply', dims: '3.0 × 2.4 × 2.0m', weight: '24,000 kg', priority: 9, stackable: false, fragile: false, status: 'assigned' },
  { id: 'L-0444', name: 'Chemical Drums Set', customer: 'ChemCo', dims: '1.0 × 1.0 × 1.2m', weight: '2,200 kg', priority: 7, stackable: true, fragile: true, status: 'ready' },
  { id: 'L-0445', name: 'Timber Planks Bundle', customer: 'ForestryInc', dims: '4.0 × 0.6 × 0.5m', weight: '3,600 kg', priority: 4, stackable: true, fragile: false, status: 'pending' },
  { id: 'L-0446', name: 'Machinery Crate', customer: 'IndustrialMech', dims: '2.4 × 1.6 × 2.0m', weight: '18,000 kg', priority: 10, stackable: false, fragile: true, status: 'ready' },
];

const defaultLoad = { name: '', customer: '', length: '', width: '', height: '', weight: '', priority: 5, stackable: false, fragile: false, rotatable: true, hazmat: false };

export function Loads() {
  const { isDark, palette } = useTheme();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState(defaultLoad);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<LoadFormErrors>({});

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const inputBg = isDark ? '#0D1117' : '#F8FAFC';
  const rowHover = isDark ? '#0D1117' : '#F8FAFC';

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: textPrimary,
    borderRadius: 8, padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif',
    outline: 'none', width: '100%',
  };

  const filtered = LOADS.filter(l =>
    (search === '' || l.name.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'All' || l.status === statusFilter.toLowerCase()) &&
    (priorityFilter === 'All' || (priorityFilter === 'High' && l.priority >= 8) || (priorityFilter === 'Medium' && l.priority >= 5 && l.priority < 8) || (priorityFilter === 'Low' && l.priority < 5))
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span style={{ fontSize: '13px', color: textPrimary }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ color: value ? palette.primary : text }}>
        {value ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    const errors = validateLoadForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSaving(false);
      toast.error('Please fix validation errors');
      return;
    }
    setFormErrors({});
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setShowForm(false);
    toast.success('Load created successfully');
  };

  const PriorityBar = ({ value }: { value: number }) => (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ width: 4, height: 12, borderRadius: 2, background: i < value ? (value >= 8 ? '#EF4444' : value >= 5 ? '#F59E0B' : '#10B981') : (isDark ? '#1E2A38' : '#E2E8F0') }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: text }}>{value}/10</span>
    </div>
  );

  return (
    <div className="p-3 sm:p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: text }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loads..."
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
          {['All', 'Ready', 'Assigned', 'Pending'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
          {['All', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
        </select>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: isDark ? '#0D1117' : '#E2E8F0' }}>
          <button onClick={() => setView('table')} className="p-1.5 rounded-md transition-colors" style={{ background: view === 'table' ? (isDark ? '#1E2A38' : '#fff') : 'transparent', color: text }}>
            <List size={15} />
          </button>
          <button onClick={() => setView('grid')} className="p-1.5 rounded-md transition-colors" style={{ background: view === 'grid' ? (isDark ? '#1E2A38' : '#fff') : 'transparent', color: text }}>
            <Grid3X3 size={15} />
          </button>
        </div>
        <OLButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>Add Load</OLButton>
      </div>

      {view === 'table' ? (
        <OLCard padding="0">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {['Load ID', 'Name', 'Customer', 'Dimensions', 'Weight', 'Priority', 'Attributes', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    className="transition-colors"
                  >
                    <td className="px-4 py-3"><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent }}>{l.id}</span></td>
                    <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary, fontWeight: 500 }}>{l.name}</td>
                    <td className="px-4 py-3" style={{ fontSize: '12px', color: text }}>{l.customer}</td>
                    <td className="px-4 py-3" style={{ fontSize: '11px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{l.dims}</td>
                    <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary }}>{l.weight}</td>
                    <td className="px-4 py-3"><PriorityBar value={l.priority} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {l.stackable && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#10B98115', color: '#10B981' }}>Stack</span>}
                        {l.fragile && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#F59E0B15', color: '#D97706' }}>Fragile</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OLBadge status={l.status === 'ready' ? 'success' : l.status === 'assigned' ? 'info' : 'neutral'} label={l.status.charAt(0).toUpperCase() + l.status.slice(1)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {[Eye, Edit3, Copy, Archive, Trash2].map((Icon, i) => (
                          <button key={i} className="p-1.5 rounded-md transition-colors"
                            style={{ color: i === 4 ? '#EF4444' : text }}
                            onClick={() => { if (i === 4) setDeleteTarget(l.id); else toast.success('Action completed'); }}
                            onMouseEnter={e => (e.currentTarget.style.background = i === 4 ? '#EF444415' : isDark ? '#1E2A38' : '#F1F5F9')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Icon size={14} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OLCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(l => (
            <OLCard key={l.id} hover padding="16px">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, background: palette.primary + '18' }}>
                  <Package size={18} style={{ color: palette.primary }} />
                </div>
                <OLBadge status={l.status === 'ready' ? 'success' : l.status === 'assigned' ? 'info' : 'neutral'} label={l.status.charAt(0).toUpperCase() + l.status.slice(1)} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: palette.accent, marginBottom: 4 }}>{l.id}</div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: textPrimary, marginBottom: 2 }}>{l.name}</div>
              <div style={{ fontSize: '11px', color: text, marginBottom: 10 }}>{l.customer}</div>
              <div className="space-y-1.5 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                <div className="flex justify-between"><span style={{ fontSize: '11px', color: text }}>Weight</span><span style={{ fontSize: '11px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{l.weight}</span></div>
                <div className="flex justify-between"><span style={{ fontSize: '11px', color: text }}>Dims</span><span style={{ fontSize: '11px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{l.dims}</span></div>
                <div className="flex justify-between items-center"><span style={{ fontSize: '11px', color: text }}>Priority</span><PriorityBar value={l.priority} /></div>
              </div>
            </OLCard>
          ))}
        </div>
      )}

      {/* Add Load Modal */}
      <OLModal open={showForm} onClose={() => setShowForm(false)} title="Add New Load" subtitle="Define load specifications and handling constraints" width={560}
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setShowForm(false)}>Cancel</OLButton>,
          <OLButton key="save" variant="primary" loading={saving} onClick={handleSave}>Create Load</OLButton>
        ]}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Load Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Steel Coil Batch A" />
              {formErrors.name && <span style={{ color: '#EF4444', fontSize: '11px', display: 'block', marginTop: 4 }}>{formErrors.name}</span>}
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Customer</label>
              <input style={inputStyle} value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="Customer name" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Dimensions (meters)</div>
            <div className="grid grid-cols-3 gap-3">
              {[['Length', 'length'], ['Width', 'width'], ['Height', 'height']].map(([l, k]) => (
                <div key={k}><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>{l}</label><input style={inputStyle} type="number" step="0.01" value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder="0.00" /></div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Weight (kg)</label>
              <input style={inputStyle} type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="0" />
              {formErrors.weight && <span style={{ color: '#EF4444', fontSize: '11px', display: 'block', marginTop: 4 }}>{formErrors.weight}</span>}
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Priority Score: {form.priority}/10</label>
              <input type="range" min="1" max="10" value={form.priority} onChange={e => setForm({ ...form, priority: +e.target.value })} className="w-full" style={{ accentColor: palette.primary }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Handling Rules</div>
            <div style={{ border: `1px solid ${border}`, borderRadius: 8 }}>
              {[['Stackable', 'stackable'], ['Fragile', 'fragile'], ['Rotation Allowed', 'rotatable'], ['Hazmat', 'hazmat']].map(([label, key]) => (
                <div key={key} style={{ padding: '4px 12px', borderBottom: `1px solid ${border}` }}>
                  <Toggle label={label} value={(form as any)[key]} onChange={v => setForm({ ...form, [key]: v })} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </OLModal>

      {/* Delete Modal */}
      <OLModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Load" danger
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</OLButton>,
          <OLButton key="delete" variant="danger" onClick={() => { setDeleteTarget(null); toast.success('Load deleted'); }}>Delete Load</OLButton>
        ]}
      >
        <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
          <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B' }}>Load {deleteTarget} will be permanently deleted and removed from any optimization jobs.</div>
        </div>
      </OLModal>
    </div>
  );
}