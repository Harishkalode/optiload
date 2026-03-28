import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Upload, Download, Truck, Eye, Edit3, Copy,
  Archive, Trash2, Filter, CheckSquare, Square, ChevronDown,
  X, AlertTriangle, ToggleLeft, ToggleRight, Info, Hammer
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import { OLModal } from '../components/ui/OLModal';
import { toast } from 'sonner';
import { validateVehicleForm, type VehicleFormErrors } from '../engine/AAREngine';
import { createVehicle, listVehicles } from '../services/vehicleService';
import { fetchVehicleTypes } from '../services/domainApi';

const STATUS_OPTS = ['All Status', 'Active', 'Maintenance', 'Inactive'];

interface VehicleFormData {
  name: string; type: string; length: string; width: string; height: string;
  maxWeight: string; axles: string; hazmat: boolean; fragile: boolean; refrigerated: boolean;
}

const defaultForm: VehicleFormData = { name: '', type: 'container', length: '', width: '', height: '', maxWeight: '', axles: '4', hazmat: false, fragile: false, refrigerated: false };

export function Vehicles() {
  const { isDark, palette } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<VehicleFormErrors>({});
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTypeOpts, setVehicleTypeOpts] = useState<{ value: string; label: string }[]>([]);

  const loadVehicles = async () => {
    const apiVehicles = await listVehicles();
    setVehicles(apiVehicles);
  };

  useEffect(() => {
    void loadVehicles();
    void fetchVehicleTypes().then(r => setVehicleTypeOpts(r.items)).catch(() => setVehicleTypeOpts([]));
  }, []);

  const typeSelectOptions = useMemo(() => ['All Types', ...vehicleTypeOpts.map(o => o.value)], [vehicleTypeOpts]);

  const bg = isDark ? '#080D13' : '#F1F5F9';
  const cardBg = isDark ? '#0D1117' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const inputBg = isDark ? '#0D1117' : '#F8FAFC';
  const rowHover = isDark ? '#0D1117' : '#F8FAFC';

  const filtered = useMemo(() => vehicles.filter(v => {
    const displayName = `Vehicle ${v.id}`;
    const matchSearch = displayName.toLowerCase().includes(search.toLowerCase()) || String(v.id).includes(search.toLowerCase());
    const matchType = typeFilter === 'All Types' || v.type === typeFilter;
    const matchStatus = statusFilter === 'All Status' || 'active' === statusFilter.toLowerCase();
    return matchSearch && matchType && matchStatus;
  }), [vehicles, search, typeFilter, statusFilter]);

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(v => String(v.id))));

  const handleSave = async () => {
    setSaving(true);
    const errors = validateVehicleForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSaving(false);
      return;
    }
    await createVehicle({
      type: formData.type.toLowerCase(),
      dimensions: {
        length: Number(formData.length || 0),
        width: Number(formData.width || 0),
        height: Number(formData.height || 0),
      },
      capacity: Number(formData.maxWeight || 0),
    });
    await loadVehicles();
    setSaving(false);
    setShowForm(false);
    setFormData(defaultForm);
    toast.success(editVehicle ? 'Vehicle updated successfully' : 'Vehicle added to fleet');
  };

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(r => setTimeout(r, 800));
    setDeleting(false);
    setDeleteTarget(null);
    toast.success('Vehicle archived successfully');
  };

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: textPrimary,
    borderRadius: 8, padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif',
    outline: 'none', width: '100%',
  };

  const FormField = ({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) => (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>{label}</label>
        {help && <Info size={12} style={{ color: text }} title={help} />}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span style={{ fontSize: '13px', color: textPrimary }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ color: value ? palette.primary : text }}>
        {value ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );

  return (
    <div className="p-3 sm:p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: text }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles..."
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
          {typeSelectOptions.map(t => <option key={t} value={t}>{t === 'All Types' ? t : vehicleTypeOpts.find(o => o.value === t)?.label ?? t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
          {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <OLButton variant="ghost" size="sm" icon={<Upload size={14} />}>Import</OLButton>
          <OLButton variant="secondary" size="sm" icon={<Download size={14} />}>Export</OLButton>
          <OLButton variant="secondary" size="sm" icon={<Hammer size={14} />} onClick={() => navigate('/vehicles/create')}>Create Vehicle</OLButton>
          <OLButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditVehicle(null); setFormData(defaultForm); setShowForm(true); }}>Add Vehicle</OLButton>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: palette.primary + '15', border: `1px solid ${palette.primary}30` }}>
          <span style={{ fontSize: '13px', color: palette.accent, fontWeight: 500 }}>{selected.size} selected</span>
          <div className="flex gap-2">
            <OLButton variant="ghost" size="sm" icon={<Archive size={13} />} onClick={() => { setSelected(new Set()); toast.success('Vehicles archived'); }}>Archive</OLButton>
            <OLButton variant="ghost" size="sm" icon={<Download size={13} />}>Export</OLButton>
            <OLButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => { setSelected(new Set()); toast.success('Vehicles deleted'); }}>Delete</OLButton>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto" style={{ color: text }}><X size={16} /></button>
        </div>
      )}

      {/* Table */}
      <OLCard padding="0">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                <th className="px-4 py-3 text-left w-10">
                  <button onClick={toggleAll}>
                    {selected.size === filtered.length && filtered.length > 0
                      ? <CheckSquare size={15} style={{ color: palette.primary }} />
                      : <Square size={15} style={{ color: text }} />}
                  </button>
                </th>
                {['Vehicle ID', 'Name', 'Type', 'Dimensions', 'Max Weight', 'Axles', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, color: text, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={String(v.id)} style={{ borderBottom: `1px solid ${border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  className="transition-colors"
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(String(v.id))}>
                      {selected.has(String(v.id))
                        ? <CheckSquare size={15} style={{ color: palette.primary }} />
                        : <Square size={15} style={{ color: text }} />}
                    </button>
                  </td>
                  <td className="px-4 py-3"><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent }}>V-{String(v.id).padStart(3, '0')}</span></td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary, fontWeight: 500 }}>{`Vehicle ${v.id}`}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 w-fit" style={{ background: isDark ? '#1E2A38' : '#F1F5F9', fontSize: '11px', color: text }}>
                      <Truck size={11} />
                      {v.type}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: '12px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{`${v.dimensions.length ?? '-'} × ${v.dimensions.width ?? '-'} × ${v.dimensions.height ?? '-'}m`}</td>
                  <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary }}>{`${Number(v.capacity).toLocaleString()} kg`}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary }}>{'-'}</td>
                  <td className="px-4 py-3">
                    <OLBadge status={'active'} label={'Active'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[{ Icon: Eye, title: 'View', action: () => {} }, { Icon: Edit3, title: 'Edit', action: () => { setEditVehicle(String(v.id)); setFormData({ ...defaultForm, name: `Vehicle ${v.id}`, type: v.type }); setShowForm(true); } }, { Icon: Copy, title: 'Duplicate', action: () => toast.success('Vehicle duplicated') }, { Icon: Archive, title: 'Archive', action: () => toast.success('Vehicle archived') }, { Icon: Trash2, title: 'Delete', action: () => setDeleteTarget(String(v.id)), danger: true }].map(({ Icon, title, action, danger }) => (
                        <button key={title} onClick={action} title={title} className="p-1.5 rounded-md transition-colors"
                          style={{ color: danger ? '#EF4444' : text }}
                          onMouseEnter={e => (e.currentTarget.style.background = danger ? '#EF444415' : isDark ? '#1E2A38' : '#F1F5F9')}
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
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${border}` }}>
          <span style={{ fontSize: '12px', color: text }}>{filtered.length} vehicles</span>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ fontSize: '12px', background: p === 1 ? palette.primary : 'transparent', color: p === 1 ? '#fff' : text }}>{p}</button>
            ))}
          </div>
        </div>
      </OLCard>

      {/* Add/Edit Form Modal */}
      <OLModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editVehicle ? `Edit Vehicle ${editVehicle}` : 'Add New Vehicle'}
        subtitle="Configure vehicle specifications and constraints"
        width={580}
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setShowForm(false)}>Cancel</OLButton>,
          <OLButton key="save" variant="primary" loading={saving} onClick={handleSave}>{editVehicle ? 'Update Vehicle' : 'Add Vehicle'}</OLButton>
        ]}
      >
        <div className="space-y-5">
          {/* Basic Info */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Basic Information</div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Vehicle Name">
                <input style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Flatcar Alpha-7" />
                {formErrors.name && <span style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.name}</span>}
              </FormField>
              <FormField label="Vehicle Type">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {['truck', 'trailer', 'van', 'container'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Dimensions</div>
            <div className="grid grid-cols-3 gap-3">
              {[['Length', 'length', 'm'], ['Width', 'width', 'm'], ['Height', 'height', 'm']].map(([label, key, unit]) => (
                <FormField key={key} label={`${label} (${unit})`}>
                  <input style={inputStyle} type="number" value={(formData as any)[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder="0.00" />
                  {(formErrors as any)[key] && <span style={{ color: '#EF4444', fontSize: '11px', display: 'block', marginTop: 4 }}>{(formErrors as any)[key]}</span>}
                </FormField>
              ))}
            </div>
          </div>

          {/* Weight & Axles */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Weight & Configuration</div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Max Weight (kg)" help="Maximum gross weight including vehicle tare">
                <input style={inputStyle} type="number" value={formData.maxWeight} onChange={e => setFormData({ ...formData, maxWeight: e.target.value })} placeholder="80000" />
                {formErrors.maxWeight && <span style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.maxWeight}</span>}
              </FormField>
              <FormField label="Number of Axles">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={formData.axles} onChange={e => setFormData({ ...formData, axles: e.target.value })}>
                  {['2', '4', '6', '8'].map(a => <option key={a}>{a}</option>)}
                </select>
              </FormField>
            </div>
          </div>

          {/* Special Constraints */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Special Constraints</div>
            <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
              {[
                { label: 'Hazmat Certified', key: 'hazmat' },
                { label: 'Fragile Load Only', key: 'fragile' },
                { label: 'Refrigerated', key: 'refrigerated' },
              ].map(({ label, key }) => (
                <div key={key} style={{ padding: '0 12px', borderBottom: `1px solid ${border}` }}>
                  <Toggle label={label} value={(formData as any)[key]} onChange={v => setFormData({ ...formData, [key]: v })} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </OLModal>

      {/* Delete Modal */}
      <OLModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Vehicle"
        subtitle={`Vehicle ${deleteTarget} will be permanently removed.`}
        danger
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</OLButton>,
          <OLButton key="delete" variant="danger" loading={deleting} onClick={handleDelete}>Delete Vehicle</OLButton>
        ]}
      >
        <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
          <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.6 }}>
            This will permanently delete the vehicle and remove it from all active jobs. This action cannot be undone.
          </div>
        </div>
      </OLModal>
    </div>
  );
}