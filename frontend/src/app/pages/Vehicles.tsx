import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Upload, Download, Truck, Eye, Edit3, Copy,
  Trash2, Filter, CheckSquare, Square, ChevronDown,
  X, AlertTriangle, ToggleLeft, ToggleRight, Info, Hammer, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import { OLModal } from '../components/ui/OLModal';
import { toast } from 'sonner';
import { validateVehicleForm, type VehicleFormErrors } from '../engine/AAREngine';
import { createVehicle, listVehicles, updateVehicle, deleteVehicle } from '../services/vehicleService';
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
  const [editVehicle, setEditVehicle] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<VehicleFormErrors>({});
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTypeOpts, setVehicleTypeOpts] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadVehicles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await listVehicles(page, pageSize);
      const arr = Array.isArray(res) ? res : (res as any).items ?? [];
      const t = (res as any).total ?? arr.length;
      setVehicles(arr);
      setTotal(t);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      if (!silent) setLoading(false); else setRefreshing(false);
    }
  }, [page, pageSize]);

  useEffect(() => { void loadVehicles(); }, [loadVehicles]);
  useEffect(() => { void fetchVehicleTypes().then(r => setVehicleTypeOpts(r.items ?? [])).catch(() => setVehicleTypeOpts([])); }, []);

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
    const matchSearch = search === '' || displayName.toLowerCase().includes(search.toLowerCase()) || String(v.id).includes(search.toLowerCase());
    const matchType = typeFilter === 'All Types' || v.type === typeFilter;
    const matchStatus = statusFilter === 'All Status' || (v.status && v.status.toLowerCase() === statusFilter.toLowerCase());
    return matchSearch && matchType && matchStatus;
  }), [vehicles, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
    const payload = {
      type: formData.type.toLowerCase(),
      dimensions: {
        length: Number(formData.length || 0),
        width: Number(formData.width || 0),
        height: Number(formData.height || 0),
      },
      capacity: Number(formData.maxWeight || 0),
    };
    try {
      if (editVehicle) {
        await updateVehicle(editVehicle.id, payload);
        toast.success('Vehicle updated successfully');
      } else {
        await createVehicle(payload);
        toast.success('Vehicle added to fleet');
      }
      await loadVehicles();
      setShowForm(false);
      setEditVehicle(null);
      setFormData(defaultForm);
    } catch {
      toast.error(editVehicle ? 'Failed to update vehicle' : 'Failed to create vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVehicle(Number(deleteTarget));
      toast.success('Vehicle deleted');
      await loadVehicles();
    } catch {
      toast.error('Failed to delete vehicle');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (v: any) => {
    try {
      await createVehicle({ type: v.type, dimensions: v.dimensions, capacity: v.capacity });
      toast.success('Vehicle duplicated');
      await loadVehicles();
    } catch {
      toast.error('Failed to duplicate vehicle');
    }
  };

  const handleExport = () => {
    if (vehicles.length === 0) { toast.info('No vehicles to export'); return; }
    const headers = ['ID', 'Type', 'Length', 'Width', 'Height', 'Capacity (kg)', 'Axles'];
    const rows = vehicles.map(v => [
      v.id, v.type, v.dimensions?.length ?? '', v.dimensions?.width ?? '',
      v.dimensions?.height ?? '', v.capacity ?? '', '4'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vehicles_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        let items: any[] = [];
        if (file.name.endsWith('.json')) {
          items = JSON.parse(text);
        } else {
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',');
            const obj: Record<string, string> = {};
            headers.forEach((h, idx) => { obj[h] = vals[idx]?.trim() ?? ''; });
            items.push(obj);
          }
        }
        let success = 0;
        for (const item of items) {
          await createVehicle({
            type: (item.type || 'container').toLowerCase(),
            dimensions: {
              length: Number(item.length || item.dimensions_length || 0),
              width: Number(item.width || item.dimensions_width || 0),
              height: Number(item.height || item.dimensions_height || 0),
            },
            capacity: Number(item.capacity || item.max_weight || 0),
          });
          success++;
        }
        toast.success(`Imported ${success} vehicle(s)`);
        await loadVehicles();
      } catch {
        toast.error('Import failed. Check file format.');
      }
    };
    input.click();
  };

  const handleEdit = (v: any) => {
    setEditVehicle(v);
    setFormData({
      name: `Vehicle ${v.id}`,
      type: v.type || 'container',
      length: String(v.dimensions?.length ?? ''),
      width: String(v.dimensions?.width ?? ''),
      height: String(v.dimensions?.height ?? ''),
      maxWeight: String(v.capacity ?? ''),
      axles: '4',
      hazmat: false, fragile: false, refrigerated: false,
    });
    setShowForm(true);
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
          <OLButton variant="ghost" size="sm" icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />} onClick={() => void loadVehicles(false)}>Refresh</OLButton>
          <OLButton variant="ghost" size="sm" icon={<Upload size={14} />} onClick={handleImport}>Import</OLButton>
          <OLButton variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExport}>Export</OLButton>
          <OLButton variant="secondary" size="sm" icon={<Hammer size={14} />} onClick={() => navigate('/vehicles/create')}>Create Vehicle</OLButton>
          <OLButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditVehicle(null); setFormData(defaultForm); setShowForm(true); }}>Add Vehicle</OLButton>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: palette.primary + '15', border: `1px solid ${palette.primary}30` }}>
          <span style={{ fontSize: '13px', color: palette.accent, fontWeight: 500 }}>{selected.size} selected</span>
          <div className="flex gap-2">
            <OLButton variant="ghost" size="sm" icon={<Download size={13} />} onClick={handleExport}>Export</OLButton>
            <OLButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => { setSelected(new Set()); toast.success('Vehicles deleted'); }}>Delete</OLButton>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto" style={{ color: text }}><X size={16} /></button>
        </div>
      )}

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
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center" style={{ color: text }}>Loading vehicles...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center" style={{ color: text }}>No vehicles found</td></tr>
              ) : filtered.map((v: any) => (
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
                      <Truck size={11} />{v.type}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: '12px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{`${v.dimensions?.length ?? '-'} × ${v.dimensions?.width ?? '-'} × ${v.dimensions?.height ?? '-'}m`}</td>
                  <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary }}>{`${Number(v.capacity).toLocaleString()} kg`}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary }}>{v.axles ?? '-'}</td>
                  <td className="px-4 py-3"><OLBadge status={'active'} label={v.type || 'Vehicle'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[
                        { Icon: Edit3, title: 'Edit', action: () => handleEdit(v) },
                        { Icon: Copy, title: 'Duplicate', action: () => handleDuplicate(v) },
                        { Icon: Trash2, title: 'Delete', action: () => setDeleteTarget(String(v.id)), danger: true },
                      ].map(({ Icon, title, action, danger }) => (
                        <button key={title} onClick={action} title={title} className="p-1.5 rounded-md transition-colors"
                          style={{ color: danger ? '#EF4444' : text }}
                          onMouseEnter={e => (e.currentTarget.style.background = danger ? '#EF444415' : isDark ? '#1E2A38' : '#F1F5F9')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
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
          <span style={{ fontSize: '12px', color: text }}>Showing {filtered.length} of {total} vehicles</span>
          <div className="flex gap-1 items-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ fontSize: '12px', background: 'transparent', color: page === 1 ? text : textPrimary, opacity: page === 1 ? 0.4 : 1 }}>
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ fontSize: '12px', background: p === page ? palette.primary : 'transparent', color: p === page ? '#fff' : text }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ fontSize: '12px', background: 'transparent', color: page === totalPages ? text : textPrimary, opacity: page === totalPages ? 0.4 : 1 }}>
              ›
            </button>
          </div>
        </div>
      </OLCard>

      <OLModal open={showForm} onClose={() => { setShowForm(false); setEditVehicle(null); }}
        title={editVehicle ? `Edit Vehicle ${editVehicle.id}` : 'Add New Vehicle'}
        subtitle="Configure vehicle specifications and constraints" width={580}
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => { setShowForm(false); setEditVehicle(null); }}>Cancel</OLButton>,
          <OLButton key="save" variant="primary" loading={saving} onClick={handleSave}>{editVehicle ? 'Update Vehicle' : 'Add Vehicle'}</OLButton>
        ]}>
        <div className="space-y-5">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Basic Information</div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Vehicle Name">
                <input style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Flatcar Alpha-7" />
                {formErrors.name && <span style={{ color: '#EF4444', fontSize: '12px' }}>{formErrors.name}</span>}
              </FormField>
              <FormField label="Vehicle Type">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {(vehicleTypeOpts.length > 0 ? vehicleTypeOpts.map(o => o.value) : ['truck', 'trailer', 'van', 'container']).map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </div>
          </div>
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

      <OLModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Vehicle"
        subtitle={`Vehicle ${deleteTarget} will be permanently removed.`} danger
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</OLButton>,
          <OLButton key="delete" variant="danger" loading={deleting} onClick={handleDelete}>Delete Vehicle</OLButton>
        ]}>
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
