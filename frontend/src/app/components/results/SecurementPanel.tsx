// """SecurementPanel.tsx - UI for managing securements (straps, airbags, blocks, etc.)"""

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/http';

interface Securement {
  id: number;
  type: string;
  position: [number, number, number];
  load_id: number;
  reason?: string;
  count?: number;
  crush_strength_psf?: number;
  [key: string]: any;
}

interface SecurementPanelProps {
  optimizationId: number;
  suggestedSecurements?: Securement[];
  onSecurementAdded?: (sec: Securement) => void;
  onSecurementDeleted?: (secId: number) => void;
}

const SECUREMENT_TYPES = [
  { value: 'steel_strap', label: 'Steel Strap', category: 'Straps', tooltip: 'High-tension restraint for heavy loads.' },
  { value: 'nonmetallic_strap', label: 'Nonmetallic Strap', category: 'Straps', tooltip: 'Flexible restraint for delicate surfaces.' },
  { value: 'airbag_level_2', label: 'Airbag Level 2 (≤75k lb)', category: 'Airbags', tooltip: 'Void fill for light/moderate forces.' },
  { value: 'airbag_level_3', label: 'Airbag Level 3 (≤160k)', category: 'Airbags', tooltip: 'Medium-duty lateral force dampening.' },
  { value: 'airbag_level_4', label: 'Airbag Level 4 (≤216k)', category: 'Airbags', tooltip: 'Heavy-duty void control for rail motion.' },
  { value: 'airbag_level_5', label: 'Airbag Level 5 (≤216k)', category: 'Airbags', tooltip: 'Max bladder reinforcement class.' },
  { value: 'chock', label: 'Chock Block', category: 'Bars', tooltip: 'Rigid anti-roll base block.' },
  { value: 'riser', label: 'Riser/Pad', category: 'Bars', tooltip: 'Raises and levels contact surfaces.' },
  { value: 'rubber_mat', label: 'Rubber Mat', category: 'Bars', tooltip: 'Adds friction to reduce sliding.' },
  { value: 'void_filler', label: 'Void Filler', category: 'Airbags', tooltip: 'Filler when airbag is not feasible.' },
] as const;

export const SecurementPanel: React.FC<SecurementPanelProps> = ({
  optimizationId,
  suggestedSecurements = [],
  onSecurementAdded,
  onSecurementDeleted,
}) => {
  const [securements, setSecurements] = useState<Securement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Straps' | 'Airbags' | 'Bars'>('All');
  const [undoStack, setUndoStack] = useState<Securement[][]>([]);
  const [redoStack, setRedoStack] = useState<Securement[][]>([]);
  const [formData, setFormData] = useState<Partial<Securement>>({
    type: 'airbag_level_4',
    position: [5, 0.5, 2.5],
    load_id: 0,
  });
  const [loading, setLoading] = useState(false);

  // Load securements on mount
  useEffect(() => {
    fetchSecurements();
  }, [optimizationId]);

  const fetchSecurements = async () => {
    try {
      const data = await apiRequest<{ securements: Securement[] }>(`/optimization/${optimizationId}/securements`);
      setSecurements(data.securements || []);
    } catch (err) {
      console.error('Failed to fetch securements:', err);
    }
  };

  const handleAddSecurement = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ id: number; securement: Securement }>(`/optimization/${optimizationId}/securements`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setUndoStack((prev) => [...prev, securements]);
      setRedoStack([]);
      setSecurements([...securements, data.securement]);
      if (onSecurementAdded) {
        onSecurementAdded(data.securement);
      }
      setShowAddModal(false);
      setFormData({
        type: 'airbag_level_4',
        position: [5, 0.5, 2.5],
        load_id: 0,
      });
    } catch (err) {
      console.error('Failed to add securement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSecurement = async (secId: number) => {
    if (!window.confirm('Delete this securement?')) return;
    try {
      await apiRequest<{ deleted: number }>(
        `/optimization/${optimizationId}/securements/${secId}`,
        { method: 'DELETE' }
      );
      setUndoStack((prev) => [...prev, securements]);
      setRedoStack([]);
      setSecurements(securements.filter(s => s.id !== secId));
      if (onSecurementDeleted) {
        onSecurementDeleted(secId);
      }
    } catch (err) {
      console.error('Failed to delete securement:', err);
    }
  };

  return (
    <div className="securement-panel" style={{
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Securements</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => {
            if (undoStack.length === 0) return;
            const previous = undoStack[undoStack.length - 1];
            setUndoStack(undoStack.slice(0, -1));
            setRedoStack((prev) => [...prev, securements]);
            setSecurements(previous);
          }} disabled={undoStack.length === 0} style={{ padding: '6px 10px', fontSize: 12, opacity: undoStack.length === 0 ? 0.5 : 1 }}>Undo</button>
          <button onClick={() => {
            if (redoStack.length === 0) return;
            const next = redoStack[redoStack.length - 1];
            setRedoStack(redoStack.slice(0, -1));
            setUndoStack((prev) => [...prev, securements]);
            setSecurements(next);
          }} disabled={redoStack.length === 0} style={{ padding: '6px 10px', fontSize: 12, opacity: redoStack.length === 0 ? 0.5 : 1 }}>Redo</button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + Add
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['All', 'Straps', 'Airbags', 'Bars'] as const).map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 12, border: '1px solid #cbd5e1', background: categoryFilter === cat ? '#0ea5e915' : '#fff' }}>{cat}</button>
        ))}
      </div>

      {/* Suggested Securements */}
      {suggestedSecurements.length > 0 && (
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#e7f3ff', borderRadius: '4px', borderLeft: '3px solid #0066cc' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#0066cc' }}>Suggested:</div>
          {suggestedSecurements.map((sec, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                marginBottom: '4px',
                backgroundColor: 'white',
                borderRadius: '3px',
                border: '1px solid #0066cc',
              }}
            >
              <strong>{sec.type}</strong> - {sec.reason}
              <button
                onClick={() => {
                  setFormData(sec);
                  handleAddSecurement();
                }}
                style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  color: '#0066cc',
                  background: 'none',
                  border: '1px solid #0066cc',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current Securements List */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {securements.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '16px' }}>
            No securements added
          </div>
        ) : (
          securements.filter(sec => {
            if (categoryFilter === 'All') return true;
            const meta = SECUREMENT_TYPES.find(t => t.value === sec.type);
            return meta?.category === categoryFilter;
          }).map(sec => (
            <div
              key={sec.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                marginBottom: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{sec.type}</div>
                <div style={{ color: '#666', fontSize: '11px' }}>Load #{sec.load_id}</div>
                {sec.reason && (
                  <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>{sec.reason}</div>
                )}
              </div>
              <button
                onClick={() => handleDeleteSecurement(sec.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Add Securement</h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
                Type
              </label>
              <select
                value={formData.type || ''}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {SECUREMENT_TYPES.filter(t => categoryFilter === 'All' || t.category === categoryFilter).map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {SECUREMENT_TYPES.find(t => t.value === formData.type)?.tooltip}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
                Load ID
              </label>
              <input
                type="number"
                value={formData.load_id || 0}
                onChange={e => setFormData({ ...formData, load_id: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
                Position (X, Y, Z)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[0, 1, 2].map(idx => (
                  <input
                    key={idx}
                    type="number"
                    step="0.1"
                    value={(formData.position?.[idx] || 0).toFixed(2)}
                    onChange={e => {
                      const pos = [...(formData.position || [0, 0, 0])] as [number, number, number];
                      pos[idx] = parseFloat(e.target.value);
                      setFormData({ ...formData, position: pos });
                    }}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSecurement}
                disabled={loading || !formData.load_id}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  opacity: loading || !formData.load_id ? 0.6 : 1,
                }}
              >
                {loading ? 'Adding...' : !formData.load_id ? 'Load ID required' : 'Add Securement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurementPanel;
