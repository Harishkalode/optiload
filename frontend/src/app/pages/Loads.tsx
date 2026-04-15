import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Grid3X3, List, Package, Trash2, Filter, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import { OLModal } from '../components/ui/OLModal';
import { toast } from 'sonner';
import { validateLoadForm, type LoadFormErrors } from '../engine/AAREngine';
import { createLoad, listLoads, deleteLoad } from '../services/loadService';

const defaultLoad = {
  name: '', customer: '', shape: 'cuboid', length: '', width: '', height: '', diameter: '',
  loadType: 'carton', materialType: 'steel', textureUrl: '', modelUrl: '',
  orientationX: '0', orientationY: '0', orientationZ: '0',
  weight: '', priority: 5, stackable: false, fragile: false, rotatable: true, hazmat: false,
};

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
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadLoads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await listLoads(page, pageSize);
      const arr = Array.isArray(res) ? res : (res as any).items ?? [];
      const t = (res as any).total ?? arr.length;
      setLoads(arr);
      setTotal(t);
    } catch {
      toast.error('Failed to load loads');
    } finally {
      if (!silent) setLoading(false); else setRefreshing(false);
    }
  }, [page, pageSize]);

  useEffect(() => { void loadLoads(); }, [loadLoads]);

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

  const filtered = useMemo(() => loads.filter((l: any) => {
    const matchSearch = search === '' || `Load ${l.id}`.toLowerCase().includes(search.toLowerCase()) || String(l.id).includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || (l.status && l.status.toLowerCase() === statusFilter.toLowerCase());
    const priorityMap: Record<string, number> = { High: 8, Medium: 5, Low: 3 };
    const matchPriority = priorityFilter === 'All' || (l.priority ?? 5) >= priorityMap[priorityFilter];
    return matchSearch && matchStatus && matchPriority;
  }), [loads, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
    const validationPayload = {
      ...form,
      width: form.shape === 'cylinder' ? form.diameter : form.width,
      height: form.shape === 'cylinder' ? form.diameter : form.height,
    };
    const errors = validateLoadForm(validationPayload);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSaving(false);
      toast.error('Please fix validation errors');
      return;
    }
    setFormErrors({});
    try {
      await createLoad({
        type: form.shape === 'cylinder' ? 'cylinder' : 'cube',
        shape: form.shape as 'cuboid' | 'cylinder' | 'irregular',
        load_type: form.loadType,
        dimensions: {
          length: Number(form.length || 0),
          width: form.shape === 'cylinder' ? Number(form.diameter || 0) : Number(form.width || 0),
          height: form.shape === 'cylinder' ? Number(form.diameter || 0) : Number(form.height || 0),
          ...(form.shape === 'cylinder' ? { radius: Number(form.diameter || 0) / 2 } : {}),
        },
        weight: Number(form.weight || 0),
        quantity: 1,
        diameter: form.shape === 'cylinder' ? Number(form.diameter || 0) : undefined,
        material_type: form.materialType,
        texture_url: form.textureUrl || undefined,
        model_url: form.modelUrl || undefined,
        orientation: {
          x: Number(form.orientationX || 0),
          y: Number(form.orientationY || 0),
          z: Number(form.orientationZ || 0),
        },
        fragile: form.fragile,
        stackable: form.stackable,
      });
      await loadLoads();
      setShowForm(false);
      setForm(defaultLoad);
      toast.success('Load created successfully');
    } catch {
      toast.error('Failed to create load');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLoad(Number(deleteTarget));
      toast.success('Load deleted');
      await loadLoads();
    } catch {
      toast.error('Failed to delete load');
    } finally {
      setDeleteTarget(null);
    }
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
        <OLButton variant="ghost" size="sm" icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />} onClick={() => void loadLoads(false)}>Refresh</OLButton>
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
                {loading ? (
                  <tr><td colSpan={9} className="py-12 text-center" style={{ color: text }}>Loading loads...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center" style={{ color: text }}>No loads found</td></tr>
                ) : filtered.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    className="transition-colors"
                  >
                    <td className="px-4 py-3"><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: palette.accent }}>{l.id}</span></td>
                    <td className="px-4 py-3" style={{ fontSize: '13px', color: textPrimary, fontWeight: 500 }}>{`Load ${l.id}`}</td>
                    <td className="px-4 py-3" style={{ fontSize: '12px', color: text }}>{l.customer || '-'}</td>
                    <td className="px-4 py-3" style={{ fontSize: '11px', color: text, fontFamily: 'JetBrains Mono, monospace' }}>{`${l.dimensions?.length ?? '-'} × ${l.dimensions?.width ?? '-'} × ${l.dimensions?.height ?? '-'}m`}</td>
                    <td className="px-4 py-3" style={{ fontSize: '12px', color: textPrimary }}>{l.weight}</td>
                    <td className="px-4 py-3"><PriorityBar value={l.priority ?? 5} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {l.stackable && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#10B98115', color: '#10B981' }}>Stack</span>}
                        {l.fragile && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#F59E0B15', color: '#D97706' }}>Fragile</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OLBadge status={l.status === 'ready' ? 'success' : l.status === 'assigned' ? 'info' : 'neutral'} label={(l.status || 'ready').charAt(0).toUpperCase() + (l.status || 'ready').slice(1)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {[Trash2].map((Icon, i) => (
                          <button key={i} className="p-1.5 rounded-md transition-colors"
                            style={{ color: '#EF4444' }}
                            onClick={() => setDeleteTarget(String(l.id))}
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
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${border}` }}>
            <span style={{ fontSize: '12px', color: text }}>Showing {filtered.length} of {total} loads</span>
            <div className="flex gap-1 items-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ fontSize: '12px', background: 'transparent', color: page === 1 ? text : textPrimary, opacity: page === 1 ? 0.4 : 1 }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{ fontSize: '12px', background: p === page ? palette.primary : 'transparent', color: p === page ? '#fff' : text }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ fontSize: '12px', background: 'transparent', color: page === totalPages ? text : textPrimary, opacity: page === totalPages ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        </OLCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((l: any) => (
            <OLCard key={l.id} hover padding="16px">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, background: palette.primary + '18' }}>
                  <Package size={18} style={{ color: palette.primary }} />
                </div>
                <OLBadge status={l.status === 'ready' ? 'success' : l.status === 'assigned' ? 'info' : 'neutral'} label={(l.status || 'ready').charAt(0).toUpperCase() + (l.status || 'ready').slice(1)} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: palette.accent, marginBottom: 4 }}>{l.id}</div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: textPrimary, marginBottom: 2 }}>{`Load ${l.id}`}</div>
              <div style={{ fontSize: '11px', color: text, marginBottom: 10 }}>{l.customer || '-'}</div>
              <div className="space-y-1.5 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                <div className="flex justify-between"><span style={{ fontSize: '11px', color: text }}>Weight</span><span style={{ fontSize: '11px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{l.weight}</span></div>
                <div className="flex justify-between"><span style={{ fontSize: '11px', color: text }}>Dims</span><span style={{ fontSize: '11px', color: textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{`${l.dimensions?.length ?? '-'} × ${l.dimensions?.width ?? '-'} × ${l.dimensions?.height ?? '-'}m`}</span></div>
                <div className="flex justify-between items-center"><span style={{ fontSize: '11px', color: text }}>Priority</span><PriorityBar value={l.priority ?? 5} /></div>
              </div>
            </OLCard>
          ))}
        </div>
      )}

      <OLModal open={showForm} onClose={() => setShowForm(false)} title="Add New Load" subtitle="Define load specifications and handling constraints" width={560}
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setShowForm(false)}>Cancel</OLButton>,
          <OLButton key="save" variant="primary" loading={saving} onClick={handleSave}>Create Load</OLButton>
        ]}>
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
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Shape</label>
                <select
                  style={inputStyle}
                  value={form.shape}
                  onChange={e => setForm({ ...form, shape: e.target.value })}
                >
                  <option value="cuboid">Cuboid</option>
                  <option value="cylinder">Cylinder</option>
                  <option value="irregular" disabled>Irregular (coming soon)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Load Type</label>
                <select style={inputStyle} value={form.loadType} onChange={e => setForm({ ...form, loadType: e.target.value })}>
                  {['carton', 'pallet', 'roll', 'coil', 'drum', 'pipe', 'lumber'].map((kind) => (
                    <option key={kind} value={kind}>{kind}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div style={{ border: `1px dashed ${border}`, borderRadius: 8, padding: 10, fontSize: 11, color: text }}>
                {form.shape === 'cylinder' ? 'Preview: circular footprint with length along X axis.' : 'Preview: rectangular footprint (L×W×H).'}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Material</label>
                <select style={inputStyle} value={form.materialType} onChange={e => setForm({ ...form, materialType: e.target.value })}>
                  {['steel', 'wood', 'paper', 'plastic', 'mixed'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Length</label><input style={inputStyle} type="number" step="0.01" value={form.length} onChange={e => setForm({ ...form, length: e.target.value })} placeholder="0.00" /></div>
              {form.shape === 'cylinder' ? (
                <div><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Diameter</label><input style={inputStyle} type="number" step="0.01" value={form.diameter} onChange={e => setForm({ ...form, diameter: e.target.value })} placeholder="0.00" /></div>
              ) : (
                <>
                  <div><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Width</label><input style={inputStyle} type="number" step="0.01" value={form.width} onChange={e => setForm({ ...form, width: e.target.value })} placeholder="0.00" /></div>
                  <div><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Height</label><input style={inputStyle} type="number" step="0.01" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} placeholder="0.00" /></div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Texture URL (optional)</label>
                <input style={inputStyle} value={form.textureUrl} onChange={e => setForm({ ...form, textureUrl: e.target.value })} placeholder="https://.../albedo.jpg" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Model URL (GLB/GLTF)</label>
                <input style={inputStyle} value={form.modelUrl} onChange={e => setForm({ ...form, modelUrl: e.target.value })} placeholder="https://.../asset.glb" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Orientation X°</label><input style={inputStyle} type="number" value={form.orientationX} onChange={e => setForm({ ...form, orientationX: e.target.value })} /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Orientation Y°</label><input style={inputStyle} type="number" value={form.orientationY} onChange={e => setForm({ ...form, orientationY: e.target.value })} /></div>
              <div><label style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 6 }}>Orientation Z°</label><input style={inputStyle} type="number" value={form.orientationZ} onChange={e => setForm({ ...form, orientationZ: e.target.value })} /></div>
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

      <OLModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Load" danger
        footer={[
          <OLButton key="cancel" variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</OLButton>,
          <OLButton key="delete" variant="danger" onClick={handleDelete}>Delete Load</OLButton>
        ]}>
        <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
          <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B' }}>Load {deleteTarget} will be permanently deleted and removed from any optimization jobs.</div>
        </div>
      </OLModal>
    </div>
  );
}
